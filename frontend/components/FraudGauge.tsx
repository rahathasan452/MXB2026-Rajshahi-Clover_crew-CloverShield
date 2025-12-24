/**
 * Fraud Gauge Component
 * Visual gauge chart for fraud probability (replaces Streamlit gauge)
 */

import React from 'react'
import { Cell, PieChart, Pie, ResponsiveContainer, Label } from 'recharts'

interface FraudGaugeProps {
  probability: number // 0-1
  threshold?: number
  size?: number
}

export const FraudGauge: React.FC<FraudGaugeProps> = ({
  probability,
  threshold = 0.0793,
  size = 200,
}) => {
  // Calculate fraud risk score based on threshold
  // If probability >= threshold, risk score = 100%
  // If probability < threshold, map it proportionally: (probability / threshold) * 100
  const fraudRiskScore = probability >= threshold 
    ? 100 
    : (probability / threshold) * 100
  
  const percentage = parseFloat(fraudRiskScore.toFixed(1))
  const thresholdPercentage = Math.round(threshold * 100)
  
  // Use fraudRiskScore for visual display (0-100 scale)
  const displayProbability = fraudRiskScore / 100 // Convert back to 0-1 for visual calculations

  // Create data for gauge (3 segments: safe, caution, danger)
  const data = [
    { name: 'Safe', value: 30, color: '#00FF88' },
    { name: 'Caution', value: 40, color: '#FFD700' },
    { name: 'Danger', value: 30, color: '#FF4444' },
  ]

  // Calculate angle for current fraud risk score
  const angle = 180 - (displayProbability * 180) // 0-1 maps to 180-0 degrees

  const getColor = () => {
    // Color based on fraud risk score (0-100%)
    if (percentage >= 70) return '#FF4444' // danger
    if (percentage >= 30) return '#FFD700' // caution
    return '#00FF88' // success
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 }}>
        {/* Gauge Background */}
        <svg
          width={size}
          height={size / 2}
          viewBox={`0 0 ${size} ${size / 2}`}
          className="overflow-visible"
        >
          {/* Safe zone (0-30%) */}
          <path
            d={`M 0 ${size / 2} A ${size / 2} ${size / 2} 0 0 1 ${size} ${size / 2}`}
            fill="none"
            stroke="#00FF88"
            strokeWidth="20"
            strokeDasharray={`${(30 / 100) * Math.PI * (size / 2)} ${Math.PI * (size / 2)}`}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Caution zone (30-70%) */}
          <path
            d={`M 0 ${size / 2} A ${size / 2} ${size / 2} 0 0 1 ${size} ${size / 2}`}
            fill="none"
            stroke="#FFD700"
            strokeWidth="20"
            strokeDasharray={`${(40 / 100) * Math.PI * (size / 2)} ${Math.PI * (size / 2)}`}
            strokeDashoffset={`-${(30 / 100) * Math.PI * (size / 2)}`}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Danger zone (70-100%) */}
          <path
            d={`M 0 ${size / 2} A ${size / 2} ${size / 2} 0 0 1 ${size} ${size / 2}`}
            fill="none"
            stroke="#FF4444"
            strokeWidth="20"
            strokeDasharray={`${(30 / 100) * Math.PI * (size / 2)} ${Math.PI * (size / 2)}`}
            strokeDashoffset={`-${(70 / 100) * Math.PI * (size / 2)}`}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Current value indicator */}
          <path
            d={`M 0 ${size / 2} A ${size / 2} ${size / 2} 0 ${displayProbability > 0.5 ? 1 : 0} 1 ${size} ${size / 2}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="20"
            strokeDasharray={`${(percentage / 100) * Math.PI * (size / 2)} ${Math.PI * (size / 2)}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          {/* Threshold line - shows at 100% position since threshold maps to 100% */}
          {threshold > 0 && (
            <line
              x1={size}
              y1={size / 2}
              x2={size / 2}
              y2={size / 2}
              stroke="red"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity={0.5}
            />
          )}
        </svg>

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-4xl font-bold"
              style={{ color: getColor() }}
            >
              {percentage}%
            </div>
            <div className="text-sm text-text-secondary mt-1">
              Fraud Risk
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

