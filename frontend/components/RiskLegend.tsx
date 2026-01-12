import React from 'react'
import { Icon } from './Icon'

interface RiskLegendProps {
  language?: 'en' | 'bn'
}

export const RiskLegend: React.FC<RiskLegendProps> = ({ language = 'en' }) => {
  const items = [
    { label: language === 'bn' ? 'উচ্চ ঝুঁকি (>০.৭)' : 'High Risk (>0.7)', color: '#EF4444' },
    { label: language === 'bn' ? 'সন্দেহজনক (>০.৩)' : 'Suspicious (>0.3)', color: '#F59E0B' },
    { label: language === 'bn' ? 'প্রেরক' : 'Sender', color: '#60A5FA' },
    { label: language === 'bn' ? 'প্রাপক' : 'Receiver', color: '#F472B6' },
  ]

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex flex-col gap-2">
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
        <Icon name="legend_toggle" size={12} />
        {language === 'bn' ? 'সংকেত' : 'Legend'}
      </h4>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}44` }}
            />
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
