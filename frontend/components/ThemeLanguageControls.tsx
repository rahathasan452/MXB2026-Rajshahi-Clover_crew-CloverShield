/**
 * Theme and Language Controls Component
 * Switch between English/Bangla and bKash/Nagad themes
 */

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'

export const ThemeLanguageControls: React.FC = () => {
  const { language, setLanguage, brandTheme } = useAppStore()

  const isBkash = brandTheme === 'bkash'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Language Toggle */}
      <div className="flex items-center gap-1 bg-card-bg/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg">
        <button
          onClick={() => setLanguage('en')}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-black transition-all ${
            language === 'en'
              ? (isBkash ? 'bg-bkash-pink text-white' : 'bg-nagad-orange text-white')
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('bn')}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-black transition-all ${
            language === 'bn'
              ? (isBkash ? 'bg-bkash-pink text-white' : 'bg-nagad-orange text-white')
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          বাং
        </button>
      </div>
    </div>
  )
}
