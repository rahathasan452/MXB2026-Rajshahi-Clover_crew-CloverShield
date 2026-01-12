'use client'

import React, { useEffect, useState } from 'react'
import {
  supabase,
  getCase,
  getUser,
  getTransaction,
  Case,
  User,
  Transaction,
  updateCaseStatus,
  createAnalystAction,
  flagAccount,
  updateTransaction
} from '@/lib/supabase'
import { Icon } from '@/components/Icon'
import { CaseStatusBadge, CasePriorityBadge } from '@/components/CaseStatusBadge'
import { UserProfileCard } from '@/components/UserProfileCard'
import { QuickActionToolbar, QuickActionType } from '@/components/QuickActionToolbar'
import { InvestigationChecklist } from '@/components/InvestigationChecklist'
import { format } from 'date-fns'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'react-hot-toast'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { authUser } = useAppStore()
  const caseId = params.id as string

  const [caseData, setCaseData] = useState<Case | null>(null)
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [targetTx, setTargetTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (caseId) fetchData()

    const subscription = supabase
      .channel(`case_${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `case_id=eq.${caseId}` }, (payload) => {
        setCaseData(payload.new as Case)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [caseId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const c = await getCase(caseId)
      if (!c) {
        toast.error("Case not found")
        router.push('/dashboard/cases')
        return
      }
      setCaseData(c)

      if (c.user_id) {
        const u = await getUser(c.user_id)
        setTargetUser(u)
      }

      if (c.transaction_id) {
        const tx = await getTransaction(c.transaction_id)
        setTargetTx(tx)
        // If tx has sender and we haven't fetched user yet
        if (tx?.sender_id && !targetUser && !c.user_id) {
          const u = await getUser(tx.sender_id)
          setTargetUser(u)
        }
      }
    } catch (error) {
      console.error("Error fetching case details:", error)
      toast.error("Failed to load case details")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Case['status']) => {
    try {
      await updateCaseStatus(caseId, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      // Optimistic update
      setCaseData(prev => prev ? ({ ...prev, status: newStatus }) : null)
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleQuickAction = async (type: QuickActionType) => {
    if (!authUser || !caseData) {
      toast.error("Unauthorized")
      return
    }

    setActionLoading(true)
    try {
      switch (type) {
        case 'FREEZE':
          if (!targetUser) {
            toast.error("No user linked to this case")
            break
          }
          await flagAccount(targetUser.user_id, `Case ${caseId}: Freeze Requested`, authUser.id)
          await createAnalystAction({
            action_type: 'FLAG_ACCOUNT',
            user_id: targetUser.user_id,
            analyst_id: authUser.id,
            analyst_name: authUser.email,
            action_data: { reason: 'Freeze Requested via Quick Action' }
          })
          toast.success(`Account ${targetUser.user_id} flagged for freeze`)
          break

        case 'BLOCK':
          if (!targetTx) {
            toast.error("No transaction linked to this case")
            break
          }
          await updateTransaction(targetTx.transaction_id, { status: 'BLOCKED' })
          await createAnalystAction({
            action_type: 'REJECT',
            transaction_id: targetTx.transaction_id,
            analyst_id: authUser.id,
            analyst_name: authUser.email,
            action_data: { reason: 'Blocked via Quick Action' }
          })
          toast.success("Transaction blocked")
          // Refresh tx
          setTargetTx(prev => prev ? ({ ...prev, status: 'BLOCKED' }) : null)
          break

        case 'SAR':
          // Just a simulation/placeholder for now
          toast.success("SAR Draft generated and sent to email")
          await createAnalystAction({
            action_type: 'REPORT_FRAUD',
            transaction_id: caseData.transaction_id,
            user_id: caseData.user_id,
            analyst_id: authUser.id,
            analyst_name: authUser.email,
            action_data: { type: 'SAR' }
          })
          break

        case 'EMAIL':
          toast.success("Verification email sent to user")
          break

        case 'APPROVE':
          await handleStatusChange('Resolved')
          toast.success("Case resolved")
          break

        case 'DISMISS':
          await handleStatusChange('False Positive')
          toast.success("Case marked as False Positive")
          break
      }
    } catch (error) {
      console.error("Action failed:", error)
      toast.error(`Action ${type} failed`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading case details...</div>
  if (!caseData) return <div className="p-12 text-center text-slate-500">Case not found</div>

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link href="/dashboard/cases" className="hover:text-emerald-400 transition-colors">Cases</Link>
        <Icon name="chevron_right" size={14} />
        <span className="text-slate-300">#{caseId.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white font-mono">Case #{caseId.slice(0, 8)}</h1>
            <CaseStatusBadge status={caseData.status} />
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Icon name="schedule" size={14} /> Created {format(new Date(caseData.created_at), 'MMM d, yyyy HH:mm')}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="person" size={14} /> Analyst: <span className="text-emerald-400">{caseData.analyst_id || 'Unassigned'}</span>
            </span>
            <CasePriorityBadge priority={caseData.priority} />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Status Actions - Placeholder for Quick Actions */}
          {caseData.status === 'Open' && (
            <button onClick={() => handleStatusChange('Investigating')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20">
              Start Investigation
            </button>
          )}
          {caseData.status === 'Investigating' && (
            <button onClick={() => handleStatusChange('Resolved')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/20">
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Target Details */}
        <div className="lg:col-span-2 space-y-6">
          {targetUser && (
            <UserProfileCard user={targetUser} />
          )}

          {targetTx && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Icon name="receipt_long" /> Transaction Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="block text-xs text-slate-500 uppercase">Amount</span>
                  <span className="text-xl font-mono text-white">৳ {targetTx.amount.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="block text-xs text-slate-500 uppercase">Type</span>
                  <span className="text-white">{targetTx.transaction_type}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="block text-xs text-slate-500 uppercase">Fraud Score</span>
                  <span className={`text-lg font-bold ${(targetTx.fraud_probability || 0) > 0.7 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {((targetTx.fraud_probability || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="block text-xs text-slate-500 uppercase">Timestamp</span>
                  <span className="text-slate-300">{format(new Date(targetTx.transaction_timestamp), 'PP pp')}</span>
                </div>
                <div className="col-span-2 p-3 bg-slate-950 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="block text-xs text-slate-500 uppercase">Status</span>
                    <span className={`font-bold ${targetTx.status === 'BLOCKED' ? 'text-red-500' : 'text-white'}`}>
                      {targetTx.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for future Activity Log */}
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500">
            <Icon name="description" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Activity Log & Notes (Coming Soon)</p>
          </div>
        </div>

        {/* Right Column: Toolkit */}
        <div className="space-y-6">
          <InvestigationChecklist
            caseId={caseId}
            initialState={caseData.checklist_state || {}}
          />

          <QuickActionToolbar
            onAction={handleQuickAction}
            loading={actionLoading}
          />
        </div>
      </div>
    </div>
  )
}
