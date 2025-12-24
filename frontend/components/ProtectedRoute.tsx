/**
 * Protected Route Component
 * Wrapper component to protect routes that require authentication
 * Redirects to landing page if user is not authenticated
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authUser } = useAppStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Small delay to ensure store is initialized
    const checkAuth = () => {
      if (authUser === null) {
        // User is not authenticated, redirect to landing page
        router.push('/')
      } else {
        // User is authenticated, allow access
        setIsChecking(false)
      }
    }

    // Check immediately
    checkAuth()

    // Also check after a brief delay to handle async store initialization
    const timeout = setTimeout(() => {
      checkAuth()
    }, 100)

    return () => clearTimeout(timeout)
  }, [authUser, router])

  // Show loading spinner while checking auth state or if not authenticated
  if (isChecking || authUser === null) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Icon name="refresh" size={48} className="text-primary" />
          </div>
          <p className="text-text-secondary text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // User is authenticated, render protected content
  return <>{children}</>
}

