/**
 * Analytics Integration
 * PostHog for user session and event tracking
 * Replaces manual "Session Stats" counter from legacy config.py
 */

import posthog from 'posthog-js'

let isInitialized = false

/**
 * Initialize PostHog analytics
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return // Server-side check

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!posthogKey) {
    console.warn('PostHog key not found. Analytics disabled.')
    return
  }

  if (isInitialized) {
    return
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PostHog analytics initialized')
        }
      },
      capture_pageview: true,
      capture_pageleave: true,
    })
    isInitialized = true
  } catch (error) {
    console.error('Failed to initialize PostHog:', error)
  }
}

/**
 * Track a custom event
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>
) => {
  if (typeof window === 'undefined') return
  if (!isInitialized) {
    initAnalytics()
  }

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Identify a user
 */
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return
  if (!isInitialized) {
    initAnalytics()
  }

  try {
    posthog.identify(userId, properties)
  } catch (error) {
    console.error('Failed to identify user:', error)
  }
}

/**
 * Track transaction events
 */
export const trackTransaction = (data: {
  transactionId: string
  senderId: string
  receiverId: string
  amount: number
  type: string
  fraudProbability: number
  decision: 'pass' | 'warn' | 'block'
  riskLevel: string
}) => {
  trackEvent('transaction_processed', {
    transaction_id: data.transactionId,
    sender_id: data.senderId,
    receiver_id: data.receiverId,
    amount: data.amount,
    transaction_type: data.type,
    fraud_probability: data.fraudProbability,
    decision: data.decision,
    risk_level: data.riskLevel,
  })

  // Track specific decision types
  if (data.decision === 'block') {
    trackEvent('transaction_blocked', {
      transaction_id: data.transactionId,
      fraud_probability: data.fraudProbability,
      amount: data.amount,
    })
  } else if (data.decision === 'warn') {
    trackEvent('transaction_warned', {
      transaction_id: data.transactionId,
      fraud_probability: data.fraudProbability,
      amount: data.amount,
    })
  } else {
    trackEvent('transaction_approved', {
      transaction_id: data.transactionId,
      fraud_probability: data.fraudProbability,
      amount: data.amount,
    })
  }
}

/**
 * Track user actions
 */
export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  trackEvent(`user_action_${action}`, properties)
}

/**
 * Track page views
 */
export const trackPageView = (pageName: string) => {
  trackEvent('page_view', { page_name: pageName })
}

/**
 * Track analytics dashboard views
 */
export const trackAnalyticsView = () => {
  trackEvent('analytics_viewed')
}

/**
 * Track ML API calls
 */
export const trackMLAPICall = (data: {
  success: boolean
  processingTimeMs: number
  error?: string
}) => {
  trackEvent('ml_api_call', {
    success: data.success,
    processing_time_ms: data.processingTimeMs,
    error: data.error,
  })
}

// Fallback to Google Analytics if PostHog is not available
export const initGoogleAnalytics = () => {
  if (typeof window === 'undefined') return

  const gaId = process.env.NEXT_PUBLIC_GA_ID

  if (!gaId) {
    console.warn('Google Analytics ID not found. Analytics disabled.')
    return
  }

  // Add Google Analytics script
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script1)

  const script2 = document.createElement('script')
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `
  document.head.appendChild(script2)

  console.log('✅ Google Analytics initialized')
}

// Export gtag function for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export const trackGAEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
