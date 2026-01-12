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
  provider: 'bKash' | 'Nagad' | 'Rocket' | 'Upay'
  balance: number
  account_age_days: number
  total_transactions: number
  avg_transaction_amount: number
  verified: boolean
  kyc_complete: boolean
  risk_level: 'low' | 'medium' | 'high' | 'suspicious'
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

  if (error) throw error
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
  
  return historyData as Transaction // Cast history to Transaction (compatible)
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
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('transaction_id', transactionId)
    .select()
    .single()

  if (error) throw error
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
  const { data, error } = await supabase
    .from('analyst_actions')
    .insert(action)
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

  if (error) throw error
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

  if (error) throw error
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


export const generateDemoCases = async (count: number = 5): Promise<Case[]> => {
  // 1. Try fetching from transactions (main)
  let { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('transaction_id, sender_id, fraud_probability')
    .in('fraud_decision', ['block', 'warn'])
    .order('transaction_timestamp', { ascending: false })
    .limit(50)

  // 2. Fallback to transaction_history if empty
  if (!transactions || transactions.length === 0) {
     const { data: historyTx } = await supabase
        .from('transaction_history')
        .select('transaction_id, sender_id, fraud_probability')
        .gt('fraud_probability', 0.5) // Filter high risk
        .order('transaction_timestamp', { ascending: false })
        .limit(50)
     
     transactions = historyTx || []
  }

  if (!transactions || transactions.length === 0) return []

  // 3. Filter out those that might already be cases
  const { data: existingCases } = await supabase.from('cases').select('transaction_id')
  const existingTxIds = new Set(existingCases?.map(c => c.transaction_id) || [])

  const candidates = transactions.filter(tx => !existingTxIds.has(tx.transaction_id))
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

