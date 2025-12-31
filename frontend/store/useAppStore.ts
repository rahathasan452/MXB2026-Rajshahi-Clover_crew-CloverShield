/**
 * Zustand Store for App State
 * Replaces Streamlit session state
 */

import { create } from 'zustand'
import { User, Transaction } from '@/lib/supabase'
import { PredictResponse } from '@/lib/ml-api'

interface AppState {
  // Language
  language: 'en' | 'bn'
  setLanguage: (lang: 'en' | 'bn') => void

  // Brand Theme
  brandTheme: 'bkash' | 'nagad'
  setBrandTheme: (theme: 'bkash' | 'nagad') => void

  // Simulation
  isSimulating: boolean
  simulationSpeed: number
  setIsSimulating: (isSimulating: boolean) => void
  setSimulationSpeed: (speed: number) => void

  // Auth
  authUser: any | null
  authSession: any | null
  setAuthUser: (user: any | null) => void
  setAuthSession: (session: any | null) => void

  // Users
  users: User[]
  selectedUser: User | null
  setUsers: (users: User[]) => void
  setSelectedUser: (user: User | null) => void

  // Transaction Form
  transactionForm: {
    senderId: string | null
    receiverId: string | null
    amount: number
    type: 'CASH_OUT' | 'TRANSFER'
    note: string
  }
  setTransactionForm: (form: Partial<AppState['transactionForm']>) => void
  resetTransactionForm: () => void

  // Prediction Results
  currentPrediction: PredictResponse | null
  setCurrentPrediction: (prediction: PredictResponse | null) => void

  // Analytics
  analytics: {
    moneySaved: number
    transactionsProcessed: number
    fraudDetected: number
    accuracyRate: number
  }
  setAnalytics: (analytics: Partial<AppState['analytics']>) => void
  incrementTransactions: () => void
  incrementFraudDetected: (amount: number) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  errors: string[]
  setError: (error: string) => void
  clearErrors: () => void
}

const initialState = {
  language: 'en' as const,
  brandTheme: 'bkash' as const,
  isSimulating: false,
  simulationSpeed: 1,
  authUser: null,
  authSession: null,
  users: [],
  selectedUser: null,
  transactionForm: {
    senderId: null,
    receiverId: null,
    amount: 5000,
    type: 'CASH_OUT' as const,
    note: '',
  },
  currentPrediction: null,
  analytics: {
    moneySaved: 2547890,
    transactionsProcessed: 15847,
    fraudDetected: 342,
    accuracyRate: 99.8,
  },
  isLoading: false,
  errors: [],
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setLanguage: (lang) => set({ language: lang }),

  setBrandTheme: (theme) => set({ brandTheme: theme }),
  
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  setAuthUser: (user) => set({ authUser: user }),
  setAuthSession: (session) => set({ authSession: session }),

  setUsers: (users) => set({ users }),
  setSelectedUser: (user) => set({ selectedUser: user }),

  setTransactionForm: (form) =>
    set((state) => ({
      transactionForm: { ...state.transactionForm, ...form },
    })),
  resetTransactionForm: () =>
    set({
      transactionForm: initialState.transactionForm,
      currentPrediction: null,
    }),

  setCurrentPrediction: (prediction) => set({ currentPrediction: prediction }),

  setAnalytics: (analytics) =>
    set((state) => ({
      analytics: { ...state.analytics, ...analytics },
    })),
  incrementTransactions: () =>
    set((state) => ({
      analytics: {
        ...state.analytics,
        transactionsProcessed: state.analytics.transactionsProcessed + 1,
      },
    })),
  incrementFraudDetected: (amount) =>
    set((state) => ({
      analytics: {
        ...state.analytics,
        fraudDetected: state.analytics.fraudDetected + 1,
        moneySaved: state.analytics.moneySaved + amount,
      },
    })),

  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) =>
    set((state) => ({ errors: [...state.errors, error] })),
  clearErrors: () => set({ errors: [] }),
}))

