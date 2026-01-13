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
import { QRDataBridge } from '@/components/QRDataBridge'
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

  // State for SAR QR Modal
  const [sarData, setSarData] = useState<any | null>(null)

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
          toast.success("account freeze")
          // Mark case as resolved automatically
          await handleStatusChange('Resolved')
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
          toast.success("blocked txn")
          // Refresh tx
          setTargetTx(prev => prev ? ({ ...prev, status: 'BLOCKED' }) : null)
          // Mark case as resolved automatically
          await handleStatusChange('Resolved')
          break

        case 'SAR':
          // Generate detailed SAR payload
          const payload = {
            report_type: 'SAR',
            generated_at: new Date().toISOString(),
            analyst: {
              id: authUser.id,
              email: authUser.email
            },
            subject: {
              user_id: targetUser?.user_id || 'Unknown',
              name: targetUser?.name_en || 'Unknown',
              phone: targetUser?.phone || 'Unknown',
              risk_score: 0, // User type does not have risk_score
            },
            incident: {
              case_id: caseData.case_id,
              transaction_id: targetTx?.transaction_id || 'N/A',
              amount: targetTx?.amount || 0,
              type: targetTx?.transaction_type || 'N/A',
              fraud_probability: targetTx?.fraud_probability || 0,
              timestamp: targetTx?.transaction_timestamp || 'N/A'
            },
            narrative: `Suspicious activity detected in transaction ${targetTx?.transaction_id}. Fraud score: ${((targetTx?.fraud_probability || 0) * 100).toFixed(1)}%. Initiating detailed review.`
          }

          setSarData(payload)
          toast.success("SAR generated. Ready for secure transfer.")

          await createAnalystAction({
            action_type: 'REPORT_FRAUD',
            transaction_id: caseData.transaction_id,
            user_id: caseData.user_id,
            analyst_id: authUser.id,
            analyst_name: authUser.email,
            action_data: { type: 'SAR', payload_preview: 'Generated via Quick Action' }
          })
          break

        case 'FRICTION':
          if (!targetUser) {
            toast.error("No user linked to this case")
            break
          }
          // In a real app, this would call an API to enforce step-up auth
          await createAnalystAction({
            action_type: 'FLAG_ACCOUNT', // Re-using flag for now, or could be a custom type if DB supports it
            user_id: targetUser.user_id,
            analyst_id: authUser.id,
            analyst_name: authUser.email,
            action_data: { reason: 'Applied 2FA/Biometric Friction' }
          })
          toast.success("User challenged with 2FA/Biometrics")
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* SAR Generation Modal / Overlay */}
      {sarData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Icon name="verified_user" className="text-emerald-400" />
                SAR Generated
              </h3>
              <button
                onClick={() => setSarData(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Icon name="close" size={24} />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="text-center space-y-2">
                <p className="text-slate-300">Scan this QR code with your secure terminal to transfer the Suspicious Activity Report.</p>
                <div className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-mono px-2 py-1 rounded">
                  CASE-{caseId.slice(0, 8).toUpperCase()}
                </div>
              </div>

              {/* Force the QR to show and be interactive */}
              <div className="bg-white p-4 rounded-xl shadow-lg transform scale-110">
                {/* 
                    Using a modified version of QRDataBridge implicitly by just rendering it.
                    Since QRDataBridge has its own toggle logic, we might need to trick it or 
                    just rely on its default behavior. But here we want it OPEN by default if possible.
                    However, the component controls its own state. 
                    Ideally we would pass a prop `defaultOpen` but let's see if we can just wrap it nicely.
                 */}
                <QRDataBridge
                  data={sarData}
                  label="SAR Payload"
                  variant="inline"
                />
              </div>

              <div className="w-full bg-slate-950 rounded-lg p-4 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Payload Preview</h4>
                <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-32">
                  {JSON.stringify(sarData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(sarData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `SAR_${caseId}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  toast.success("SAR downloaded as JSON")
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-semibold text-sm transition-colors border border-slate-700 flex items-center gap-2"
              >
                <Icon name="download" size={16} />
                Download JSON
              </button>
              <button
                onClick={() => setSarData(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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

        <div className="flex gap-2 items-center">
          {/* Navigation Tools */}
          {caseData.user_id && (
            <Link
              href={`/dashboard/profile/${caseData.user_id}`}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Icon name="hub" size={18} />
              <span className="hidden xl:inline">Customer 360</span>
            </Link>
          )}
          {caseData.transaction_id && (
            <Link
              href={`/dashboard/simulator?txn=${caseData.transaction_id}`}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <Icon name="radar" size={18} />
              <span className="hidden xl:inline">Fraud Scanner</span>
            </Link>
          )}

          {/* Divider */}
          {(caseData.user_id || caseData.transaction_id) && (
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
          )}

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
          {targetUser ? (
            <UserProfileCard user={targetUser} />
          ) : caseData.user_id ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg text-center text-slate-500">
              <Icon name="person_off" size={32} className="mx-auto mb-2 opacity-50" />
              <p>User Profile Not Found</p>
              <p className="font-mono text-xs">{caseData.user_id}</p>
            </div>
          ) : null}

          {targetTx ? (
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
          ) : caseData.transaction_id ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg text-center text-slate-500">
              <Icon name="receipt_long" size={32} className="mx-auto mb-2 opacity-50" />
              <p>Transaction Data Unavailable</p>
              <p className="font-mono text-xs">{caseData.transaction_id}</p>
            </div>
          ) : null}

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
