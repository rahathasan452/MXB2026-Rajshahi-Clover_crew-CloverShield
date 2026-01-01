'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store/useAppStore'
import {
  getUsers,
  createTransaction,
  updateTransaction,
  createTransactionHistory,
} from '@/lib/supabase'
import { predictFraud } from '@/lib/ml-api'
import { initAnalytics, trackTransaction, trackMLAPICall } from '@/lib/analytics'
import { sendTransactionAlertEmail } from '@/lib/email'
import { TransactionForm } from '@/components/TransactionForm'
import { UserProfileCard } from '@/components/UserProfileCard'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { DecisionZone } from '@/components/DecisionZone'
import { RiskDrivers } from '@/components/RiskDrivers'
import { LLMExplanationBox } from '@/components/LLMExplanationBox'
import { Icon } from '@/components/Icon'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SimulatorPage() {
  const router = useRouter()
  const {
    users,
    setUsers,
    selectedUser,
    setSelectedUser,
    transactionForm,
    currentPrediction,
    setCurrentPrediction,
    setIsLoading,
    incrementTransactions,
    incrementFraudDetected,
    language,
    brandTheme,
    authUser,
  } = useAppStore()

  const [receiver, setReceiver] = useState<any>(null)
  const [showRiskDrivers, setShowRiskDrivers] = useState(false)

  // Route protection
  useEffect(() => {
    if (!authUser) {
      router.push('/')
    }
  }, [authUser, router])

  if (!authUser) return null

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics()
  }, [])

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true)
        const usersData = await getUsers()
        setUsers(usersData)
        if (usersData.length > 0 && !selectedUser) {
          setSelectedUser(usersData[0])
          useAppStore.getState().setTransactionForm({
            senderId: usersData[0].user_id,
          })
        }
      } catch (error: any) {
        toast.error('Failed to load users: ' + error.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadUsers()
  }, [])

  // Update receiver when receiverId changes
  useEffect(() => {
    if (transactionForm.receiverId) {
      const receiverUser = users.find(
        (u) => u.user_id === transactionForm.receiverId
      )
      setReceiver(receiverUser)
    }
  }, [transactionForm.receiverId, users])

  // Update selected user when sender changes
  useEffect(() => {
    if (transactionForm.senderId) {
      const senderUser = users.find(
        (u) => u.user_id === transactionForm.senderId
      )
      if (senderUser) {
        setSelectedUser(senderUser)
      }
    }
  }, [transactionForm.senderId, users])

  const handleTransactionSubmit = async (data: any) => {
    try {
      setIsLoading(true)

      const isTestData = data.isTestData || false
      let oldBalanceOrig, newBalanceOrig, oldBalanceDest, newBalanceDest, step

      if (isTestData) {
        oldBalanceOrig = data.oldBalanceOrig
        newBalanceOrig = data.newBalanceOrig
        oldBalanceDest = data.oldBalanceDest
        newBalanceDest = data.newBalanceDest
        step = data.step || 1
      } else {
        const sender = users.find((u: any) => u.user_id === data.senderId)
        const receiverUser = users.find((u: any) => u.user_id === data.receiverId)
        if (!sender || !receiverUser) throw new Error('Invalid sender or receiver')

        oldBalanceOrig = sender.balance
        newBalanceOrig = data.type === 'CASH_OUT' || data.type === 'TRANSFER' ? oldBalanceOrig - data.amount : oldBalanceOrig
        oldBalanceDest = receiverUser.balance
        newBalanceDest = data.type === 'TRANSFER' ? oldBalanceDest + data.amount : oldBalanceDest
        step = 1
      }

      const startTime = Date.now()
      let prediction
      try {
        prediction = await predictFraud(
          {
            step: step,
            type: data.type,
            amount: data.amount,
            nameOrig: data.senderId,
            oldBalanceOrig,
            newBalanceOrig,
            nameDest: data.receiverId,
            oldBalanceDest,
            newBalanceDest,
          },
          {
            include_shap: true,
            include_llm_explanation: true,
            language,
            topk: 10,
          }
        )

        trackMLAPICall({ success: true, processingTimeMs: Date.now() - startTime })
        setCurrentPrediction(prediction)
      } catch (error: any) {
        trackMLAPICall({ success: false, processingTimeMs: Date.now() - startTime, error: error.message })
        throw error
      }

      const transactionStatus = prediction.prediction.decision === 'block' ? 'BLOCKED' : prediction.prediction.decision === 'warn' ? 'REVIEW' : 'COMPLETED'

      let transaction
      if (isTestData) {
        transaction = await createTransactionHistory({
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          amount: data.amount,
          transaction_type: data.type,
          old_balance_orig: oldBalanceOrig,
          new_balance_orig: newBalanceOrig,
          old_balance_dest: oldBalanceDest,
          new_balance_dest: newBalanceDest,
          step: step,
          hour: new Date().getHours(),
          status: transactionStatus,
          fraud_probability: prediction.prediction.fraud_probability,
          fraud_decision: prediction.prediction.decision,
          risk_level: prediction.prediction.risk_level,
          model_confidence: prediction.prediction.confidence,
          is_test_data: true,
          note: data.note,
        })
      } else {
        transaction = await createTransaction({
          sender_id: data.senderId,
          receiver_id: data.receiverId,
          amount: data.amount,
          transaction_type: data.type,
          old_balance_orig: oldBalanceOrig,
          new_balance_orig: newBalanceOrig,
          old_balance_dest: oldBalanceDest,
          new_balance_dest: newBalanceDest,
          step: step,
          hour: new Date().getHours(),
          status: 'PENDING',
          fraud_probability: prediction.prediction.fraud_probability,
          fraud_decision: prediction.prediction.decision,
          risk_level: prediction.prediction.risk_level,
          model_confidence: prediction.prediction.confidence,
          note: data.note,
        })
        await updateTransaction(transaction.transaction_id, { status: transactionStatus })
      }

      trackTransaction({
        transactionId: transaction.transaction_id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        amount: data.amount,
        type: data.type,
        fraudProbability: prediction.prediction.fraud_probability,
        decision: prediction.prediction.decision,
        riskLevel: prediction.prediction.risk_level,
      })

      if (!isTestData && (prediction.prediction.decision === 'block' || prediction.prediction.decision === 'warn')) {
        try {
          const sender = users.find((u: any) => u.user_id === data.senderId)
          const receiverUser = users.find((u: any) => u.user_id === data.receiverId)
          if (sender && receiverUser) {
            await sendTransactionAlertEmail({
              transactionId: transaction.transaction_id,
              senderId: data.senderId,
              receiverId: data.receiverId,
              senderName: sender.name_en,
              receiverName: receiverUser.name_en,
              amount: data.amount,
              transactionType: data.type,
              fraudProbability: prediction.prediction.fraud_probability,
              decision: prediction.prediction.decision,
              riskLevel: prediction.prediction.risk_level,
              timestamp: transaction.transaction_timestamp,
              shapExplanations: prediction.shap_explanations,
            })
          }
        } catch (emailError) { console.error(emailError) }
      }

      incrementTransactions()
      if (prediction.prediction.decision === 'block') incrementFraudDetected(data.amount)

      toast.success(language === 'bn' ? 'লেনদেন বিশ্লেষণ সম্পন্ন' : 'Transaction analyzed successfully')
      return prediction
    } catch (error: any) {
      console.error('Transaction error:', error)
      toast.error(language === 'bn' ? 'লেনদেন প্রক্রিয়াকরণ ব্যর্থ' : 'Failed to process transaction: ' + error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#050714] ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Navbar Placeholder for Consistency */}
      <div className="bg-gradient-header border-b border-white/10 p-4 mb-6">
          <div className="container mx-auto flex items-center gap-4">
               <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-white transition-colors">
                  <Icon name="arrow_back" />
                  <span className="font-bold">{language === 'bn' ? 'ড্যাশবোর্ড এ ফিরে যান' : 'Back to Dashboard'}</span>
               </Link>
          </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <AnalyticsDashboard language={language} />
        
        <div className="space-y-8 mt-8">
          {selectedUser && <UserProfileCard user={selectedUser} language={language} />}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="account_balance_wallet" size={28} className="text-primary" />
                {language === 'bn' ? 'রিয়েল-টাইম ফ্রড স্ক্যানার' : 'Real-time Fraud Scanner'}
              </h2>
              <TransactionForm users={users} onSubmit={handleTransactionSubmit} language={language} />
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="security" size={28} className="text-primary" />
                {language === 'bn' ? 'গার্ডিয়ান কমান্ড কেন্দ্র' : 'Guardian Command Center'}
              </h2>
              {currentPrediction ? (
                <>
                  <DecisionZone prediction={currentPrediction} language={language} />
                  {currentPrediction.llm_explanation && <LLMExplanationBox explanation={currentPrediction.llm_explanation.text} language={language} />}
                  {currentPrediction.shap_explanations && (
                    <div className="bg-card-bg rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-text-primary">{language === 'bn' ? 'শীর্ষ ঝুঁকি প্রভাবক' : 'Top Risk Drivers'}</h3>
                        <button onClick={() => setShowRiskDrivers(!showRiskDrivers)} className="text-primary text-sm font-medium">
                            {showRiskDrivers ? (language === 'bn' ? 'লুকান' : 'Hide') : (language === 'bn' ? 'দেখান' : 'Show')}
                        </button>
                      </div>
                      {showRiskDrivers && <RiskDrivers shapExplanations={currentPrediction.shap_explanations} language={language} hideTitle={true} />}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-card-bg rounded-xl p-12 border border-white/10 text-center">
                  <p className="text-text-secondary text-lg flex items-center justify-center gap-2">
                    <Icon name="arrow_back" size={24} className="text-text-secondary" />
                    {language === 'bn' ? 'বামে লেনদেনের বিবরণ লিখুন...' : "Enter transaction details to the left..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
