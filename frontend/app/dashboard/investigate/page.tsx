/**
 * Investigative Queue - Priority Inbox
 * Review high-risk alerts
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvestigatePage() {
  const router = useRouter()
  const { language, authUser } = useAppStore()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // ... (existing fetchQueue and useEffect) ...

  // Seed Queue (Client-side implementation to bypass missing RPC)
  const handleSeed = async () => {
    // ... (existing implementation) ...
    try {
      setSeeding(true)
      
      // 1. Fetch source data
      const { data: sourceData, error: fetchError } = await supabase
        .from('test_dataset')
        .select('*')
        .or('isFlaggedFraud.eq.1,amount.gt.200000')
        .order('step', { ascending: false })
        .limit(5)
      
      if (fetchError) throw fetchError
      
      if (!sourceData || sourceData.length === 0) {
        toast.error('Test dataset is empty!')
        return
      }

      // 2. Transform and Insert
      const newItems = sourceData.map(item => ({
        sender_id: item.nameOrig,
        receiver_id: item.nameDest,
        amount: item.amount,
        transaction_type: item.type,
        old_balance_orig: item.oldBalanceOrig,
        new_balance_orig: item.newBalanceOrig,
        old_balance_dest: item.oldBalanceDest,
        new_balance_dest: item.newBalanceDest,
        step: item.step,
        transaction_timestamp: new Date().toISOString(),
        fraud_probability: 0.85,
        fraud_decision: 'warn',
        risk_level: 'high',
        model_confidence: 0.90,
        status: 'REVIEW',
        is_test_data: true
      }))

      const { error: insertError } = await supabase
        .from('transaction_history')
        .insert(newItems)
      
      if (insertError) throw insertError

      toast.success(language === 'bn' ? 'নমুনা ডেটা তৈরি করা হয়েছে' : 'Sample cases generated')
      fetchQueue()
    } catch (err: any) {
      console.error('Seed error:', err)
      toast.error('Failed to seed queue: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  // Handle Decision (Client-side implementation)
  const handleDecision = async (id: string, decision: 'APPROVE' | 'BLOCK') => {
    // ... (existing implementation) ...
    // Optimistic Update
    const originalQueue = [...queue]
    setQueue(queue.filter(q => q.transaction_id !== id))
    
    try {
      // Direct update instead of RPC
      const { error } = await supabase
        .from('transaction_history')
        .update({
          status: decision === 'APPROVE' ? 'COMPLETED' : 'BLOCKED',
          note: decision === 'APPROVE' ? 'Approved by Analyst' : 'Blocked by Analyst'
        })
        .eq('transaction_id', id)
      
      if (error) throw error
      
      toast.success(
        decision === 'APPROVE' 
          ? (language === 'bn' ? 'অনুমোদিত' : 'Transaction Approved')
          : (language === 'bn' ? 'ব্লক করা হয়েছে' : 'Transaction Blocked')
      )
    } catch (err) {
      // Revert on error
      setQueue(originalQueue)
      toast.error('Action failed')
      console.error(err)
    }
  }

  const handleAnalyze = (item: any) => {
    // Construct query params for pre-filling the simulator
    const params = new URLSearchParams({
      sender: item.sender_id,
      receiver: item.receiver_id,
      amount: item.amount.toString(),
      type: item.transaction_type,
      autoRun: 'true' // Flag to trigger auto-analysis if supported
    })
    router.push(`/dashboard/simulator?${params.toString()}`)
  }

  return (
    <div className={`min-h-screen bg-[#050714] text-white ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* ... (existing nav) ... */}
      <div className="bg-gradient-header border-b border-white/10 p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <Icon name="arrow_back" />
            <span className="font-bold">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Icon name="inbox" className="text-red-500" />
            {language === 'bn' ? 'তদন্তের তালিকা' : 'Priority Inbox'}
          </h1>
          <button 
            onClick={handleSeed} 
            disabled={seeding}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
          >
            <Icon name="autorenew" size={14} className={seeding ? "animate-spin" : ""} />
            {seeding ? 'Generating...' : 'Simulate Incoming'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-20 bg-card-bg rounded-2xl border border-white/10 border-dashed">
            <Icon name="check_circle" size={64} className="text-green-500 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">
              {language === 'bn' ? 'সব ঠিক আছে!' : 'All Caught Up!'}
            </h2>
            <p className="text-text-secondary mb-6">
              {language === 'bn' ? 'কোনো পেন্ডিং কেস নেই।' : 'No high-risk transactions pending review.'}
            </p>
            <button 
              onClick={handleSeed}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              {language === 'bn' ? 'নতুন কেস তৈরি করুন' : 'Generate Test Cases'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {queue.map((item) => (
              <div key={item.transaction_id} className="bg-card-bg border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center justify-between animate-fade-in">
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      item.fraud_decision === 'block' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.fraud_decision}
                    </span>
                    <span className="text-text-secondary text-xs flex items-center gap-1">
                      <Icon name="schedule" size={12} />
                      {item.created_at ? formatDistanceToNow(new Date(item.created_at)) + ' ago' : 'Just now'}
                    </span>
                    {item.is_test_data && (
                      <span className="bg-blue-500/10 text-blue-400 text-xs px-2 rounded-full border border-blue-500/20">TEST</span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-mono font-bold text-white">
                      ৳ {item.amount?.toLocaleString()}
                    </span>
                    <span className="text-sm text-text-secondary uppercase">{item.transaction_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Link href={`/dashboard/profile/${item.sender_id}`} className="font-mono text-white/80 hover:text-primary transition-colors hover:underline">
                      {item.sender_id}
                    </Link>
                    <Icon name="arrow_forward" size={14} />
                    <Link href={`/dashboard/profile/${item.receiver_id}`} className="font-mono text-white/80 hover:text-primary transition-colors hover:underline">
                      {item.receiver_id}
                    </Link>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center min-w-[100px]">
                  <div className="text-xs text-text-secondary mb-1">Risk Score</div>
                  <div className={`text-2xl font-black ${
                    item.fraud_probability > 0.8 ? 'text-red-500' : 'text-yellow-400'
                  }`}>
                    {(item.fraud_probability * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleAnalyze(item)}
                    className="flex-1 md:flex-none bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    title="Run Real-time Analysis"
                  >
                    <Icon name="bolt" size={18} />
                    Analyze
                  </button>
                  <button 
                    onClick={() => handleDecision(item.transaction_id, 'APPROVE')}
                    className="flex-1 md:flex-none bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name="check" size={18} />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleDecision(item.transaction_id, 'BLOCK')}
                    className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name="block" size={18} />
                    Block
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
