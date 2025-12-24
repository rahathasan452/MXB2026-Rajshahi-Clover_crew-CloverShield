/**
 * Auth Button Component
 * Shows login/logout button based on auth state
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { signOut } from '@/lib/auth'
import { AuthForm } from './AuthForm'
import { Icon } from './Icon'
import toast from 'react-hot-toast'

export const AuthButton: React.FC = () => {
  const router = useRouter()
  const { authUser, language, setAuthUser, setAuthSession } = useAppStore()
  const [showAuthForm, setShowAuthForm] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAuthForm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAuthForm])

  const handleSignOut = async () => {
    try {
      await signOut()
      setAuthUser(null)
      setAuthSession(null)
      toast.success(
        language === 'bn' ? 'সফলভাবে সাইন আউট করা হয়েছে' : 'Signed out successfully'
      )
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(
        error.message || (language === 'bn' ? 'ত্রুটি হয়েছে' : 'An error occurred')
      )
    }
  }

  if (authUser) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2">
            <Icon name="account_circle" size={20} className="text-primary" />
            <span className="text-sm text-text-primary font-medium">
              {authUser.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-danger/10 border border-danger/30 rounded-full text-danger text-sm font-semibold hover:bg-danger/20 transition-colors flex items-center gap-2"
          >
            <Icon name="logout" size={18} />
            {language === 'bn' ? 'সাইন আউট' : 'Sign Out'}
          </button>
        </div>

        {/* Auth Form Modal */}
        {showAuthForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto min-h-screen">
            <div className="flex items-center justify-center min-h-full w-full py-8">
              <AuthForm onClose={() => setShowAuthForm(false)} />
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowAuthForm(true)}
        className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/80 transition-colors flex items-center gap-2"
      >
        <Icon name="login" size={18} />
        {language === 'bn' ? 'সাইন ইন' : 'Sign In'}
      </button>

      {/* Auth Form Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto min-h-screen">
          <div className="flex items-center justify-center min-h-full w-full py-8">
            <AuthForm
              onClose={() => setShowAuthForm(false)}
              initialMode="signin"
            />
          </div>
        </div>
      )}
    </>
  )
}

