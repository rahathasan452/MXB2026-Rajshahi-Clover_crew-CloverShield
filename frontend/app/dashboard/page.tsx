/**
 * Main Page - Transaction Simulator + Guardian Command Center
 * Replaces Streamlit app.py main() function
 */

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
import { DecisionZone } from '@/components/DecisionZone'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { RiskDrivers } from '@/components/RiskDrivers'
import { ThemeLanguageControls } from '@/components/ThemeLanguageControls'
import { NetworkGraph } from '@/components/NetworkGraph'
import { SimulationControls } from '@/components/SimulationControls'
import { LLMExplanationBox } from '@/components/LLMExplanationBox'
import { AuthButton } from '@/components/AuthButton'
import { Icon } from '@/components/Icon'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Home() {
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
    isSimulating
  } = useAppStore()

  const [receiver, setReceiver] = useState<any>(null)
  const [showRiskDrivers, setShowRiskDrivers] = useState(false)
  const [latestTransaction, setLatestTransaction] = useState<any>(null)

  const isBkash = brandTheme === 'bkash'
  const brandColor = isBkash ? 'border-bkash-pink' : 'border-nagad-orange'
  const brandGradient = isBkash ? 'from-bkash-pink' : 'from-nagad-orange'

  // SSE Effect for Simulation
  useEffect(() => {
    let eventSource: EventSource | null = null

    if (isSimulating) {
      const API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'
      eventSource = new EventSource(`${API_URL}/simulate/stream`)

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.transaction) {
            const tx = data.transaction
            
            handleTransactionSubmit({
              senderId: tx.nameOrig,
              receiverId: tx.nameDest,
              amount: tx.amount,
              type: tx.type,
              oldBalanceOrig: tx.oldBalanceOrig,
              newBalanceOrig: tx.newBalanceOrig,
              oldBalanceDest: tx.oldBalanceDest,
              newBalanceDest: tx.newBalanceDest,
              step: tx.step,
              isTestData: true,
              isSimulation: true
            }).then((prediction) => {
               if (prediction) {
                 // Update graph with transaction AND prediction info
                 setLatestTransaction({
                   ...tx,
                   fraud_probability: prediction.prediction.fraud_probability,
                   decision: prediction.prediction.decision
                 })
               }
            })
          }
        } catch (e) {
          console.error("Error parsing SSE data", e)
        }
      }

      eventSource.onerror = (err) => {
        console.error("SSE Error", err)
        // Don't close immediately, EventSource retries automatically.
        // But if connection is refused, maybe stop simulation?
        // eventSource?.close()
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [isSimulating])

  // Route protection: Redirect to landing page if not authenticated
  useEffect(() => {
    if (!authUser) {
      router.push('/')
    }
  }, [authUser, router])

  // Don't render dashboard content if user is not authenticated
  if (!authUser) {
    return null
  }

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
          // Set default sender
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

  const handleTransactionSubmit = async (data: {
    senderId: string
    receiverId: string
    amount: number
    type: 'CASH_OUT' | 'TRANSFER'
    note?: string
    // Test data mode fields
    oldBalanceOrig?: number
    newBalanceOrig?: number
    oldBalanceDest?: number
    newBalanceDest?: number
    step?: number
    isTestData?: boolean
    isSimulation?: boolean
  }) => {
    try {
      if (!data.isSimulation) {
        setIsLoading(true)
      }

      const isTestData = data.isTestData || false

      // For test data mode, use provided balances; otherwise calculate from users
      let oldBalanceOrig: number
      let newBalanceOrig: number
      let oldBalanceDest: number
      let newBalanceDest: number
      let step: number

      if (isTestData) {
        // Use test data balances
        if (
          data.oldBalanceOrig === undefined ||
          data.newBalanceOrig === undefined ||
          data.oldBalanceDest === undefined ||
          data.newBalanceDest === undefined
        ) {
          throw new Error('Test data balances are required in test data mode')
        }
        oldBalanceOrig = data.oldBalanceOrig
        newBalanceOrig = data.newBalanceOrig
        oldBalanceDest = data.oldBalanceDest
        newBalanceDest = data.newBalanceDest
        step = data.step || 1
      } else {
        // Regular mode - calculate from users
        const sender = users.find((u) => u.user_id === data.senderId)
        const receiverUser = users.find((u) => u.user_id === data.receiverId)

        if (!sender || !receiverUser) {
          throw new Error('Invalid sender or receiver')
        }

        oldBalanceOrig = sender.balance
        newBalanceOrig =
          data.type === 'CASH_OUT' || data.type === 'TRANSFER'
            ? oldBalanceOrig - data.amount
            : oldBalanceOrig

        oldBalanceDest = receiverUser.balance
        newBalanceDest =
          data.type === 'TRANSFER'
            ? oldBalanceDest + data.amount
            : oldBalanceDest
        step = 1
      }

      // Call ML API for prediction
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

        // Track ML API call
        trackMLAPICall({
          success: true,
          processingTimeMs: Date.now() - startTime,
        })

        setCurrentPrediction(prediction)
      } catch (error: any) {
        // Track failed ML API call
        trackMLAPICall({
          success: false,
          processingTimeMs: Date.now() - startTime,
          error: error.message,
        })
        throw error
      }

      // Determine transaction status based on prediction decision
      const transactionStatus =
        prediction.prediction.decision === 'block'
          ? 'BLOCKED'
          : prediction.prediction.decision === 'warn'
          ? 'REVIEW'
          : 'COMPLETED'

      // Save transaction to appropriate table based on mode
      let transaction
      if (isTestData) {
        // Save to transaction_history table for test data
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
        // Save to transactions table for regular transactions
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

        // Update transaction status based on prediction decision
        await updateTransaction(transaction.transaction_id, {
          status: transactionStatus,
        })
      }

      // Track transaction event
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

      // Send email alert for BLOCK or WARN decisions (only in regular mode)
      if (
        !isTestData &&
        (prediction.prediction.decision === 'block' ||
          prediction.prediction.decision === 'warn')
      ) {
        try {
          const sender = users.find((u) => u.user_id === data.senderId)
          const receiverUser = users.find((u) => u.user_id === data.receiverId)
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
        } catch (emailError: any) {
          console.error('Failed to send email alert:', emailError)
          // Don't fail the transaction if email fails
        }
      }

      // Update analytics
      incrementTransactions()
      if (prediction.prediction.decision === 'block') {
        incrementFraudDetected(data.amount)
      }

      if (!data.isSimulation) {
        toast.success(
          language === 'bn'
            ? 'লেনদেন বিশ্লেষণ সম্পন্ন'
            : 'Transaction analyzed successfully'
        )
      }
      
      return prediction
    } catch (error: any) {
      console.error('Transaction error:', error)
      if (!data.isSimulation) {
        toast.error(
          language === 'bn'
            ? 'লেনদেন প্রক্রিয়াকরণ ব্যর্থ'
            : 'Failed to process transaction: ' + error.message
        )
      }
      throw error
    } finally {
      if (!data.isSimulation) {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={`min-h-screen bg-[#050714] ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Header */}
      <header className={`bg-gradient-header border-b-4 ${brandColor} rounded-b-3xl shadow-2xl mb-8 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Logo */}
              <div className="flex-shrink-0 p-1 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <Image
                  src="/logo.png"
                  alt="CloverShield Logo"
                  width={80}
                  height={80}
                  className="h-16 w-16 md:h-20 md:w-20 object-contain"
                  priority
                />
              </div>
              {/* Title and Subtitle */}
              <div className="flex-1">
                <h1 className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${brandGradient} to-white bg-clip-text text-transparent mb-1 tracking-tight`}>
                  {language === 'bn' ? 'ক্লোভারশিল্ড' : 'CLOVERSHIELD'}
                </h1>
                <h2 className="text-sm md:text-base text-text-primary/80 font-mono tracking-widest uppercase">
                  {language === 'bn'
                    ? 'মোবাইল ব্যাংকিং জালিয়াতি শনাক্তকরণ ব্যবস্থা'
                    : 'Mobile Banking Fraud Detection System'}
                </h2>
                <div className={`h-1 w-24 bg-gradient-to-r ${brandGradient} to-transparent mt-2 rounded-full`}></div>
              </div>
            </div>
            <div className="flex items-center gap-6 flex-shrink-0">
              <ThemeLanguageControls />
              <div className="h-10 w-px bg-white/10 hidden md:block"></div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {/* Analytics Dashboard */}
        <div className="mb-8">
          <AnalyticsDashboard language={language} />
        </div>

        {/* Simulation Controls */}
        <div className="mb-8">
           <SimulationControls language={language} />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* User Profile Card - At the top */}
          {selectedUser && (
            <div>
              <UserProfileCard user={selectedUser} language={language} />
            </div>
          )}

          {/* Twin View Layout - Transaction Simulator and Guardian Command Center */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Transaction Simulator */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="account_balance_wallet" size={28} className="text-primary" />
                {language === 'bn' ? 'লেনদেন সিমুলেটর' : 'Transaction Simulator'}
              </h2>

              {/* Transaction Form */}
              <TransactionForm
                users={users}
                onSubmit={handleTransactionSubmit}
                language={language}
              />
            </div>

            {/* Right Panel - Guardian Command Center */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="security" size={28} className="text-primary" />
                {language === 'bn'
                  ? 'গার্ডিয়ান কমান্ড কেন্দ্র'
                  : 'Guardian Command Center'}
              </h2>

              {/* Decision Zone */}
              {currentPrediction ? (
                <>
                  <DecisionZone
                    prediction={currentPrediction}
                    language={language}
                  />

                  {/* LLM Explanation */}
                  {currentPrediction.llm_explanation && (
                    <LLMExplanationBox
                      explanation={currentPrediction.llm_explanation.text}
                      language={language}
                    />
                  )}

                  {/* Risk Drivers */}
                  {currentPrediction.shap_explanations && (
                    <div className="bg-card-bg rounded-xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-text-primary">
                          {language === 'bn' ? 'শীর্ষ ঝুঁকি প্রভাবক' : 'Top Risk Drivers'}
                        </h3>
                        <button
                          onClick={() => setShowRiskDrivers(!showRiskDrivers)}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                        >
                          <Icon 
                            name={showRiskDrivers ? "expand_less" : "expand_more"} 
                            size={20} 
                          />
                          <span>
                            {showRiskDrivers
                              ? (language === 'bn' ? 'লুকান' : 'Hide')
                              : (language === 'bn' ? 'দেখান' : 'Show')
                            }
                          </span>
                        </button>
                      </div>
                      {showRiskDrivers && (
                        <RiskDrivers
                          shapExplanations={currentPrediction.shap_explanations}
                          language={language}
                          hideTitle={true}
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-card-bg rounded-xl p-12 border border-white/10 text-center">
                  <p className="text-text-secondary text-lg flex items-center justify-center gap-2">
                    <Icon name="arrow_back" size={24} className="text-text-secondary" />
                    {language === 'bn'
                      ? 'বামে লেনদেনের বিবরণ লিখুন এবং "লেনদেন বিশ্লেষণ করুন" ক্লিক করুন'
                      : "Enter transaction details to the left and click 'Analyze Transaction' to begin"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Network Graph Visualization */}
          <div className="mt-8">
             <NetworkGraph 
               language={language} 
               height={500} 
               latestTransaction={latestTransaction}
             />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-white/10 text-center text-text-secondary">
        <p>
          {language === 'bn'
            ? 'টিম ক্লোভার ক্রু কর্তৃক নির্মিত MXB2026 রাজশাহীর জন্য'
            : 'Built by Team Clover Crew for MXB2026 Rajshahi'}
        </p>
        <p className="text-sm mt-2">
          {language === 'bn'
            ? 'XGBoost ও SHAP দ্বারা চালিত'
            : 'Powered by XGBoost & SHAP'}
        </p>
      </footer>
    </div>
  )
}

