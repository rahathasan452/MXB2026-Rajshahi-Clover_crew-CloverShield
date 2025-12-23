/**
 * Transaction Form Component
 * Replaces Streamlit transaction input form (Zone 1)
 * Supports both Regular Mode and Test Data Mode
 */

import React, { useState, useEffect } from 'react'
import { User } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

interface TransactionFormProps {
  users: User[]
  onSubmit: (transaction: {
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
  }) => void
  language?: 'en' | 'bn'
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  users,
  onSubmit,
  language = 'en',
}) => {
  const { transactionForm, setTransactionForm, selectedUser } = useAppStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Test Data Mode state
  const [isTestDataMode, setIsTestDataMode] = useState(false)
  const [testSenders, setTestSenders] = useState<string[]>([])
  const [testReceivers, setTestReceivers] = useState<string[]>([])
  const [loadingTestData, setLoadingTestData] = useState(false)
  const [testTransactionDetails, setTestTransactionDetails] = useState<{
    oldBalanceOrig: number
    oldBalanceDest: number
    step: number
  } | null>(null)

  const formatCurrency = (amount: number) => {
    return `৳ ${amount.toLocaleString('en-BD')}`
  }

  const maskAccountNumber = (accountId: string, showLast: number = 4) => {
    if (accountId.length <= showLast) return accountId
    return '****' + accountId.slice(-showLast)
  }

  const amountPresets = [500, 1000, 5000, 10000]

  // Load test dataset senders when test mode is enabled
  useEffect(() => {
    if (isTestDataMode) {
      loadTestSenders()
    } else {
      setTestSenders([])
      setTestReceivers([])
      setTestTransactionDetails(null)
    }
  }, [isTestDataMode])

  // Load receivers when sender changes in test mode
  useEffect(() => {
    if (isTestDataMode && transactionForm.senderId) {
      loadTestReceivers(transactionForm.senderId)
      setTestTransactionDetails(null)
      setTransactionForm({ receiverId: null })
    }
  }, [transactionForm.senderId, isTestDataMode])

  // Load transaction details when both sender and receiver are selected in test mode
  useEffect(() => {
    if (
      isTestDataMode &&
      transactionForm.senderId &&
      transactionForm.receiverId
    ) {
      loadTestTransactionDetails(
        transactionForm.senderId,
        transactionForm.receiverId
      )
    }
  }, [transactionForm.senderId, transactionForm.receiverId, isTestDataMode])

  const loadTestSenders = async () => {
    try {
      setLoadingTestData(true)
      const response = await fetch('/api/test-dataset/senders?limit=100')
      if (!response.ok) {
        throw new Error('Failed to load test senders')
      }
      const data = await response.json()
      setTestSenders(data.senders || [])
    } catch (error: any) {
      toast.error(
        language === 'bn'
          ? 'টেস্ট ডেটা লোড করতে ব্যর্থ'
          : 'Failed to load test data: ' + error.message
      )
    } finally {
      setLoadingTestData(false)
    }
  }

  const loadTestReceivers = async (senderId: string) => {
    try {
      setLoadingTestData(true)
      const response = await fetch(
        `/api/test-dataset/receivers?senderId=${encodeURIComponent(senderId)}&limit=100`
      )
      if (!response.ok) {
        throw new Error('Failed to load test receivers')
      }
      const data = await response.json()
      setTestReceivers(data.receivers || [])
    } catch (error: any) {
      toast.error(
        language === 'bn'
          ? 'গ্রহীতাদের লোড করতে ব্যর্থ'
          : 'Failed to load receivers: ' + error.message
      )
    } finally {
      setLoadingTestData(false)
    }
  }

  const loadTestTransactionDetails = async (
    senderId: string,
    receiverId: string
  ) => {
    try {
      setLoadingTestData(true)
      const response = await fetch(
        `/api/test-dataset/transaction-details?senderId=${encodeURIComponent(
          senderId
        )}&receiverId=${encodeURIComponent(receiverId)}`
      )
      if (!response.ok) {
        if (response.status === 404) {
          setTestTransactionDetails(null)
          return
        }
        throw new Error('Failed to load transaction details')
      }
      const data = await response.json()
      if (data.transaction) {
        setTestTransactionDetails({
          oldBalanceOrig: data.transaction.oldBalanceOrig,
          oldBalanceDest: data.transaction.oldBalanceDest,
          step: data.transaction.step,
        })
        // Auto-fill amount and type if not already set
        if (!transactionForm.amount || transactionForm.amount === 0) {
          setTransactionForm({ amount: data.transaction.amount })
        }
        if (!transactionForm.type) {
          setTransactionForm({ type: data.transaction.type })
        }
      }
    } catch (error: any) {
      console.error('Failed to load transaction details:', error)
      setTestTransactionDetails(null)
    } finally {
      setLoadingTestData(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!transactionForm.senderId) {
      newErrors.senderId =
        language === 'bn' ? 'প্রেরক নির্বাচন করুন' : 'Select sender'
    }

    if (!transactionForm.receiverId) {
      newErrors.receiverId =
        language === 'bn' ? 'গ্রহীতা নির্বাচন করুন' : 'Select receiver'
    }

    if (transactionForm.senderId === transactionForm.receiverId) {
      newErrors.receiverId =
        language === 'bn'
          ? 'প্রেরক এবং গ্রহীতা একই হতে পারে না'
          : 'Sender and receiver cannot be the same'
    }

    if (transactionForm.amount <= 0) {
      newErrors.amount =
        language === 'bn' ? 'বৈধ পরিমাণ লিখুন' : 'Enter valid amount'
    }

    const sender = users.find((u) => u.user_id === transactionForm.senderId)
    if (sender && transactionForm.amount > sender.balance) {
      newErrors.amount =
        language === 'bn'
          ? 'পরিমাণ ব্যালেন্স ছাড়িয়ে গেছে'
          : 'Amount exceeds balance'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error(
        language === 'bn' ? 'ফর্ম যাচাইকরণ ব্যর্থ' : 'Form validation failed'
      )
      return
    }

    if (!transactionForm.senderId || !transactionForm.receiverId) {
      return
    }

    const submitData: any = {
      senderId: transactionForm.senderId,
      receiverId: transactionForm.receiverId,
      amount: transactionForm.amount,
      type: transactionForm.type,
      note: transactionForm.note,
      isTestData: isTestDataMode,
    }

    // Include test data fields if in test mode
    if (isTestDataMode && testTransactionDetails) {
      // Calculate new balances based on amount and transaction type
      const newBalanceOrig =
        transactionForm.type === 'CASH_OUT' || transactionForm.type === 'TRANSFER'
          ? testTransactionDetails.oldBalanceOrig - transactionForm.amount
          : testTransactionDetails.oldBalanceOrig
      
      const newBalanceDest =
        transactionForm.type === 'TRANSFER'
          ? testTransactionDetails.oldBalanceDest + transactionForm.amount
          : testTransactionDetails.oldBalanceDest

      submitData.oldBalanceOrig = testTransactionDetails.oldBalanceOrig
      submitData.newBalanceOrig = newBalanceOrig
      submitData.oldBalanceDest = testTransactionDetails.oldBalanceDest
      submitData.newBalanceDest = newBalanceDest
      submitData.step = testTransactionDetails.step
    }

    onSubmit(submitData)
  }

  const sender = users.find((u) => u.user_id === transactionForm.senderId)
  const receiver = users.find((u) => u.user_id === transactionForm.receiverId)

  // Get recent receivers (mock - in production, fetch from transaction history)
  const recentReceivers = users
    .filter((u) => u.user_id !== transactionForm.senderId)
    .slice(0, 3)

  return (
    <div className="bg-card-bg rounded-2xl p-6 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💳</span>
          <h2 className="text-2xl font-bold text-text-primary">
            {language === 'bn' ? 'লেনদেন ইনপুট' : 'Transaction Input'}
          </h2>
        </div>
        
        {/* Test Data Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            {language === 'bn' ? 'টেস্ট ডেটা' : 'Test Data'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsTestDataMode(!isTestDataMode)
              setTransactionForm({
                senderId: null,
                receiverId: null,
                amount: 0,
              })
              setTestTransactionDetails(null)
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isTestDataMode ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isTestDataMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {isTestDataMode && (
        <div className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-3">
          <p className="text-sm text-primary font-medium">
            {language === 'bn'
              ? '📊 টেস্ট ডেটা মোড: টেস্ট ডেটাসেট থেকে সেন্ডার এবং রিসিভার নির্বাচন করুন'
              : '📊 Test Data Mode: Select sender and receiver from test dataset'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender Selection */}
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            👤 {language === 'bn' ? 'প্রেরক অ্যাকাউন্ট' : 'Sender Account'}
          </label>
          {loadingTestData && isTestDataMode ? (
            <div className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-secondary text-center">
              {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
            </div>
          ) : (
            <select
              value={transactionForm.senderId || ''}
              onChange={(e) => setTransactionForm({ senderId: e.target.value })}
              className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loadingTestData}
            >
              <option value="">
                {language === 'bn' ? 'প্রেরক নির্বাচন করুন' : 'Select sender'}
              </option>
              {isTestDataMode
                ? testSenders.map((senderId) => (
                    <option key={senderId} value={senderId}>
                      {senderId}
                    </option>
                  ))
                : users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_id} - {user.name_en} ({user.provider})
                    </option>
                  ))}
            </select>
          )}
          {errors.senderId && (
            <p className="text-danger text-sm mt-1">{errors.senderId}</p>
          )}

          {/* Balance Display - Only show in regular mode */}
          {sender && !isTestDataMode && (
            <div className="mt-3 bg-success/10 border border-success/30 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm text-text-secondary">
                {language === 'bn' ? 'উপলব্ধ ব্যালেন্স' : 'Available Balance'}
              </span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(sender.balance)}
              </span>
            </div>
          )}

          {/* Test Data Balance Display */}
          {isTestDataMode && testTransactionDetails && (
            <div className="mt-3 bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">
                  {language === 'bn' ? 'পুরানো ব্যালেন্স' : 'Old Balance'}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(testTransactionDetails.oldBalanceOrig)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">
                  {language === 'bn' ? 'নতুন ব্যালেন্স' : 'New Balance'}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(
                    transactionForm.type === 'CASH_OUT' || transactionForm.type === 'TRANSFER'
                      ? testTransactionDetails.oldBalanceOrig - (transactionForm.amount || 0)
                      : testTransactionDetails.oldBalanceOrig
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            📋 {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
          </label>
          <div className="flex gap-2 bg-dark-bg/50 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTransactionForm({ type: 'CASH_OUT' })}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                transactionForm.type === 'CASH_OUT'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {language === 'bn' ? 'ক্যাশ আউট' : 'Cash Out'}
            </button>
            <button
              type="button"
              onClick={() => setTransactionForm({ type: 'TRANSFER' })}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                transactionForm.type === 'TRANSFER'
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {language === 'bn' ? 'স্থানান্তর' : 'Transfer'}
            </button>
          </div>
        </div>

        {/* Receiver Selection */}
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            📥 {language === 'bn' ? 'গ্রহীতা অ্যাকাউন্ট' : 'Receiver Account'}
          </label>

          {/* Recent Receivers - Only in regular mode */}
          {!isTestDataMode &&
            recentReceivers.length > 0 &&
            transactionForm.senderId && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {recentReceivers.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() =>
                      setTransactionForm({ receiverId: user.user_id })
                    }
                    className="px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    {maskAccountNumber(user.user_id)}
                  </button>
                ))}
              </div>
            )}

          {loadingTestData && isTestDataMode ? (
            <div className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-secondary text-center">
              {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
            </div>
          ) : (
            <select
              value={transactionForm.receiverId || ''}
              onChange={(e) =>
                setTransactionForm({ receiverId: e.target.value })
              }
              className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={
                loadingTestData ||
                (isTestDataMode && !transactionForm.senderId)
              }
            >
              <option value="">
                {language === 'bn' ? 'গ্রহীতা নির্বাচন করুন' : 'Select receiver'}
              </option>
              {isTestDataMode
                ? testReceivers.map((receiverId) => (
                    <option key={receiverId} value={receiverId}>
                      {receiverId}
                    </option>
                  ))
                : users
                    .filter((u) => u.user_id !== transactionForm.senderId)
                    .map((user) => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.user_id} - {user.name_en}
                      </option>
                    ))}
            </select>
          )}
          {errors.receiverId && (
            <p className="text-danger text-sm mt-1">{errors.receiverId}</p>
          )}

          {/* Receiver Info - Only in regular mode */}
          {receiver && !isTestDataMode && (
            <div className="mt-3 bg-neutral/10 border border-neutral/30 rounded-xl p-3 flex justify-between items-center">
              <span className="text-text-primary font-semibold">
                {receiver.name_en}
              </span>
              <span className="text-text-secondary font-mono text-sm">
                {maskAccountNumber(receiver.user_id)}
              </span>
            </div>
          )}

          {/* Test Data Receiver Balance Display */}
          {isTestDataMode && testTransactionDetails && (
            <div className="mt-3 bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">
                  {language === 'bn' ? 'গ্রহীতার পুরানো ব্যালেন্স' : 'Receiver Old Balance'}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(testTransactionDetails.oldBalanceDest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">
                  {language === 'bn' ? 'গ্রহীতার নতুন ব্যালেন্স' : 'Receiver New Balance'}
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(
                    transactionForm.type === 'TRANSFER'
                      ? testTransactionDetails.oldBalanceDest + (transactionForm.amount || 0)
                      : testTransactionDetails.oldBalanceDest
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            💰 {language === 'bn' ? 'পরিমাণ' : 'Amount'}
          </label>

          {/* Amount Presets */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {amountPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTransactionForm({ amount: preset })}
                className="py-2 px-3 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>

          <input
            type="number"
            min="1"
            max="100000"
            step="100"
            value={transactionForm.amount}
            onChange={(e) =>
              setTransactionForm({ amount: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.amount && (
            <p className="text-danger text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
            📝 {language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Note (Optional)'}
          </label>
          <textarea
            value={transactionForm.note}
            onChange={(e) => setTransactionForm({ note: e.target.value })}
            maxLength={200}
            rows={3}
            placeholder={
              language === 'bn'
                ? 'এই লেনদেনের জন্য একটি নোট যোগ করুন'
                : 'Add a note for this transaction'
            }
            className="w-full bg-dark-bg border border-white/20 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-4">
          <span className="text-2xl">🔒</span>
          <span className="text-sm text-success font-medium">
            {language === 'bn'
              ? 'আপনার লেনদেন নিরাপদ'
              : 'Your transaction is secure'}
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={Object.keys(errors).length > 0}
        >
          {language === 'bn' ? 'লেনদেন বিশ্লেষণ করুন' : 'Analyze Transaction'}
        </button>
      </form>
    </div>
  )
}

