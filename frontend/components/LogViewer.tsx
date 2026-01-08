import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Icon } from './Icon'

interface AuditLog {
  id: string
  action_type: string
  human_readable_message: string
  created_at: string
  user_email?: string
}

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
    
    // Real-time subscription
    const subscription = supabase
      .channel('audit_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs((prev) => [payload.new as AuditLog, ...prev])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
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
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="hud-card p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <Icon name="history" /> System Audit Logs
        </h2>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none w-64 text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Icon name="search" size={16} className="absolute right-3 top-3 text-slate-500" />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-slate-900">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-3">Time</th>
              <th className="p-3">Action</th>
              <th className="p-3">User</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono text-slate-300 divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 whitespace-nowrap text-emerald-500/80">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {log.user_email || 'System'}
                  </td>
                  <td className="p-3 max-w-md truncate" title={log.human_readable_message}>
                    {log.human_readable_message}
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
