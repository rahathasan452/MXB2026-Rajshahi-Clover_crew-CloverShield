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

  const brandColor = 'border-clover' 
  const brandGradient = 'from-clover'

  // Route protection
  if (!authUser) {
    // router.push('/') 
  }

  const primaryMission = {
    title: language === 'bn' ? 'তদন্তের তালিকা' : 'Investigative Queue',
    description: language === 'bn' ? 'ঝুঁকিপূর্ণ লেনদেন পর্যালোচনা করুন।' : 'Review high-risk alerts.',
    details: language === 'bn' ? 'আপনার অগ্রাধিকার ইনবক্স। অবিলম্বে সিদ্ধান্তের অপেক্ষায় থাকা উচ্চ-ঝুঁকির সতর্কতাগুলি পর্যালোচনা এবং বিচার করুন।' : 'Your priority inbox. Review and adjudicate high-risk alerts pending immediate decision. Powered by real-time scoring.',
    icon: 'inbox',
    link: '/dashboard/investigate',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    badge: 'Action Required'
  }

  const toolkits = [
    {
      title: language === 'bn' ? 'ফ্রড স্ক্যানার' : 'Fraud Scanner',
      description: language === 'bn' ? 'ম্যানুয়াল লেনদেন পরীক্ষা করুন।' : 'Inspect transactions manually.',
      details: language === 'bn' ? 'এমএল মডেল ব্যবহার করে ম্যানুয়ালি লেনদেন পরিদর্শন এবং ঝুঁকি স্কোর বিশ্লেষণ করুন।' : 'Manually inspect transactions and analyze risk scores using the ML model. Useful for ad-hoc analysis.',
      icon: 'bolt',
      link: '/dashboard/simulator',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10'
    },
    {
      title: language === 'bn' ? 'পলিসি ল্যাব' : 'Rule Sandbox',
      description: language === 'bn' ? 'নতুন নিয়ম পরীক্ষা করুন।' : 'Backtest new fraud rules.',
      details: language === 'bn' ? 'উৎপাদনে মোতায়েন করার আগে ঐতিহাসিক ডেটার বিরুদ্ধে নতুন জালিয়াতির নিয়ম পরীক্ষা করুন।' : 'Test new fraud rules against historical data to measure impact before deploying to production.',
      icon: 'science',
      link: '/dashboard/sandbox',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Customer 360',
      description: language === 'bn' ? 'গ্রাহকের বিস্তারিত তথ্য।' : 'Deep dive into profiles.',
      details: language === 'bn' ? 'জালিয়াতির চক্র সনাক্ত করতে ব্যবহারকারীর প্রোফাইল, লেনদেনের ইতিহাস এবং নেটওয়ার্ক গ্রাফ দেখুন।' : 'View comprehensive user profiles, transaction history, and network graphs to identify fraud rings.',
      icon: 'person_search',
      link: '/dashboard/profile/search',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    },
    {
      title: language === 'bn' ? 'মডেল স্বাস্থ্য' : 'Model Health',
      description: language === 'bn' ? 'মডেল কর্মক্ষমতা পর্যবেক্ষণ।' : 'Monitor model performance.',
      details: language === 'bn' ? 'নির্ভুলতা, নির্ভুলতা এবং রিকল সহ এমএল মডেলের কর্মক্ষমতা মেট্রিক্স রিয়েল-টাইমে পর্যবেক্ষণ করুন।' : 'Monitor ML model performance metrics including Accuracy, Precision, and Recall in real-time.',
      icon: 'monitoring',
      link: '/dashboard/model-health',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    }
  ]

  return (
    <div className={`min-h-screen bg-[#050714] ${language === 'bn' ? 'font-bengali' : ''}`}>
      {/* Header */}
      <header className={`bg-gradient-header border-b-4 ${brandColor} rounded-b-3xl shadow-2xl mb-8 relative overflow-hidden`}>
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
                <h2 className="text-xs md:text-sm text-text-primary/60 font-mono tracking-[0.3em] uppercase">
                  {language === 'bn' ? 'ফ্রড অ্যানালিস্ট ওয়ার্কস্টেশন' : 'Fraud Analyst Workstation'}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        
        {/* Primary Action Zone - Inbox */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-500 rounded-full"></span>
            {language === 'bn' ? 'প্রাথমিক কাজ' : 'Primary Workflow'}
          </h2>
          
          <div className="relative group">
            <Link href={primaryMission.link} className="block group relative overflow-hidden bg-gradient-to-r from-[#0F1629] to-[#1a1f35] border border-white/10 hover:border-red-500/50 rounded-2xl p-8 transition-all duration-300 shadow-2xl hover:shadow-red-500/10">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-red-500 transform group-hover:scale-110 duration-500">
                <Icon name={primaryMission.icon} size={200} />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className={`p-4 rounded-2xl ${primaryMission.bg} ${primaryMission.color} ring-1 ring-white/10`}>
                  <Icon name={primaryMission.icon} size={48} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-white group-hover:text-red-400 transition-colors">
                      {primaryMission.title}
                    </h3>
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-500/50 uppercase tracking-wide">
                      {primaryMission.badge}
                    </span>
                  </div>
                  <p className="text-text-secondary text-lg leading-relaxed max-w-2xl">
                    {primaryMission.description}
                  </p>
                </div>

                <div className="bg-white/5 rounded-full p-2 group-hover:bg-white/10 transition-colors">
                  <Icon name="arrow_forward" size={32} className="text-white/50 group-hover:text-white" />
                </div>
              </div>
            </Link>

            {/* Info Button */}
            <div className="absolute top-4 right-4 z-20">
              <div className="relative group/info">
                <button className="text-white/30 hover:text-white transition-colors">
                  <Icon name="help_outline" size={24} />
                </button>
                <div className="absolute right-0 top-8 w-64 bg-[#1a1f35] border border-white/20 rounded-lg p-3 shadow-2xl hidden group-hover/info:block z-30">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {primaryMission.details}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Toolkit Grid - Features */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            {language === 'bn' ? 'অ্যানালিস্ট টুলকিট' : 'Analyst Toolkit'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {toolkits.map((tool, idx) => (
              <div key={idx} className="relative group">
                <Link href={tool.link} className="block group relative overflow-hidden bg-card-bg border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity ${tool.color} transform rotate-12`}>
                    <Icon name={tool.icon} size={100} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center p-2 rounded-lg ${tool.bg} ${tool.color} mb-4`}>
                      <Icon name={tool.icon} size={24} />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    
                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                      {tool.description}
                    </p>
                    
                    <div className="text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                      <span>{language === 'bn' ? 'খুলুন' : 'Open'}</span>
                      <Icon name="arrow_forward" size={14} />
                    </div>
                  </div>
                </Link>

                {/* Info Button */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="relative group/info">
                    <button className="text-white/20 hover:text-white transition-colors">
                      <Icon name="help_outline" size={20} />
                    </button>
                    <div className="absolute right-0 top-6 w-56 bg-[#1a1f35] border border-white/20 rounded-lg p-3 shadow-2xl hidden group-hover/info:block z-30">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {tool.details}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
