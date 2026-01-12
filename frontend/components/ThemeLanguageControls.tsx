/**
 * Theme and Language Controls Component
 * Switch between English/Bangla and bKash/Nagad themes
 */

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'

export const ThemeLanguageControls: React.FC = () => {
  const { language, setLanguage, brandTheme, theme, setTheme } = useAppStore()

  const isBkash = brandTheme === 'bkash'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-card-bg/80 backdrop-blur-md border border-border-main/20 shadow-lg text-text-secondary hover:text-text-primary transition-all hover:scale-105 active:scale-95"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <Icon 
          name={theme === 'dark' ? 'light_mode' : 'dark_mode'} 
          size={20} 
          className={theme === 'light' ? 'text-orange-500' : 'text-yellow-400'}
        />
      </button>

      {/* Language Toggle */}
      <div className="flex items-center gap-1 bg-card-bg/80 backdrop-blur-md rounded-full p-1 border border-border-main/20 shadow-lg">
        <button
          onClick={() => setLanguage('en')}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-black transition-all ${
            language === 'en'
              ? 'bg-clover text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('bn')}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-black transition-all ${
            language === 'bn'
              ? 'bg-clover text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          বাং
        </button>
      </div>
    </div>
  )
}
