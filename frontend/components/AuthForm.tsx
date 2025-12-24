/**
 * Authentication Form Component
 * Handles user sign up and sign in
 */

'use client'

import React, { useState } from 'react'
import { signIn, signUp } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'
import { Icon } from './Icon'

interface AuthFormProps {
  onClose?: () => void
  initialMode?: 'signin' | 'signup'
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onClose,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { language } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { user } = await signUp(email, password)
        toast.success(
          language === 'bn'
            ? 'সাইন আপ সফল! আপনার ইমেইল চেক করুন'
            : 'Sign up successful! Please check your email'
        )
        // Switch to sign in mode after successful signup
        setMode('signin')
        setEmail('')
        setPassword('')
      } else {
        await signIn(email, password)
        toast.success(
          language === 'bn' ? 'সফলভাবে সাইন ইন করা হয়েছে' : 'Signed in successfully'
        )
        onClose?.()
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(
        error.message ||
          (language === 'bn'
            ? 'ত্রুটি হয়েছে'
            : 'An error occurred')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card-bg rounded-2xl p-8 border border-white/10 shadow-lg max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          {mode === 'signup'
            ? language === 'bn'
              ? 'সাইন আপ করুন'
              : 'Sign Up'
            : language === 'bn'
            ? 'সাইন ইন করুন'
            : 'Sign In'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Icon name="close" size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            {language === 'bn' ? 'ইমেইল' : 'Email'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={language === 'bn' ? 'আপনার ইমেইল' : 'your@email.com'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={language === 'bn' ? 'আপনার পাসওয়ার্ড' : 'Password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          )}
          {mode === 'signup'
            ? language === 'bn'
              ? 'সাইন আপ করুন'
              : 'Sign Up'
            : language === 'bn'
            ? 'সাইন ইন করুন'
            : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setEmail('')
            setPassword('')
          }}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          {mode === 'signin'
            ? language === 'bn'
              ? 'অ্যাকাউন্ট নেই? সাইন আপ করুন'
              : "Don't have an account? Sign Up"
            : language === 'bn'
            ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? সাইন ইন করুন'
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  )
}

