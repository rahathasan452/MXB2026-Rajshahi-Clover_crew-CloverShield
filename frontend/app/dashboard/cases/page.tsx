'use client'

import React, { useEffect, useState } from 'react'
import { supabase, getOpenCases, Case, updateCaseStatus, generateDemoCases } from '@/lib/supabase'
import { Icon } from '@/components/Icon'
import { CaseStatusBadge, CasePriorityBadge } from '@/components/CaseStatusBadge'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'react-hot-toast'

export default function CasesPage() {
  const { authUser } = useAppStore()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Investigating' | 'Resolved'>('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCases()

    // Real-time subscription
    const subscription = supabase
      .channel('cases_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
        fetchCases() // Refresh list on any change
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setCases(data || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (caseId: string) => {
    if (!authUser) {
      toast.error("You must be logged in to assign cases")
      return
    }

    try {
      await updateCaseStatus(caseId, 'Investigating', authUser.email || authUser.id)
      toast.success("Case assigned to you")
      fetchCases()
    } catch (error) {
      console.error("Failed to assign case:", error)
      toast.error("Failed to assign case")
    }
  }

  const handleGenerateDemo = async () => {
    setGenerating(true)
    try {
      const newCases = await generateDemoCases(5)
      if (newCases.length > 0) {
        toast.success(`Generated ${newCases.length} demo cases`)
        fetchCases()
      } else {
        toast('No suitable high-risk transactions found to create cases from.', { icon: 'ℹ️' })
      }
    } catch (error) {
      console.error("Failed to generate cases:", error)
      toast.error("Failed to generate demo cases. Ensure you are logged in.")
    } finally {
      setGenerating(false)
    }
  }

  const filteredCases = cases.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const matchesSearch = searchTerm === '' ||
      c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.analyst_id && c.analyst_id.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Group stats
  const stats = {
    open: cases.filter(c => c.status === 'Open').length,
    investigating: cases.filter(c => c.status === 'Investigating').length,
    resolved: cases.filter(c => c.status === 'Resolved').length,
    highPriority: cases.filter(c => c.priority === 'High' && c.status !== 'Resolved').length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-3">
            <Icon name="work" size={28} />
            Investigation Queue
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and triage active fraud cases</p>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={handleGenerateDemo}
            disabled={generating}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            title="Populate queue with cases from high-risk transactions"
          >
            <Icon name={generating ? "pending" : "bolt"} size={16} className={generating ? "animate-spin" : ""} />
            {generating ? 'Generating...' : 'Simulate Cases'}
          </button>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Open</span>
            <span className="text-2xl font-bold text-yellow-500">{stats.open}</span>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Active</span>
            <span className="text-2xl font-bold text-blue-500">{stats.investigating}</span>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-slate-500 uppercase tracking-widest">High Pri</span>
            <span className="text-2xl font-bold text-red-500">{stats.highPriority}</span>
          </div>
        </div>
      </div>

      {/* Filters & Toolbar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Open', 'Investigating', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === tab
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search Case ID or Analyst..."
            className="w-full bg-slate-950 border border-slate-700 rounded-md py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Icon name="search" size={16} className="absolute left-3 top-2.5 text-slate-500" />
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-4">Case ID</th>
              <th className="p-4">Target</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Updated</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-16 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
                  <td className="p-4"><div className="h-8 w-20 bg-slate-800 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <Icon name="check_circle" size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No cases found matching your criteria.</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr key={c.case_id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="p-4 font-mono text-emerald-400/80 group-hover:text-emerald-400">
                    #{c.case_id.slice(0, 8)}
                  </td>
                  <td className="p-4 text-slate-300">
                    {c.user_id ? (
                      <Link 
                        href={`/dashboard/profile/${c.user_id}`}
                        className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                        title="View Customer 360"
                      >
                        <Icon name="person" size={14} className="text-slate-500" />
                        <span>{c.user_id}</span>
                        <Icon name="open_in_new" size={12} className="opacity-0 group-hover:opacity-50" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="receipt_long" size={14} className="text-slate-500" />
                        <span>Txn...{c.transaction_id?.slice(0, 6)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <CasePriorityBadge priority={c.priority} />
                  </td>
                  <td className="p-4">
                    <CaseStatusBadge status={c.status} />
                  </td>
                  <td className="p-4 text-slate-500">
                    {format(new Date(c.updated_at), 'MMM d, HH:mm')}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/cases/${c.case_id}`}
                      className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    >
                      View <Icon name="arrow_forward" size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}