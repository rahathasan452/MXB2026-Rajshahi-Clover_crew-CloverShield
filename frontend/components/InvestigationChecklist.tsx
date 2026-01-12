'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from './Icon'
import { updateCaseChecklist } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface InvestigationChecklistProps {
  caseId: string
  initialState?: Record<string, boolean>
  onUpdate?: (state: Record<string, boolean>) => void
}

const CHECKLIST_ITEMS = [
  { id: 'verify_kyc', label: 'Verify User Identity (KYC)' },
  { id: 'review_history', label: 'Review Transaction History' },
  { id: 'check_graph', label: 'Check Graph for Money Laundering Rings' },
  { id: 'review_shap', label: 'Analyze Risk Factors (SHAP)' },
  { id: 'contact_user', label: 'Contact User / Verify Intent' },
]

export const InvestigationChecklist: React.FC<InvestigationChecklistProps> = ({
  caseId,
  initialState = {},
  onUpdate,
}) => {
  const [items, setItems] = useState<Record<string, boolean>>(initialState || {})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialState) setItems(initialState)
  }, [initialState])

  const handleToggle = async (id: string) => {
    const newState = { ...items, [id]: !items[id] }
    setItems(newState)
    
    // Notify parent immediately
    if (onUpdate) onUpdate(newState)

    // Debounced or immediate save
    setSaving(true)
    try {
      await updateCaseChecklist(caseId, newState)
    } catch (error) {
      console.error("Failed to save checklist:", error)
      toast.error("Failed to save progress")
      // Revert on error? Or just leave it optimistic.
    } finally {
      setSaving(false)
    }
  }

  const completedCount = Object.values(items).filter(Boolean).length
  const progress = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Icon name="list" className="text-emerald-500" /> Investigation Checklist
        </h3>
        {saving && <span className="text-xs text-slate-500 animate-pulse">Saving...</span>}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
        <div 
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mb-4">
        <span>{completedCount} of {CHECKLIST_ITEMS.length} completed</span>
        <span>{progress}%</span>
      </div>

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <label 
            key={item.id} 
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              items[item.id] 
                ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-100' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              items[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
            }`}>
              {items[item.id] && <Icon name="check" size={12} className="text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={!!items[item.id]} 
              onChange={() => handleToggle(item.id)}
            />
            <span className={`text-sm ${items[item.id] ? 'line-through opacity-70' : ''}`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
