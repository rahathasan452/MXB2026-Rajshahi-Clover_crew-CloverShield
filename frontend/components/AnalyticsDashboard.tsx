/**
 * Analytics Dashboard Component
 * Displays real-time analytics metrics
 */

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'

interface AnalyticsDashboardProps {
  language?: 'en' | 'bn'
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  language = 'en',
}) => {
  const { analytics } = useAppStore()

  const formatCurrency = (amount: number) => {
    return `৳ ${amount.toLocaleString('en-BD')}`
  }

  const metrics = [
    {
      label: language === 'bn' ? 'আজ সংরক্ষিত অর্থ' : 'Money Saved Today',
      value: formatCurrency(analytics.moneySaved),
      icon: 'payments',
      color: 'text-success',
      glow: 'hud-glow-green',
    },
    {
      label:
        language === 'bn' ? 'প্রক্রিয়াকৃত লেনদেন' : 'Transactions Processed',
      value: analytics.transactionsProcessed.toLocaleString(),
      icon: 'analytics',
      color: 'text-primary',
      glow: 'hud-glow-blue',
    },
    {
      label: language === 'bn' ? 'জালিয়াতি সনাক্ত' : 'Fraud Detected',
      value: analytics.fraudDetected.toLocaleString(),
      icon: 'warning',
      color: 'text-danger',
      glow: 'hud-glow-red',
    },
    {
      label: language === 'bn' ? 'সিস্টেম নির্ভুলতা' : 'System Accuracy',
      value: `${analytics.accuracyRate}%`,
      icon: 'check_circle',
      color: 'text-success',
      glow: 'hud-glow-green',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="hud-card group p-6 hover:border-white/20 transition-all duration-300"
        >
          <div className="scanline" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Icon name={metric.icon} size={28} className={`${metric.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <div className={`text-2xl font-mono font-bold ${metric.color} ${metric.glow}`}>
              {metric.value}
            </div>
          </div>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold relative z-10">
            {metric.label}
          </p>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      ))}
    </div>
  )
}

