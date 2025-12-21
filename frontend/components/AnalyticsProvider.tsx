/**
 * Analytics Provider Component
 * Initializes analytics on mount and provides context
 */

'use client'

import { useEffect } from 'react'
import { initAnalytics, trackPageView } from '@/lib/analytics'

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Initialize analytics
    initAnalytics()

    // Track initial page view
    trackPageView('home')
  }, [])

  return <>{children}</>
}

