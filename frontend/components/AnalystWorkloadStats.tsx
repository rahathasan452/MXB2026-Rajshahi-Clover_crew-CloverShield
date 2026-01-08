import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Icon } from './Icon'

interface AnalystStats {
  cases_resolved_today: number
  avg_resolution_time_minutes: number
  cases_by_status: Record<string, number>
}

export const AnalystWorkloadStats: React.FC = () => {
  const [stats, setStats] = useState<AnalystStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_analyst_stats')
      if (error) throw error
      setStats(data as AnalystStats)
    } catch (error) {
      console.error('Error fetching analyst stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-emerald-500 animate-pulse">Loading Workload Stats...</div>
  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Metric 1: Resolved Today */}
      <div className="hud-card p-6 border-l-4 border-emerald-500 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-1">Resolved Today</p>
            <h3 className="text-3xl font-mono font-bold text-white">{stats.cases_resolved_today}</h3>
          </div>
          <Icon name="check_circle" className="text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
      </div>

      {/* Metric 2: Avg Resolution Time */}
      <div className="hud-card p-6 border-l-4 border-blue-500 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400 mb-1">Avg Resolution Time</p>
            <h3 className="text-3xl font-mono font-bold text-white">{stats.avg_resolution_time_minutes} <span className="text-sm font-normal text-slate-400">min</span></h3>
          </div>
          <Icon name="timer" className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
      </div>

      {/* Metric 3: Active Workload */}
      <div className="hud-card p-6 border-l-4 border-yellow-500 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10 relative">
          <div>
            <p className="text-xs uppercase tracking-widest text-yellow-400 mb-1">Pending Review</p>
            <h3 className="text-3xl font-mono font-bold text-white">
              {(stats.cases_by_status['REVIEW'] || 0) + (stats.cases_by_status['PENDING'] || 0)}
            </h3>
          </div>
          <Icon name="pending" className="text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all" />
      </div>
    </div>
  )
}
