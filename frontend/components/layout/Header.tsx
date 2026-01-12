'use client'

import React from 'react'
import { ThemeLanguageControls } from '@/components/ThemeLanguageControls'
import { Icon } from '@/components/Icon'
import { usePathname } from 'next/navigation'

export const Header = () => {
  const pathname = usePathname()
  
  // Simple breadcrumb logic
  const segments = pathname.split('/').filter(Boolean)
  const currentPage = segments[segments.length - 1] || 'Dashboard'

  return (
    <header className="h-16 bg-[#0A0E17]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-6 flex items-center justify-between">
      
      {/* Left: Breadcrumbs / Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm text-gray-500">
          <Icon name="home" size={16} className="mr-2" />
          <span className="mx-2">/</span>
          {segments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <span className={`capitalize ${idx === segments.length - 1 ? 'text-white font-medium' : ''}`}>
                {segment.replace(/-/g, ' ')}
              </span>
              {idx < segments.length - 1 && <span className="mx-2">/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search cases, IDs, or alerts..." 
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64 transition-all focus:w-80 focus:bg-white/10"
          />
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        <div className="h-6 w-px bg-white/10 mx-2" />

        <ThemeLanguageControls />
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0A0E17]" />
        </button>
      </div>
    </header>
  )
}
