/**
 * Language Toggle Component
 * Switch between English and Bangla
 */

import React from 'react'
import { useAppStore } from '@/store/useAppStore'

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useAppStore()

  return (
    <div className="flex items-center gap-2 bg-card-bg rounded-full p-1 border border-white/10">
      <button
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-full font-semibold transition-all ${
          language === 'en'
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('bn')}
        className={`px-4 py-2 rounded-full font-semibold transition-all ${
          language === 'bn'
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        BN
      </button>
    </div>
  )
}

