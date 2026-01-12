'use client'

import React from 'react'
import { ThemeLanguageControls } from '@/components/ThemeLanguageControls'
import { Icon } from '@/components/Icon'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { formatBreadcrumb } from '@/config/navigation'

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen }) => {
  const pathname = usePathname()
  const { language } = useAppStore()
  
  const segments = pathname.split('/').filter(Boolean)
  // Remove 'dashboard' from display if it's the first element, as it's redundant with Home icon
  const displaySegments = segments.slice(0) // Copy

  return (
    <header className="h-16 bg-[#0A0E17]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white active:scale-95 transition-all"
        >
          <Icon name="menu" />
        </button>

        <div className="flex items-center text-sm text-gray-500 whitespace-nowrap overflow-hidden">
          <Icon name="home" size={16} className="mr-2 flex-shrink-0" />
          <span className="mx-2 text-gray-700">/</span>
          
          {displaySegments.length === 0 && (
             <span className="text-white font-medium">Mission Control</span>
          )}

          {displaySegments.map((segment, idx) => {
            const isLast = idx === displaySegments.length - 1
            const label = formatBreadcrumb(segment, language as 'en' | 'bn')

            return (
              <React.Fragment key={idx}>
                <span className={`truncate max-w-[150px] ${isLast ? 'text-white font-medium' : 'hidden sm:block'}`}>
                  {label}
                </span>
                {!isLast && <span className="mx-2 hidden sm:block">/</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-4">
        {/* Search - Collapsed on mobile */}
        <div className="relative hidden md:block group">
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'অনুসন্ধান...' : 'Search...'}
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 transition-all focus:w-72 focus:bg-white/10"
          />
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
        </div>
        <button className="md:hidden p-2 text-gray-400">
           <Icon name="search" size={20} />
        </button>

        <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />

        <ThemeLanguageControls />
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0A0E17] animate-pulse" />
        </button>
      </div>
    </header>
  )
}