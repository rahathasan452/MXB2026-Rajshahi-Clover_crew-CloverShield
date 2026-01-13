/**
 * Customer 360 - Profile View
 * Deep dive into user identity and history
 */

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { UserProfileCard } from '@/components/UserProfileCard'
import { NetworkGraph } from '@/components/NetworkGraph'
import { Icon } from '@/components/Icon'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { SARReportGenerator } from '@/components/SARReportGenerator'
import { QRDataBridge } from '@/components/QRDataBridge'
import { UserProfile, Transaction } from '@/types/dashboard'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useAppStore()

  // Typed State
  const [user, setUser] = useState<UserProfile | null>(null)
  const [history, setHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string>('')

  const userId = params.id as string

  useEffect(() => {
    if (userId && userId !== 'search') {
      setReportId(`CASE-${userId}-${Date.now().toString().slice(-4)}`)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || userId === 'search') {
      setLoading(false)
      return
    }

    const loadProfileData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parallel Fetching: User Data & Transaction History
        const [userResponse, txResponse] = await Promise.all([
          // 1. Fetch User (Test Dataset)
          supabase
            .from('test_dataset')
            .select('*')
            .or(`nameOrig.eq.${userId},nameDest.eq.${userId}`)
            .limit(1),

          // 2. Fetch History (Live)
          supabase
            .from('transaction_history')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('transaction_timestamp', { ascending: false })
            .limit(10)
        ])

        // Process User Data
        let userData: UserProfile | null = null
        if (userResponse.data && userResponse.data.length > 0) {
          const td = userResponse.data[0]
          const isSender = td.nameOrig === userId
          userData = {
            user_id: userId,
            name_en: isSender ? `Sender ${userId}` : `Receiver ${userId}`,
            name_bn: isSender ? `প্রেরক ${userId}` : `প্রাপক ${userId}`,
            phone: 'N/A',
            provider: 'Mobile Money',
            balance: isSender ? td.oldBalanceOrig : td.oldBalanceDest,
            account_age_days: 0,
            total_transactions: 1,
            avg_transaction_amount: td.amount,
            verified: false,
            kyc_complete: false,
            risk_level: td.isFlaggedFraud ? 'high' : 'low',
            is_from_test_dataset: true
          }
        }

        if (!userData) {
          setError('User not found in dataset')
          setLoading(false)
          return
        }

        setUser(userData)

        // Process History
        const historyData: Transaction[] = []
        if (txResponse.data) {
          historyData.push(...(txResponse.data as any[]))
        }

        // If history is scarce, supplement with test_dataset raw data
        if (historyData.length < 5) {
          const rawTestResponse = await supabase
            .from('test_dataset')
            .select('*')
            .or(`nameOrig.eq.${userId},nameDest.eq.${userId}`)
            .order('step', { ascending: false })
            .limit(20)

          if (rawTestResponse.data) {
            const mappedRaw = rawTestResponse.data.map((td: any) => ({
              transaction_id: `test-${td.id}`,
              sender_id: td.nameOrig,
              receiver_id: td.nameDest,
              amount: td.amount,
              transaction_type: td.type,
              created_at: new Date(Date.now() - (td.step * 3600000)).toISOString(),
              status: 'COMPLETED' as const,
              is_test_data: true,
              fraud_probability: td.isFlaggedFraud ? 1.0 : 0.0
            }))
            historyData.push(...mappedRaw)
          }
        }

        setHistory(historyData.sort((a, b) =>
          new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
        ))

      } catch (err: any) {
        console.error('Profile load error:', err)
        setError('Failed to load profile data. Network error.')
        toast.error('Connection failed')
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [userId])

  // Search Mode
  const [searchId, setSearchId] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showFrequent, setShowFrequent] = useState(false)
  const [frequentAccounts, setFrequentAccounts] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch frequent accounts on mount
  useEffect(() => {
    const fetchFrequent = async () => {
      const { data } = await supabase
        .from('test_dataset_engineered')
        .select('nameDest, dest_txn_count')
        .order('dest_txn_count', { ascending: false })
        .limit(100)

      if (data) {
        const uniqueReceivers = Array.from(new Set(data.map((d: any) => d.nameDest as string)))
        setFrequentAccounts(uniqueReceivers.slice(0, 8))
      }
    }
    fetchFrequent()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchId) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    const timer = setTimeout(async () => {
      if (searchId.length < 2) return

      setIsSearching(true)
      const results: any[] = []

      // Updated: Use fuzzy match (contains) to match transaction input behavior
      const { data: testUsers } = await supabase
        .from('test_dataset')
        .select('nameOrig, nameDest')
        .or(`nameOrig.ilike.%${searchId}%,nameDest.ilike.%${searchId}%`)
        .limit(50)

      if (testUsers) {
        testUsers.forEach((tu: any) => {
          // Check sender
          if (tu.nameOrig.toLowerCase().includes(searchId.toLowerCase()) && !results.find(r => r.user_id === tu.nameOrig)) {
            results.push({ user_id: tu.nameOrig, name_en: `Sender ${tu.nameOrig}`, is_test: true })
          }
          // Check destination
          if (tu.nameDest.toLowerCase().includes(searchId.toLowerCase()) && !results.find(r => r.user_id === tu.nameDest)) {
            results.push({ user_id: tu.nameDest, name_en: `Receiver ${tu.nameDest}`, is_test: true })
          }
        })
      }
      setSearchResults(results.slice(0, 10))
      setIsSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchId) {
      router.push(`/dashboard/profile/${searchId}`)
    }
  }

  // --- RENDER: Search View ---
  if (userId === 'search') {
    return (
      <div className={`min-h-[80vh] flex items-center justify-center ${language === 'bn' ? 'font-bengali' : ''}`}>
        <div className="w-full max-w-md p-8 bg-card-bg border border-white/10 rounded-2xl text-center relative shadow-2xl animate-in zoom-in-95 duration-300">
          <Icon name="person_search" size={64} className="mx-auto mb-6 text-purple-400" />
          <h1 className="text-2xl font-bold mb-2">
            {language === 'bn' ? 'গ্রাহক অনুসন্ধান' : 'Customer 360'}
          </h1>
          <p className="text-text-secondary mb-8">
            {language === 'bn' ? '৩৬০° ঝুঁকি প্রোফাইল দেখতে গ্রাহক আইডি দিন।' : 'Enter a User ID to view 360° risk profile.'}
          </p>

          <form onSubmit={handleSearch} className="space-y-4 relative">
            <div className="relative">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onFocus={() => setShowFrequent(true)}
                onBlur={() => setTimeout(() => setShowFrequent(false), 200)}
                placeholder="Ex: C123456789"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-center text-xl font-mono focus:border-primary focus:outline-none transition-all focus:bg-white/10"
                autoFocus
              />
              {/* Autocomplete & Frequent Dropdown */}
              {(showFrequent || isSearching || (searchId.length > 1 && searchResults.length > 0)) && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto w-full">

                  {/* Loading Indicator */}
                  {isSearching && (
                    <div className="p-4 flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Searching database...</span>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isSearching && searchId.length > 1 && searchResults.map((result, idx) => (
                    <button
                      key={`search-${idx}`}
                      type="button"
                      onClick={() => router.push(`/dashboard/profile/${result.user_id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                          <Icon name="person" size={18} />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-200 group-hover:text-purple-400 transition-colors">
                            {result.user_id}
                          </p>
                          <p className="text-xs text-gray-500">{result.name_en}</p>
                        </div>
                      </div>
                      <Icon name="arrow_forward" size={16} className="text-gray-600 group-hover:text-purple-400 -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                  {/* Frequent / Recent accounts */}
                  {!isSearching && searchId.length < 2 && frequentAccounts.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-white/5 text-[10px] uppercase tracking-wider font-bold text-gray-500 sticky top-0 backdrop-blur-md">
                        {language === 'bn' ? 'ঘনঘন লেনদেন' : 'Frequent Accounts'}
                      </div>
                      {frequentAccounts.map((acc, idx) => (
                        <button
                          key={`freq-${idx}`}
                          type="button"
                          onClick={() => router.push(`/dashboard/profile/${acc}`)}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                              <Icon name="history" size={18} />
                            </div>
                            <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">{acc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-purple-500/20">
              Trace Identity
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- RENDER: Loading / Error ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-gray-400 animate-pulse">Compiling sovereign data...</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-4">
          <Icon name="person_off" size={48} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Profile Unavailable</h2>
        <p className="text-text-secondary max-w-md mb-6">{error || 'The requested user identity could not be resolved in the sovereign database.'}</p>
        <Link href="/dashboard/profile/search" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
          Return to Search
        </Link>
      </div>
    )
  }

  // --- RENDER: Profile Content ---
  return (
    <div className={`space-y-8 pb-12 ${language === 'bn' ? 'font-bengali' : ''}`}>

      {/* Identity Card */}
      <UserProfileCard user={user} language={language} />

      {/* Investigative Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10">
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
            <Icon name="assignment" /> SAR Generator
          </h2>
          <div className="bg-card-bg border border-white/10 rounded-xl p-6 h-full">
            <SARReportGenerator
              caseId={reportId}
              transactions={history}
              analystName="System Administrator"
              analystNotes={`Investigating high-risk activity for user ${userId}.`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-400">
            <Icon name="qr_code_scanner" /> Evidence Export
          </h2>
          <div className="bg-card-bg border border-white/10 rounded-xl p-6 h-full">
            <QRDataBridge
              data={{
                caseId: `CASE-${userId}`,
                transactions: history.slice(0, 5),
                risk: user.risk_level
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Transaction History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="history" /> Activity Log
          </h2>
          <div className="bg-card-bg border border-white/10 rounded-xl overflow-hidden shadow-lg">
            {history.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <div className="divide-y divide-white/10">
                  {history.map(tx => (
                    <div key={tx.transaction_id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.sender_id === userId ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                          }`}>
                          <Icon name={tx.sender_id === userId ? 'arrow_outward' : 'arrow_downward'} size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate max-w-[150px] md:max-w-[200px]" title={tx.sender_id === userId ? tx.receiver_id : tx.sender_id}>
                            {tx.sender_id === userId ? `To: ${tx.receiver_id}` : `From: ${tx.sender_id}`}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {tx.created_at ? formatDistanceToNow(new Date(tx.created_at)) + ' ago' : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold ${tx.sender_id === userId ? 'text-white' : 'text-green-400'
                          }`}>
                          {tx.sender_id === userId ? '-' : '+'} ৳ {tx.amount?.toLocaleString()}
                        </div>
                        <div className="text-xs text-text-secondary uppercase tracking-wider scale-90 origin-right">{tx.transaction_type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-text-secondary flex flex-col items-center">
                <Icon name="inbox" size={48} className="opacity-20 mb-2" />
                <span>No visible transaction history</span>
              </div>
            )}
          </div>
        </div>

        {/* Network Graph */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="hub" /> Relationship Graph
          </h2>
          {/* Provide fallback/empty state within NetworkGraph component ideally, but here we pass data */}
          <div className="bg-card-bg border border-white/10 rounded-xl p-1 min-h-[400px]">
            {history.length > 0 ? (
              <NetworkGraph
                language={language}
                height={400}
                history={history}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Not enough data to generate graph
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
