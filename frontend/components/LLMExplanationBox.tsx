/**
 * LLM Explanation Box Component
 * Expandable box for displaying AI-generated explanations
 */

import React, { useState } from 'react'
import { Icon } from './Icon'

interface LLMExplanationBoxProps {
  explanation: string
  language?: 'en' | 'bn'
}

export const LLMExplanationBox: React.FC<LLMExplanationBoxProps> = ({
  explanation,
  language = 'en',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Determine if text should be truncated (more than 200 characters)
  const shouldTruncate = explanation.length > 200
  const displayText = isExpanded || !shouldTruncate 
    ? explanation 
    : explanation.substring(0, 200) + '...'

  return (
    <div className="bg-card-bg rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Icon name="psychology" size={24} className="text-primary" />
          {language === 'bn' ? 'AI ব্যাখ্যা' : 'AI Explanation'}
        </h3>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            <Icon 
              name={isExpanded ? "expand_less" : "expand_more"} 
              size={20} 
            />
            <span>
              {isExpanded 
                ? (language === 'bn' ? 'সংক্ষিপ্ত করুন' : 'Show Less')
                : (language === 'bn' ? 'সম্পূর্ণ পড়ুন' : 'Read More')
              }
            </span>
          </button>
        )}
      </div>
      <div className="text-text-primary whitespace-pre-wrap leading-relaxed">
        {displayText}
      </div>
    </div>
  )
}

