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
      className={`hud-card p-8 border-2 shadow-2xl transition-all duration-500 ${getDecisionColor()}`}
    >
      <div className="scanline" />
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          {language === 'bn' ? 'জালিয়াতি ঝুঁকি মূল্যায়ন' : 'FRAUD RISK ASSESSMENT'}
        </h2>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
          <span className="text-xs uppercase tracking-wider text-text-secondary">
            {language === 'bn' ? 'আত্মবিশ্বাস' : 'Confidence'}:
          </span>
          <span className="text-sm font-mono font-bold text-primary">
            {getConfidenceLevel()}
          </span>
        </div>
      </div>

      <div className="text-center my-8 relative z-10">
        <h3 className={`text-3xl font-black mb-2 tracking-tighter ${getDecisionColor().split(' ')[1]} ${decision === 'block' ? 'hud-glow-red' : decision === 'warn' ? 'hud-glow-yellow' : 'hud-glow-green'}`}>
          {getDecisionText()}
        </h3>
        <p className="text-xs uppercase tracking-[0.2em] text-text-secondary/60">
          {language === 'bn' ? 'ঝুঁকির স্তর' : 'Risk Level'}:{' '}
          <span className="font-bold text-text-primary">{risk_level}</span>
        </p>
      </div>

      {/* Gauge */}
      <div className="flex justify-center my-6 relative z-10">
        <FraudGauge probability={fraud_probability} size={250} decision={decision} />
      </div>

      {/* Processing Info */}
      <div className="mt-6 pt-6 border-t border-white/10 flex justify-between text-[10px] font-mono uppercase tracking-widest text-text-secondary/60 relative z-10">
        <span>
          {language === 'bn' ? 'প্রক্রিয়াকরণ সময়' : 'Latency'}:{' '}
          <span className="text-text-primary">{prediction.processing_time_ms}ms</span>
        </span>
        <span>
          {language === 'bn' ? 'মডেল সংস্করণ' : 'Engine'}:{' '}
          <span className="text-text-primary">v{prediction.model_version}</span>
        </span>
      </div>
    </div>
  )
}

