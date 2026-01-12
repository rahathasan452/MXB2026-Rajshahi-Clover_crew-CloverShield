import React from 'react'

interface CaseStatusBadgeProps {
  status: 'Open' | 'Investigating' | 'Resolved' | 'False Positive'
}

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({ status }) => {
  const styles = {
    'Open': 'bg-yellow-900/30 text-yellow-500 border-yellow-500/50',
    'Investigating': 'bg-blue-900/30 text-blue-400 border-blue-500/50',
    'Resolved': 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50',
    'False Positive': 'bg-slate-800 text-slate-400 border-slate-600',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${styles[status] || styles['Open']}`}>
      {status}
    </span>
  )
}

interface CasePriorityBadgeProps {
  priority: 'High' | 'Medium' | 'Low'
}

export const CasePriorityBadge: React.FC<CasePriorityBadgeProps> = ({ priority }) => {
  const styles = {
    'High': 'text-red-500',
    'Medium': 'text-yellow-500',
    'Low': 'text-emerald-500',
  }

  const icons = {
    'High': '!!!',
    'Medium': '!!',
    'Low': '!',
  }

  return (
    <span className={`font-mono font-bold text-xs flex items-center gap-1 ${styles[priority]}`}>
      {icons[priority]} {priority.toUpperCase()}
    </span>
  )
}
