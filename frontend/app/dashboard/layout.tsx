/**
 * Dashboard Layout
 * Wraps all dashboard pages with a persistent Sidebar and Header
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAppStore } from '@/store/useAppStore'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { authUser, isAuthInitialized, setAuthModalOpen } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthInitialized && !authUser) {
      router.push('/')
      // Small delay to ensure we are on the landing page before opening modal
      setTimeout(() => setAuthModalOpen(true), 100)
    }
  }, [isAuthInitialized, authUser, router, setAuthModalOpen])

  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-[#050714] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!authUser) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen bg-[#050714]">
      {/* Sidebar with Mobile State */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header setMobileOpen={setMobileOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}