'use client'

import React from 'react'
import { ThemeLanguageControls } from '@/components/ThemeLanguageControls'
import { Icon } from '@/components/Icon'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
          <Link href="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center">
            <Icon name="home" size={16} className="mr-2 flex-shrink-0" />
          </Link>
          <span className="mx-2 text-gray-700">/</span>

          {displaySegments.length === 0 && (
            <span className="text-white font-medium">Mission Control</span>
          )}

          {displaySegments.map((segment, idx) => {
            const isLast = idx === displaySegments.length - 1
            const label = formatBreadcrumb(segment, language as 'en' | 'bn')
            // Reconstruct path up to this segment
            // Note: displaySegments is just 'segments', so we slice from original segments
            const href = '/' + segments.slice(0, idx + 1).join('/')

            return (
              <React.Fragment key={idx}>
                {isLast ? (
                  <span className="truncate max-w-[150px] text-white font-medium">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="truncate max-w-[150px] hidden sm:block hover:text-emerald-400 hover:underline transition-colors"
                  >
                    {label}
                  </Link>
                )}
                {!isLast && <span className="mx-2 hidden sm:block">/</span>}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-4">
        
        <ThemeLanguageControls />

        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0A0E17] animate-pulse" />
        </button>
      </div>
    </header>
  )
}