'use client'

import { AnalystWorkloadStats } from '@/components/AnalystWorkloadStats'
import { LogViewer } from '@/components/LogViewer'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AnalystStatsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analyst Performance</h1>
          <p className="text-slate-400">Real-time productivity metrics and system audit trail.</p>
        </div>

        <AnalystWorkloadStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <LogViewer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
