/**
 * Risk Drivers Component
 * Displays SHAP explanations in human-readable format
 */

import React from 'react'
import { SHAPExplanation } from '@/lib/ml-api'

interface RiskDriversProps {
  shapExplanations: SHAPExplanation[]
  language?: 'en' | 'bn'
  hideTitle?: boolean
}

// Feature name mapping (from app.py)
const FEATURE_NAME_MAP: Record<string, string> = {
  amount: 'Transaction Amount',
  amount_log1p: 'Transaction Amount (log scale)',
  amt_ratio_to_user_mean: 'Amount vs User Average',
  amt_ratio_to_user_median: 'Amount vs User Median',
  amount_over_oldBalanceOrig: 'Amount as % of Balance',
  type_encoded: 'Transaction Type',
  orig_txn_count: 'Sender Transaction Frequency',
  dest_txn_count: 'Receiver Transaction Frequency',
  in_degree: 'Receiver Network Connections',
  out_degree: 'Sender Network Connections',
  network_trust: 'Network Trust Score',
  is_new_origin: 'New Sender Account',
  is_new_dest: 'New Receiver Account',
  hour: 'Transaction Hour',
}

const getHumanReadableName = (feature: string): string => {
  return FEATURE_NAME_MAP[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const categorizeStrength = (shapAbs: number): 'strong' | 'moderate' | 'weak' => {
  if (shapAbs > 0.3) return 'strong'
  if (shapAbs > 0.1) return 'moderate'
  return 'weak'
}

export const RiskDrivers: React.FC<RiskDriversProps> = ({
  shapExplanations,
  language = 'en',
  hideTitle = false,
}) => {
  if (!shapExplanations || shapExplanations.length === 0) {
    return (
      <div className="bg-card-bg rounded-xl p-6 border border-white/10">
        <p className="text-text-secondary">
          {language === 'bn'
            ? 'কোন ঝুঁকি ড্রাইভার উপলব্ধ নেই'
            : 'No risk drivers available'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <h3 className="text-xl font-bold text-text-primary">
          {language === 'bn' ? 'শীর্ষ ঝুঁকি ড্রাইভার' : 'Top Risk Drivers'}
        </h3>
      )}

      {shapExplanations
        .filter((exp) => Math.abs(exp.shap) > 0.05)
        .map((explanation, index) => {
          const strength = categorizeStrength(explanation.shap_abs)
          const direction = explanation.shap > 0 ? '↑' : '↓'

          const getStrengthColor = () => {
            switch (strength) {
              case 'strong':
                return 'border-l-high-risk'
              case 'moderate':
                return 'border-l-caution'
              case 'weak':
                return 'border-l-neutral'
            }
          }

          return (
            <div
              key={index}
              className={`bg-card-bg rounded-lg p-4 border-l-4 ${getStrengthColor()} border border-white/10 hover:shadow-lg transition-shadow`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{direction}</span>
                    <strong className="text-text-primary">
                      {getHumanReadableName(explanation.feature)}
                    </strong>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {language === 'bn' ? 'প্রভাব' : 'Impact'}:{' '}
                    {Math.abs(explanation.shap).toFixed(3)}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    strength === 'strong'
                      ? 'bg-high-risk/20 text-high-risk'
                      : strength === 'moderate'
                      ? 'bg-caution/20 text-caution'
                      : 'bg-neutral/20 text-neutral'
                  }`}
                >
                  {strength}
                </span>
              </div>
            </div>
          )
        })}
    </div>
  )
}

