/**
 * Dashboard Landing Page - Mission Control
 * Entry point for the Fraud Analyst
 */

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { AuthButton } from '@/components/AuthButton'
import { ThemeLanguageControls } from '@/components/ThemeLanguageControls'
import { Icon } from '@/components/Icon'
import { useRouter } from 'next/navigation'

export default function DashboardLanding() {
  const router = useRouter()
  const { language, brandTheme, authUser } = useAppStore()

  const isBkash = brandTheme === 'bkash'
  // Updated to Clover Green as requested for top UI
  const brandColor = 'border-clover' 
  const brandGradient = 'from-clover'

  // Route protection handled by layout or middleware ideally, but here for safety
  if (!authUser) {
    // Ideally redirect, but preventing flash of content
    // router.push('/') 
    // return null
  }

  const missions = [
    {
      title: language === 'bn' ? 'লাইভ সিমুলেটর' : 'Live Simulator',
      description: language === 'bn' ? 'নকল লেনদেন তৈরি করে মডেল যাচাই করুন।' : 'Inject synthetic data to test detection models in real-time.',
      icon: 'bolt',
      link: '/dashboard/simulator',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10'
    },
    {
      title: language === 'bn' ? 'তদন্তের তালিকা' : 'Investigative Queue',
      description: language === 'bn' ? 'ঝুঁকিপূর্ণ লেনদেন পর্যালোচনা করুন।' : 'Review and adjudicate high-risk alerts pending decision.',
      icon: 'inbox',
      link: '/dashboard/investigate',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      badge: '10+ Pending'
    },
    {
      title: language === 'bn' ? 'পলিসি ল্যাব' : 'Rule Sandbox',
      description: language === 'bn' ? 'নতুন নিয়ম ও শর্তাবলী পরীক্ষা করুন।' : 'Backtest new fraud rules against historical data instantly.',
      icon: 'science',
      link: '/dashboard/sandbox',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Customer 360',
      description: language === 'bn' ? 'গ্রাহকের বিস্তারিত তথ্য অনুসন্ধান করুন।' : 'Deep dive into user identity, history, and network graph.',
      icon: 'person_search',
      link: '/dashboard/profile/search', // We'll handle the search redirect there
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    }
  ]

  return (
    <div className={`min-h-screen bg-[#050714] ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Header */}
      <header className={`bg-gradient-header border-b-4 ${brandColor} rounded-b-3xl shadow-2xl mb-12 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
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
              <div className="flex-1">
                <h1 className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${brandGradient} to-white bg-clip-text text-transparent mb-1 tracking-tight`}>
                  {language === 'bn' ? 'ক্লোভারশিল্ড' : 'CLOVERSHIELD'}
                </h1>
                <h2 className="text-sm md:text-base text-text-primary/80 font-mono tracking-widest uppercase">
                  {language === 'bn' ? 'অ্যানালিস্ট ওয়ার্কস্টেশন' : 'Analyst Workstation'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <ThemeLanguageControls />
              <div className="h-10 w-px bg-white/10 hidden md:block"></div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mission Control Grid */}
      <div className="container mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-primary pl-4">
          {language === 'bn' ? 'মিশন কন্ট্রোল' : 'Mission Control'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map((mission, idx) => (
            <Link key={idx} href={mission.link} className="group relative overflow-hidden bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${mission.color}`}>
                <Icon name={mission.icon} size={120} />
              </div>
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl ${mission.bg} ${mission.color} mb-6`}>
                  <Icon name={mission.icon} size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                  {mission.title}
                </h3>
                
                <p className="text-text-secondary text-lg leading-relaxed mb-6 max-w-md">
                  {mission.description}
                </p>
                
                <div className="flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                  <span>{language === 'bn' ? 'অ্যাক্সেস করুন' : 'Access Module'}</span>
                  <Icon name="arrow_forward" />
                </div>
              </div>
              
              {mission.badge && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/50">
                  {mission.badge}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}