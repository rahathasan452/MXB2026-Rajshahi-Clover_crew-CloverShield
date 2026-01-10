'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Icon } from './Icon'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  action_type: string
  human_readable_message: string
  created_at: string
  user_email?: string
  resource_type?: string
  resource_id?: string
  metadata?: any
}

export const AuditLogTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [actionTypes, setActionTypes] = useState<string[]>([])

  useEffect(() => {
    fetchLogs()
    fetchActionTypes()
    
    // Real-time subscription
    const subscription = supabase
      .channel('audit_logs_full')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs((prev) => [payload.new as AuditLog, ...prev])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [actionFilter])

  const fetchActionTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action_type')
      
      if (error) throw error
      const types = Array.from(new Set(data.map(item => item.action_type)))
      setActionTypes(types)
    } catch (error) {
      console.error('Error fetching action types:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (actionFilter !== 'ALL') {
        query = query.eq('action_type', actionFilter)
      }

      const { data, error } = await query
      
      if (error) throw error
      setLogs(data)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    log.human_readable_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="hud-card p-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Icon name="history" /> Comprehensive Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-widest">Sovereign Defense Compliance Log</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select 
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-emerald-500 outline-none"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <div className="relative flex-grow md:flex-grow-0">
            <input 
              type="text" 
              placeholder="Filter logs..." 
              className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none w-full md:w-64 text-slate-300 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Icon name="search" size={16} className="absolute left-3 top-3 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-widest font-bold">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Event</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Resource</th>
              <th className="p-4">Message</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="p-12 text-center text-slate-500 animate-pulse">Scanning audit trail...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-slate-500">No records matching criteria</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 whitespace-nowrap text-slate-500 group-hover:text-emerald-500 transition-colors">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Icon name="user" size={14} className="text-slate-600" />
                      {log.user_email || 'SYSTEM_PROCESS'}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 italic text-xs">
                    {log.resource_type ? `${log.resource_type}:${log.resource_id?.slice(0,8)}...` : 'N/A'}
                  </td>
                  <td className="p-4 text-slate-300 max-w-md truncate" title={log.human_readable_message}>
                    {log.human_readable_message}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-tighter font-mono">
        <span>Displaying {filteredLogs.length} recent events</span>
        <span>Secure Air-Gapped Logging Active</span>
      </div>
    </div>
  )
}
