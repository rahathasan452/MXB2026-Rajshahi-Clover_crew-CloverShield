/**
 * User Profile Card Component
 * Displays user account information (replaces Streamlit user info display)
 */

import React from 'react'
import { User } from '@/lib/supabase'

interface UserProfileCardProps {
  user: User
  language?: 'en' | 'bn'
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  language = 'en',
}) => {
  const formatCurrency = (amount: number) => {
    return `৳ ${amount.toLocaleString('en-BD')}`
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-success/20 text-success border-success/30'
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30'
      case 'high':
        return 'bg-danger/20 text-danger border-danger/30'
      case 'suspicious':
        return 'bg-high-risk/20 text-high-risk border-high-risk/30'
      default:
        return 'bg-neutral/20 text-neutral border-neutral/30'
    }
  }

  return (
    <div className="bg-card-bg rounded-2xl p-6 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-text-primary">
          {language === 'bn' ? 'ব্যবহারকারীর তথ্য' : 'User Information'}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadgeColor(
            user.risk_level
          )}`}
        >
          {user.risk_level.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        {/* Account ID */}
        <div>
          <label className="text-sm text-text-secondary uppercase tracking-wide">
            {language === 'bn' ? 'অ্যাকাউন্ট আইডি' : 'Account ID'}
          </label>
          <p className="text-text-primary font-mono text-lg">{user.user_id}</p>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm text-text-secondary uppercase tracking-wide">
            {language === 'bn' ? 'নাম' : 'Name'}
          </label>
          <p className="text-text-primary text-lg font-semibold">
            {language === 'bn' && user.name_bn ? user.name_bn : user.name_en}
          </p>
        </div>

        {/* Balance */}
        <div className="bg-success/10 border border-success/30 rounded-xl p-4">
          <label className="text-sm text-text-secondary uppercase tracking-wide block mb-2">
            {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
          </label>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(user.balance)}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary uppercase tracking-wide block mb-1">
              {language === 'bn' ? 'প্রদানকারী' : 'Provider'}
            </label>
            <p className="text-text-primary font-semibold">{user.provider}</p>
          </div>

          <div>
            <label className="text-sm text-text-secondary uppercase tracking-wide block mb-1">
              {language === 'bn' ? 'ফোন' : 'Phone'}
            </label>
            <p className="text-text-primary font-mono">{user.phone}</p>
          </div>

          <div>
            <label className="text-sm text-text-secondary uppercase tracking-wide block mb-1">
              {language === 'bn' ? 'অ্যাকাউন্টের বয়স' : 'Account Age'}
            </label>
            <p className="text-text-primary">
              {user.account_age_days}{' '}
              {language === 'bn' ? 'দিন' : 'days'}
            </p>
          </div>

          <div>
            <label className="text-sm text-text-secondary uppercase tracking-wide block mb-1">
              {language === 'bn' ? 'মোট লেনদেন' : 'Total Transactions'}
            </label>
            <p className="text-text-primary">{user.total_transactions}</p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex gap-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                user.verified ? 'bg-success' : 'bg-text-secondary'
              }`}
            />
            <span className="text-sm text-text-secondary">
              {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                user.kyc_complete ? 'bg-success' : 'bg-text-secondary'
              }`}
            />
            <span className="text-sm text-text-secondary">
              {language === 'bn' ? 'KYC সম্পন্ন' : 'KYC Complete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

