/**
 * Supabase Client
 * Singleton instance for Supabase database access
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (matching Supabase schema)
export interface User {
  user_id: string
  name_en: string
  name_bn?: string
  phone: string
  provider: string
  balance: number
  account_age_days: number
  total_transactions: number
  avg_transaction_amount: number
  verified: boolean
  kyc_complete: boolean
  risk_level: 'low' | 'medium' | 'high' | 'suspicious' | 'critical'
  created_at?: string
  updated_at?: string
  last_transaction_at?: string
  is_from_test_dataset?: boolean
  is_test?: boolean
}

export interface Transaction {
  transaction_id: string
  sender_id: string
  receiver_id: string
  amount: number
  transaction_type: 'CASH_OUT' | 'TRANSFER' | 'CASH_IN' | 'PAYMENT' | 'DEBIT'
  old_balance_orig: number
  new_balance_orig: number
  old_balance_dest: number
  new_balance_dest: number
  step?: number
  hour?: number
  transaction_timestamp: string
  fraud_probability?: number
  fraud_decision?: 'pass' | 'warn' | 'block'
  risk_level?: 'low' | 'medium' | 'high'
  model_confidence?: number
  status: 'PENDING' | 'COMPLETED' | 'BLOCKED' | 'REVIEW' | 'FAILED'
  note?: string
  analyst_id?: string
  reviewed_at?: string
  is_simulated?: boolean
}

// Supabase helper functions
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name_en')

  if (error) throw error
  return data || []
}

export const getUser = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Fallback: Try to find user in test_dataset
      const { data: testData, error: testError } = await supabase
        .from('test_dataset')
        .select('*')
        .or(`nameOrig.eq.${userId},nameDest.eq.${userId}`)
        .limit(1)

      if (testData && testData.length > 0) {
        const td = testData[0]
        const isSender = td.nameOrig === userId
        return {
          user_id: userId,
          name_en: isSender ? `Sender ${userId}` : `Receiver ${userId}`,
          name_bn: isSender ? `প্রেরক ${userId}` : `প্রাপক ${userId}`,
          phone: 'N/A',
          provider: 'Mobile Money',
          balance: isSender ? td.oldBalanceOrig : td.oldBalanceDest,
          account_age_days: 0,
          total_transactions: 1,
          avg_transaction_amount: td.amount,
          verified: false,
          kyc_complete: false,
          risk_level: td.isFlaggedFraud ? 'high' : 'low',
          is_from_test_dataset: true
        } as User
      }

      // Fallback 2: Try transaction_history (for engineered dataset / simulation)
      const { data: txHistory } = await supabase
        .from('transaction_history')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .limit(1)

      if (txHistory && txHistory.length > 0) {
        const tx = txHistory[0]
        return {
          user_id: userId,
          name_en: `Simulated User ${userId.slice(0, 4)}`,
          name_bn: `সিমুলেটেড ব্যবহারকারী`,
          phone: 'N/A',
          provider: 'Simulation',
          balance: 0,
          account_age_days: 0,
          total_transactions: 1,
          avg_transaction_amount: tx.amount,
          verified: false,
          kyc_complete: false,
          risk_level: 'medium',
          is_from_test_dataset: true
        } as User
      }

      return null
    }
    throw error
  }
  return data
}

export const getTransaction = async (transactionId: string): Promise<Transaction | null> => {
  // 1. Try main transactions table
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (!error && data) return data

  // 2. Try transaction_history table
  const { data: historyData, error: historyError } = await supabase
    .from('transaction_history')
    .select('*')
    .eq('transaction_id', transactionId)
    .single()

  if (historyError) {
    // If both failed, return null (don't throw, just not found)
    return null
  }

  return { ...historyData, is_simulated: true } as Transaction
}

export const getTransactionHistory = async (
  userId: string,
  limit: number = 10
): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('transaction_timestamp', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export const getNetworkConnections = async (
  userIds: string[],
  limit: number = 50
): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`sender_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`)
    .order('transaction_timestamp', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export const createTransaction = async (
  transaction: Omit<Transaction, 'transaction_id' | 'transaction_timestamp'>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTransaction = async (
  transactionId: string,
  updates: Partial<Transaction>
): Promise<Transaction> => {
  // Try updating the main transactions table first
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('transaction_id', transactionId)
    .select()
    .single()

  if (error) {
    // If not found in main table, try transaction_history
    if (error.code === 'PGRST116') {
       const { data: histData, error: histError } = await supabase
        .from('transaction_history')
        .update(updates)
        .eq('transaction_id', transactionId)
        .select()
        .single()
      
      if (histError) throw histError
      return { ...histData, is_simulated: true }
    }
    throw error
  }
  return data
}

export const createAnalystAction = async (action: {
  transaction_id?: string
  user_id?: string
  action_type: 'CREATE_CASE' | 'FLAG_ACCOUNT' | 'REPORT_FRAUD' | 'APPROVE' | 'REJECT' | 'REVIEW'
  action_data?: any
  analyst_id: string
  analyst_name?: string
}) => {
  // Clone action to avoid mutating original
  const finalAction = { ...action }

  // Handle Simulated Users (FK Violation Prevention)
  if (finalAction.user_id) {
    const u = await getUser(finalAction.user_id)
    if (u && u.is_from_test_dataset) {
      finalAction.action_data = { 
        ...finalAction.action_data, 
        simulated_user_id: finalAction.user_id 
      }
      finalAction.user_id = undefined // Remove FK
    }
  }

  // Handle Simulated Transactions (FK Violation Prevention)
  if (finalAction.transaction_id) {
    const tx = await getTransaction(finalAction.transaction_id)
    if (tx && tx.is_simulated) {
      finalAction.action_data = { 
        ...finalAction.action_data, 
        simulated_transaction_id: finalAction.transaction_id 
      }
      finalAction.transaction_id = undefined // Remove FK
    }
  }

  const { data, error } = await supabase
    .from('analyst_actions')
    .insert(finalAction)
    .select()
    .single()

  if (error) throw error
  return data
}

export const flagAccount = async (
  userId: string,
  reason: string,
  flaggedBy: string
) => {
  // Check if user is simulated
  const user = await getUser(userId)
  if (user && user.is_from_test_dataset) {
    console.warn(`Skipping DB flag for simulated user: ${userId}`)
    // Return a mock success response
    return {
      flag_id: 'simulated-' + Date.now(),
      user_id: userId,
      flag_reason: reason,
      status: 'simulated'
    }
  }

  const { data, error } = await supabase
    .from('flagged_accounts')
    .insert({
      user_id: userId,
      flag_reason: reason,
      flagged_by: flaggedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Case Management Types
export interface Case {
  case_id: string
  user_id?: string
  transaction_id?: string
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive'
  priority: 'High' | 'Medium' | 'Low'
  analyst_id?: string
  checklist_state?: Record<string, boolean>
  created_at: string
  updated_at: string
}

export const getOpenCases = async (): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .in('status', ['Open', 'Investigating'])
    .order('priority', { ascending: true }) // High priority (alphabetically H < L? No, H < M < L is not alphabetic. Wait. High, Medium, Low. H, M, L. Alpha: High, Low, Medium. Need custom sort or map.)
    // Actually, let's just order by created_at for now, or assume the UI handles sorting.
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const getCase = async (caseId: string): Promise<Case | null> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('case_id', caseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export const createCase = async (
  caseData: Omit<Case, 'case_id' | 'created_at' | 'updated_at'>
): Promise<Case> => {
  const { data, error } = await supabase
    .from('cases')
    .insert(caseData)
    .select()
    .single()

  if (error) {
    // Handle duplicate case for same transaction (unique constraint)
    if (error.code === '23505' && caseData.transaction_id) {
      const { data: existingCase, error: fetchError } = await supabase
        .from('cases')
        .select('*')
        .eq('transaction_id', caseData.transaction_id)
        .single()

      if (!fetchError && existingCase) {
        return existingCase
      }
    }
    throw error
  }
  return data
}

export const updateCaseStatus = async (
  caseId: string,
  status: Case['status'],
  analystId?: string
): Promise<Case> => {
  const updates: Partial<Case> = { status }
  if (analystId) updates.analyst_id = analystId

  const { data, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('case_id', caseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCaseChecklist = async (
  caseId: string,
  checklistState: Record<string, boolean>
): Promise<Case> => {
  const { data, error } = await supabase
    .from('cases')
    .update({ checklist_state: checklistState })
    .eq('case_id', caseId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getAnalystNames = async (analystIds: string[]): Promise<Record<string, string>> => {
  const uniqueIds = Array.from(new Set(analystIds)).filter(Boolean)
  if (uniqueIds.length === 0) return {}

  const { data, error } = await supabase
    .from('users')
    .select('user_id, name_en')
    .in('user_id', uniqueIds)

  if (error) {
    // Fail silently (return empty map) rather than crashing UI
    console.warn("Failed to fetch analyst names:", error.message)
    return {}
  }

  return (data || []).reduce((acc: Record<string, string>, user: any) => {
    acc[user.user_id] = user.name_en
    return acc
  }, {})
}


// Generate Demo Cases by seeding from ML API (Engineered Dataset)
export const generateDemoCases = async (count: number = 5): Promise<Case[]> => {
  // 0. Cleanup: Remove old cases that are NOT Open or Investigating
  const { error: deleteError } = await supabase
    .from('cases')
    .delete()
    .not('status', 'in', '("Open","Investigating")')

  if (deleteError) {
    console.error("Cleanup failed", deleteError)
  }

  // 1. Seed fresh data from the Engineered Dataset via ML API
  // We use a random offset to get different cases each time
  try {
    const randomOffset = Math.floor(Math.random() * 500)
    // Dynamically import seedQueue to avoid circular dependency issues at top level if any
    const { seedQueue } = await import('@/lib/ml-api')
    await seedQueue(count, randomOffset, true)
  } catch (err) {
    console.error("Failed to seed queue for cases:", err)
    // Continue - maybe there's data already
  }

  // 2. Fetch the most recent high-risk transactions from history
  // These will likely be the ones we just seeded
  const { data: historyTx, error: txError } = await supabase
    .from('transaction_history')
    .select('transaction_id, sender_id, fraud_probability')
    .gt('fraud_probability', 0.5) // Filter high risk
    .eq('status', 'REVIEW') // Only pick ones that are pending review
    .order('transaction_timestamp', { ascending: false })
    .limit(count * 2) // Fetch a few more to ensure we find non-duplicates

  if (txError) throw txError
  if (!historyTx || historyTx.length === 0) return []

  // 3. Filter out those that might already be cases
  const { data: existingCases } = await supabase.from('cases').select('transaction_id')
  const existingTxIds = new Set(existingCases?.map(c => c.transaction_id) || [])

  const candidates = historyTx.filter(tx => !existingTxIds.has(tx.transaction_id))
  // Always take top candidates to maintain list
  const toCreate = candidates.slice(0, count)

  if (toCreate.length === 0) return []

  const newCases: Omit<Case, 'case_id' | 'created_at' | 'updated_at'>[] = toCreate.map(tx => ({
    transaction_id: tx.transaction_id,
    user_id: tx.sender_id,
    status: 'Open',
    priority: (tx.fraud_probability || 0) > 0.8 ? 'High' : 'Medium',
  }))

  const { data, error } = await supabase
    .from('cases')
    .insert(newCases)
    .select()

  if (error) throw error
  return data || []
}

// Transaction History interface (for test dataset transactions)
export interface TransactionHistory {
  transaction_id: string
  sender_id: string
  receiver_id: string
  amount: number
  transaction_type: 'CASH_OUT' | 'TRANSFER' | 'CASH_IN' | 'PAYMENT' | 'DEBIT'
  old_balance_orig: number
  new_balance_orig: number
  old_balance_dest: number
  new_balance_dest: number
  step?: number
  hour?: number
  transaction_timestamp: string
  fraud_probability?: number
  fraud_decision?: 'pass' | 'warn' | 'block'
  risk_level?: 'low' | 'medium' | 'high'
  model_confidence?: number
  status: 'PENDING' | 'COMPLETED' | 'BLOCKED' | 'REVIEW' | 'FAILED'
  is_test_data: boolean
  test_dataset_id?: number
  note?: string
}

export const createTransactionHistory = async (
  transaction: Omit<TransactionHistory, 'transaction_id' | 'transaction_timestamp'>
): Promise<TransactionHistory> => {
  const { data, error } = await supabase
    .from('transaction_history')
    .insert(transaction)
    .select()
    .single()

  if (error) throw error
  return data
}

// Dashboard Stats
export interface DashboardStats {
  pending_alerts: number
  open_cases: number
  avg_risk_score: number
  active_system: boolean
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // 1. Pending Alerts (High risk transactions pending review)
  const { count: pendingAlerts } = await supabase
    .from('transaction_history')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'REVIEW')

  // 2. Open Cases
  const { count: openCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Open', 'Investigating'])

  // 3. Avg Risk Score (Last 100 transactions)
  const { data: recentTx } = await supabase
    .from('transaction_history')
    .select('fraud_probability')
    .order('transaction_timestamp', { ascending: false })
    .limit(100)

  let avgRisk = 0
  if (recentTx && recentTx.length > 0) {
    const sum = recentTx.reduce((acc, curr) => acc + (curr.fraud_probability || 0), 0)
    avgRisk = sum / recentTx.length
  }

  return {
    pending_alerts: pendingAlerts || 0,
    open_cases: openCases || 0,
    avg_risk_score: avgRisk,
    active_system: true // Implicitly true if we got this far
  }
}

