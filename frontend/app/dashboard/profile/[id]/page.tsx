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
        // Try from store first, then DB
        let userData = users.find(u => u.user_id === userId)
        if (!userData) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          if (error) throw error
          userData = data
        }
        setUser(userData)

        // 2. Get Transaction History
        // Union of live transactions and test history
        const { data: txData, error: txError } = await supabase
          .from('transaction_history')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('transaction_timestamp', { ascending: false })
          .limit(10)
        
        if (txError) throw txError
        setHistory(txData || [])

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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchId) {
      router.push(`/dashboard/profile/${searchId}`)
    }
  }

  if (userId === 'search') {
    return (
      <div className={`min-h-screen bg-[#050714] text-white flex items-center justify-center ${language === 'bn' ? 'font-bengali' : ''}`}>
        <div className="w-full max-w-md p-8 bg-card-bg border border-white/10 rounded-2xl text-center">
          <Icon name="person_search" size={64} className="mx-auto mb-6 text-purple-400" />
          <h1 className="text-2xl font-bold mb-2">Customer Search</h1>
          <p className="text-text-secondary mb-8">Enter a User ID (e.g. C12345) to view their 360° profile.</p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <input 
              type="text" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="User ID..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-center text-xl font-mono focus:border-primary focus:outline-none"
              autoFocus
            />
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
                {/* 
                  Note: NetworkGraph usually takes a 'latestTransaction' to focus.
                  We might need to adapt it to focus on a 'userId'.
                  For now, we render it as-is, assuming it visualizes the general network 
                  or we can pass a dummy tx to center on this user.
                */}
                 <NetworkGraph 
                    language={language} 
                    height={400} 
                    latestTransaction={{ nameOrig: userId, nameDest: history[0]?.receiver_id || 'Unknown', amount: 0, type: 'VIEW' }}
                 />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
             <Icon name="person_off" size={64} className="mx-auto mb-4 text-text-secondary" />
             <h2 className="text-xl font-bold">User Not Found</h2>
             <p className="text-text-secondary">Could not locate user ID: {userId}</p>
          </div>
        )}
      </div>
    </div>
  )
}
