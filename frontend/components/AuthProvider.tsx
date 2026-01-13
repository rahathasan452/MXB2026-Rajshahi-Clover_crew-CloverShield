/**
 * Auth Provider Component
 * Manages authentication state and session persistence
 */

'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { onAuthStateChange, getSession } from '@/lib/auth'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setAuthUser, setAuthSession, setAuthInitialized } = useAppStore()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getSession()
        if (session) {
          setAuthSession(session)
          setAuthUser(session.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setAuthInitialized(true)
      }
    }

    initializeAuth()

    // Listen to auth state changes
    const {
      data: { subscription },
    } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      if (session) {
        setAuthSession(session)
        setAuthUser(session.user)
      } else {
        setAuthSession(null)
        setAuthUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setAuthUser, setAuthSession])

  return <>{children}</>
}

