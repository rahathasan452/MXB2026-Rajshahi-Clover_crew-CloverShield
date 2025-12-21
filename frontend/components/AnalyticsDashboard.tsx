/**
 * Analytics Dashboard Component
 * Displays real-time analytics metrics
 */

import React from 'react'
import { useAppStore } from '@/store/useAppStore'

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
      icon: '💰',
      color: 'text-success',
    },
    {
      label:
        language === 'bn' ? 'প্রক্রিয়াকৃত লেনদেন' : 'Transactions Processed',
      value: analytics.transactionsProcessed.toLocaleString(),
      icon: '📊',
      color: 'text-primary',
    },
    {
      label: language === 'bn' ? 'জালিয়াতি সনাক্ত' : 'Fraud Detected',
      value: analytics.fraudDetected.toLocaleString(),
      icon: '🚨',
      color: 'text-danger',
    },
    {
      label: language === 'bn' ? 'সিস্টেম নির্ভুলতা' : 'System Accuracy',
      value: `${analytics.accuracyRate}%`,
      icon: '✅',
      color: 'text-success',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-card-bg rounded-xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">{metric.icon}</span>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
          <p className="text-sm text-text-secondary font-medium">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  )
}

