/**
 * Decision Zone Component
 * Unified decision card (replaces Streamlit Zone 2)
 */

import React from 'react'
import { PredictResponse } from '@/lib/ml-api'
import { FraudGauge } from './FraudGauge'

interface DecisionZoneProps {
  prediction: PredictResponse
  language?: 'en' | 'bn'
}

export const DecisionZone: React.FC<DecisionZoneProps> = ({
  prediction,
  language = 'en',
}) => {
  const { fraud_probability, decision, risk_level, confidence } =
    prediction.prediction

  const getDecisionColor = () => {
    switch (decision) {
      case 'pass':
        return 'border-success text-success'
      case 'warn':
        return 'border-caution text-caution'
      case 'block':
        return 'border-danger text-danger'
      default:
        return 'border-neutral text-neutral'
    }
  }

  const getDecisionText = () => {
    if (language === 'bn') {
      switch (decision) {
        case 'pass':
          return 'লেনদেন অনুমোদিত'
        case 'warn':
          return 'ম্যানুয়াল যাচাইকরণ প্রয়োজন'
        case 'block':
          return 'লেনদেন ব্লক করা হয়েছে'
        default:
          return ''
      }
    } else {
      switch (decision) {
        case 'pass':
          return 'APPROVE TRANSACTION'
        case 'warn':
          return 'REQUIRES MANUAL REVIEW'
        case 'block':
          return 'BLOCK TRANSACTION'
        default:
          return ''
      }
    }
  }

  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium-High'
    if (confidence >= 0.4) return 'Medium'
    return 'Low'
  }

  return (
    <div
      className={`rounded-2xl p-8 border-2 shadow-2xl transition-all ${getDecisionColor()}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          {language === 'bn' ? 'জালিয়াতি ঝুঁকি মূল্যায়ন' : 'Fraud Risk Assessment'}
        </h2>
        <div className="flex items-center gap-2 bg-neutral/10 border border-neutral/30 rounded-full px-4 py-2">
          <span className="text-sm text-text-secondary">
            {language === 'bn' ? 'আত্মবিশ্বাস' : 'Confidence'}:
          </span>
          <span className="text-sm font-semibold text-neutral">
            {getConfidenceLevel()}
          </span>
        </div>
      </div>

      <div className="text-center my-8">
        <div
          className={`text-6xl font-bold mb-4 ${getDecisionColor().split(' ')[1]}`}
        >
          {(fraud_probability * 100).toFixed(1)}%
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${getDecisionColor().split(' ')[1]}`}>
          {getDecisionText()}
        </h3>
        <p className="text-text-secondary">
          {language === 'bn' ? 'ঝুঁকির স্তর' : 'Risk Level'}:{' '}
          <span className="font-semibold uppercase">{risk_level}</span>
        </p>
      </div>

      {/* Gauge */}
      <div className="flex justify-center my-6">
        <FraudGauge probability={fraud_probability} size={250} />
      </div>

      {/* Processing Info */}
      <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-sm text-text-secondary">
        <span>
          {language === 'bn' ? 'প্রক্রিয়াকরণ সময়' : 'Processing Time'}:{' '}
          {prediction.processing_time_ms}ms
        </span>
        <span>
          {language === 'bn' ? 'মডেল সংস্করণ' : 'Model Version'}:{' '}
          {prediction.model_version}
        </span>
      </div>
    </div>
  )
}

