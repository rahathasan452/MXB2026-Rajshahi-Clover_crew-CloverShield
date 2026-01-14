/**
 * Supabase Auth Integration
 * Handles user authentication (if needed for future features)
 * Currently, the app uses public access with RLS policies
 */

import { supabase } from './supabase'

/**
 * Sign up a new user
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Sign in an existing user
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Ensure public user profile exists (Client-side failover)
  if (data.user) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .single()

    if (!userProfile) {
      console.log('User profile missing, creating fallback...')
      await supabase.from('users').insert({
        user_id: data.user.id,
        name_en: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        // Fallback phone formatted to fit potential constraints if migration failed; 
        // ideally migration 025 fixed column width but we stay safe.
        phone: data.user.phone || data.user.email || 'No-Contact',
        provider: 'Auth',
        balance: 0,
        account_age_days: 0,
        verified: false,
        kyc_complete: false,
        risk_level: 'low'
      })
    }
  }

  return data
}

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    // If the session is missing, we are effectively already signed out.
    // We can ignore this specific error to allow the UI to clean up gracefully.
    if (error.message.includes('Auth session missing')) {
      // Forcefully clear local storage to ensure client state is reset
      // This prevents the 'AuthProvider' from re-hydrating the dead session
      if (typeof window !== 'undefined') {
        window.localStorage.clear()
      }
      return
    }
    throw error
  }
}

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Get current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

