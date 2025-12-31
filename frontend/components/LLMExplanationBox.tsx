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
  // Use Array.from to properly handle Unicode characters (including Bangla)
  const explanationChars = Array.from(explanation)
  const shouldTruncate = explanationChars.length > 200
  const displayText = isExpanded || !shouldTruncate 
    ? explanation 
    : explanationChars.slice(0, 200).join('') + '...'

  return (
    <div className="hud-card p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="scanline" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-xl font-black text-primary hud-glow-blue flex items-center gap-2 tracking-tight">
          <Icon name="psychology" size={24} />
          {language === 'bn' ? 'এআই বিশ্লেষণ রিপোর্ট' : 'AI ANALYSIS REPORT'}
        </h3>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-primary hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            <span>
              {isExpanded 
                ? (language === 'bn' ? 'বন্ধ করুন' : 'COLLAPSE')
                : (language === 'bn' ? 'আরও দেখুন' : 'EXPAND DATA')
              }
            </span>
            <Icon 
              name={isExpanded ? "expand_less" : "expand_more"} 
              size={16} 
            />
          </button>
        )}
      </div>
      <div className="text-text-primary/90 whitespace-pre-wrap leading-relaxed break-words font-medium relative z-10 italic">
        {displayText}
      </div>
      <div className="absolute top-0 right-0 p-1 opacity-20">
        <div className="text-[8px] font-mono rotate-90 origin-top-right translate-x-1 translate-y-4 tracking-[0.5em] text-primary">
          NEURAL_LINK_ACTIVE
        </div>
      </div>
    </div>
  )
}

