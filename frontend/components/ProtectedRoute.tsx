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
  const { authUser, isAuthInitialized } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if auth is initialized and we still don't have a user
    if (isAuthInitialized && !authUser) {
      router.push('/')
    }
  }, [isAuthInitialized, authUser, router])

  // Show loading spinner while initializing auth
  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-[#050714] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Icon name="refresh" size={48} className="text-primary" />
          </div>
          <p className="text-text-secondary text-lg">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  // If finalized but no user, we are redirecting (useEffect above), so return null or spinner
  if (!authUser) {
    return null
  }

  // User is authenticated, render protected content
  return <>{children}</>
}

