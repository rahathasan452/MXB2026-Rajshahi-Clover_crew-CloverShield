'use client'

import React, { useEffect } from 'react'
import { Icon } from './Icon'

export type QuickActionType = 'FREEZE' | 'BLOCK' | 'SAR' | 'EMAIL' | 'DISMISS' | 'APPROVE'

interface QuickActionToolbarProps {
  onAction: (action: QuickActionType) => void
  loading?: boolean
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  onAction,
  loading = false,
}) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          onAction('FREEZE')
          break
        case 'b':
          onAction('BLOCK')
          break
        case 's':
          onAction('SAR')
          break
        case 'e':
          onAction('EMAIL')
          break
        case 'd':
          onAction('DISMISS')
          break
        case 'a':
          onAction('APPROVE')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onAction])

  const ActionButton = ({
    type,
    label,
    icon,
    shortcut,
    colorClass,
    desc
  }: {
    type: QuickActionType,
    label: string,
    icon: string,
    shortcut: string,
    colorClass: string,
    desc: string
  }) => (
    <button
      onClick={() => onAction(type)}
      disabled={loading}
      className={`group w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-all mb-2 flex items-center justify-between ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={desc}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md bg-slate-950 ${colorClass} group-hover:scale-110 transition-transform`}>
          <Icon name={icon} size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          <div className="text-[10px] text-slate-500">{desc}</div>
        </div>
      </div>
      <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 rounded bg-slate-950 border border-slate-700 text-xs font-mono text-slate-500">
        {shortcut}
      </kbd>
    </button>
  )

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
        <Icon name="bolt" className="text-yellow-500" /> Quick Actions
      </h3>

      <div className="space-y-1">
        <ActionButton
          type="FREEZE"
          label="Freeze Account"
          icon="lock"
          shortcut="F"
          colorClass="text-red-500"
          desc="Suspend all user activity"
        />
        <ActionButton
          type="BLOCK"
          label="Block Transaction"
          icon="gpp_bad"
          shortcut="B"
          colorClass="text-orange-500"
          desc="Reverse/Stop this transaction"
        />
        <ActionButton
          type="SAR"
          label="Generate SAR"
          icon="description"
          shortcut="S"
          colorClass="text-purple-500"
          desc="Draft Suspicious Activity Report"
        />
        <ActionButton
          type="EMAIL"
          label="Email User"
          icon="mail"
          shortcut="E"
          colorClass="text-blue-500"
          desc="Send verification request"
        />
        <div className="h-px bg-slate-800 my-2"></div>
        <ActionButton
          type="APPROVE"
          label="Approve / Clear"
          icon="check_circle"
          shortcut="A"
          colorClass="text-emerald-500"
          desc="Mark as safe/resolved"
        />
        <ActionButton
          type="DISMISS"
          label="Dismiss"
          icon="cancel"
          shortcut="D"
          colorClass="text-slate-500"
          desc="Mark as False Positive"
        />
      </div>
    </div>
  )
}
