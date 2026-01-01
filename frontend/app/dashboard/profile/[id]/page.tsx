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

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { language, users } = useAppStore()
  const [user, setUser] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const userId = params.id as string

  useEffect(() => {
    if (!userId) return

    const loadProfile = async () => {
      try {
        setLoading(true)

        // 1. Get User Details
        // ONLY from test_dataset as per request (users table is dummy)
        let userData = null
        
        // Check test_dataset for sender or receiver info
        const { data: testData, error: testError } = await supabase
          .from('test_dataset')
          .select('*')
          .or(`nameOrig.eq.${userId},nameDest.eq.${userId}`)
          .limit(1)
        
        if (testData && testData.length > 0) {
          const td = testData[0]
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
        
        setUser(userData)

        // 2. Get Transaction History
        // Union of live transactions, simulated history, and raw test dataset
        const historyData: any[] = []

        // A. Real/Simulated History
        const { data: txData } = await supabase
          .from('transaction_history')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('transaction_timestamp', { ascending: false })
          .limit(10)
        
        if (txData) historyData.push(...txData)

        // B. Raw Test Dataset (if we need more or if user is only in test_dataset)
        if (historyData.length < 5) {
          const { data: rawTestData } = await supabase
            .from('test_dataset')
            .select('*')
            .or(`nameOrig.eq.${userId},nameDest.eq.${userId}`)
            .order('step', { ascending: false })
            .limit(20) // Increased limit for better graph
          
          if (rawTestData) {
            const mappedRaw = rawTestData.map(td => ({
              transaction_id: `test-${td.id}`,
              sender_id: td.nameOrig,
              receiver_id: td.nameDest,
              amount: td.amount,
              transaction_type: td.type,
              created_at: new Date(Date.now() - (td.step * 3600000)).toISOString(), // Mock time based on step
              status: 'COMPLETED',
              is_test_data: true,
              fraud_probability: td.isFlaggedFraud ? 1.0 : 0.0 // For graph coloring
            }))
            historyData.push(...mappedRaw)
          }
        }

        setHistory(historyData.sort((a, b) => new Date(b.created_at || b.transaction_timestamp).getTime() - new Date(a.created_at || a.transaction_timestamp).getTime()))

      } catch (err: any) {
        console.error('Profile load error:', err)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (userId === 'search') {
      // Show search UI
      setLoading(false)
    } else {
      loadProfile()
    }
  }, [userId, users])

  // Search Mode
  const [searchId, setSearchId] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showFrequent, setShowFrequent] = useState(false)
  const [frequentAccounts, setFrequentAccounts] = useState<string[]>([])

  // Fetch frequent accounts on mount
  useEffect(() => {
    const fetchFrequent = async () => {
      // Fetch some distinct senders from test_dataset to use as examples
      // Note: distinct() is computationally expensive on large tables, so we just take a few
      const { data } = await supabase
        .from('test_dataset')
        .select('nameOrig')
        .limit(5)
      
      if (data) {
        setFrequentAccounts(Array.from(new Set(data.map(d => d.nameOrig))))
      }
    }
    fetchFrequent()
  }, [])
  
  // Debounced search
  useEffect(() => {
    if (!searchId) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      // Only search if length > 1 to avoid too many matches
      if (searchId.length < 2) return

      const results: any[] = []

      // Search ONLY test dataset
      const { data: testUsers } = await supabase
        .from('test_dataset')
        .select('nameOrig, nameDest')
        .or(`nameOrig.ilike.%${searchId}%,nameDest.ilike.%${searchId}%`)
        .limit(5)
      
      if (testUsers) {
        testUsers.forEach(tu => {
          if (tu.nameOrig.toLowerCase().includes(searchId.toLowerCase()) && !results.find(r => r.user_id === tu.nameOrig)) {
            results.push({ user_id: tu.nameOrig, name_en: `Sender ${tu.nameOrig}`, is_test: true })
          }
          if (tu.nameDest.toLowerCase().includes(searchId.toLowerCase()) && !results.find(r => r.user_id === tu.nameDest)) {
            results.push({ user_id: tu.nameDest, name_en: `Receiver ${tu.nameDest}`, is_test: true })
          }
        })
      }
      
      setSearchResults(results.slice(0, 10))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchId) {
      router.push(`/dashboard/profile/${searchId}`)
    }
  }

  if (userId === 'search') {
    return (
      <div className={`min-h-screen bg-[#050714] text-white flex items-center justify-center ${language === 'bn' ? 'font-bengali' : ''}`}>
        <div className="w-full max-w-md p-8 bg-card-bg border border-white/10 rounded-2xl text-center relative">
          <Icon name="person_search" size={64} className="mx-auto mb-6 text-purple-400" />
          <h1 className="text-2xl font-bold mb-2">Customer Search</h1>
          <p className="text-text-secondary mb-8">Enter a User ID (e.g. C12345) to view their 360° profile.</p>
          
          <form onSubmit={handleSearch} className="space-y-4 relative">
            <div className="relative">
              <input 
                type="text" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onFocus={() => setShowFrequent(true)}
                onBlur={() => setTimeout(() => setShowFrequent(false), 200)}
                placeholder="User ID or Name..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-center text-xl font-mono focus:border-primary focus:outline-none"
                autoFocus
              />
              
              {/* Frequent Accounts Dropdown */}
              {showFrequent && !searchId && frequentAccounts.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-card-bg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
                  <div className="p-2 text-xs text-text-secondary uppercase font-bold bg-white/5">Example Accounts</div>
                  {frequentAccounts.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => router.push(`/dashboard/profile/${acc}`)}
                      className="w-full text-left p-3 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors flex items-center justify-between"
                    >
                      <span className="font-mono text-sm">{acc}</span>
                      <Icon name="arrow_forward" size={14} className="opacity-50" />
                    </button>
                  ))}
                 </div>
              )}
            </div>
            
            {/* Autocomplete Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card-bg border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 text-left">
                {searchResults.map((user) => (
                  <Link 
                    key={user.user_id} 
                    href={`/dashboard/profile/${user.user_id}`}
                    className="block p-4 hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {user.name_en}
                          {user.is_test && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase">
                              Test Dataset
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-secondary font-mono">{user.user_id}</div>
                      </div>
                      <Icon name="chevron_right" size={16} className="text-text-secondary" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/dashboard" className="flex-1 py-3 text-text-secondary hover:text-white transition-colors">
                Cancel
              </Link>
              <button type="submit" className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-lg transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#050714] text-white ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Nav */}
       <div className="bg-gradient-header border-b border-white/10 p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <Icon name="arrow_back" />
            <span className="font-bold">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Icon name="badge" className="text-purple-400" />
            {language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Customer 360'}
          </h1>
          <Link href="/dashboard/profile/search" className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
             New Search
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : user ? (
          <div className="space-y-8 animate-fade-in">
            {/* Identity Card */}
            <UserProfileCard user={user} language={language} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Transaction History */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="history" /> Recent Activity
                </h2>
                <div className="bg-card-bg border border-white/10 rounded-xl overflow-hidden">
                  {history.length > 0 ? (
                    <div className="divide-y divide-white/10">
                      {history.map(tx => (
                        <div key={tx.transaction_id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              tx.sender_id === userId ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                            }`}>
                              <Icon name={tx.sender_id === userId ? 'arrow_outward' : 'arrow_downward'} size={16} />
                            </div>
                            <div>
                              <div className="font-bold">
                                {tx.sender_id === userId ? `To: ${tx.receiver_id}` : `From: ${tx.sender_id}`}
                              </div>
                              <div className="text-xs text-text-secondary">
                                {tx.created_at ? formatDistanceToNow(new Date(tx.created_at)) + ' ago' : 'Unknown'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-bold ${
                              tx.sender_id === userId ? 'text-white' : 'text-green-400'
                            }`}>
                              {tx.sender_id === userId ? '-' : '+'} ৳ {tx.amount?.toLocaleString()}
                            </div>
                            <div className="text-xs text-text-secondary uppercase">{tx.transaction_type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-secondary">No recent transactions found.</div>
                  )}
                </div>
              </div>

              {/* Network Graph */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Icon name="hub" /> Relationship Graph
                </h2>
                 <NetworkGraph 
                    language={language} 
                    height={400} 
                    history={history}
                 />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
             <Icon name="person_off" size={64} className="mx-auto mb-4 text-text-secondary" />
             <h2 className="text-xl font-bold">User Not Found</h2>
             <p className="text-text-secondary">Could not locate user ID: {userId}</p>
             <Link href="/dashboard/profile/search" className="inline-block mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
                Try Another Search
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
