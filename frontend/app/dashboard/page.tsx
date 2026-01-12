/**
 * Dashboard Overview (HUD)
 * The "Cockpit" view for the analyst
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from '@/components/Icon'
import { useRouter } from 'next/navigation'

export default function DashboardLanding() {
  const router = useRouter()
  const { language, authUser } = useAppStore()

  // Route protection (Optional: Middleware handles this usually)
  if (!authUser) {
    // router.push('/') 
  }

  // --- STATS CONFIG (Dynamic) ---
  const [statsData, setStatsData] = React.useState({
    pending: 0,
    cases: 0,
    risk: 0,
    loading: true
  })

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { getDashboardStats } = await import('@/lib/supabase')
        const data = await getDashboardStats()
        setStatsData({
          pending: data.pending_alerts,
          cases: data.open_cases,
          risk: data.avg_risk_score,
          loading: false
        })
      } catch (e) {
        console.error("Stats fetch failed", e)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    {
      label: language === 'bn' ? 'মুলতুবি সতর্কতা' : 'Pending Alerts',
      value: '12',
      trend: 'High',
      trendUp: true,
      icon: 'notifications_active',
      color: 'text-red-400',
      bg: 'bg-red-500/10'
    },
    {
      label: language === 'bn' ? 'উন্মুক্ত কেস' : 'Open Cases',
      value: statsData.loading ? '...' : statsData.cases.toString(),
      trend: 'Active',
      trendUp: false,
      icon: 'folder_open',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    {
      label: language === 'bn' ? 'ঝুঁকি স্কোর (গড়)' : 'Avg Risk Score',
      value: statsData.loading ? '...' : statsData.risk.toFixed(2),
      trend: 'Last 100',
      trendUp: statsData.risk > 0.5,
      icon: 'speed',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10'
    },
    {
      label: language === 'bn' ? 'সিস্টেম স্ট্যাটাস' : 'System Status',
      value: 'Active',
      sub: '99.9% Uptime',
      icon: 'dns',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    }
  ]

  // --- MAIN ACTION ---
  const primaryMission = {
    title: language === 'bn' ? 'তদন্ত শুরু করুন' : 'Start Investigation',
    description: language === 'bn'
      ? `১২টি উচ্চ-ঝুঁকির সতর্কতা পর্যালোচনার অপেক্ষায়।`
      : `12 high-risk alerts waiting for review.`,
    link: '/dashboard/investigate',
    icon: 'radar', // changed icon
  }

  // --- TOOLS GRID ---
  const tools = [
    {
      title: 'Cases',
      desc: language === 'bn' ? 'সব কেস ম্যানেজ করুন' : 'Manage all files',
      link: '/dashboard/cases',
      icon: 'folder_managed',
      color: 'text-teal-400'
    },
    {
      title: 'Customer 360',
      desc: language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Profile Search',
      link: '/dashboard/profile/search',
      icon: 'person_search',
      color: 'text-purple-400'
    },
    {
      title: 'Fraud Scanner',
      desc: language === 'bn' ? 'ম্যানুয়াল চেক' : 'Manual Check',
      link: '/dashboard/simulator',
      icon: 'bolt',
      color: 'text-yellow-400'
    },
    {
      title: 'Policy',
      desc: language === 'bn' ? 'নিয়ম পরীক্ষা' : 'Rule Sandbox',
      link: '/dashboard/sandbox',
      icon: 'science',
      color: 'text-blue-400'
    },
    {
      title: 'Health',
      desc: language === 'bn' ? 'মডেল স্ট্যাটাস' : 'Model Status',
      link: '/dashboard/model-health',
      icon: 'monitoring',
      color: 'text-emerald-400'
    },
    {
      title: 'Training',
      desc: language === 'bn' ? 'মডেল ট্রেনিং' : 'Retrain Model',
      link: '/dashboard/training',
      icon: 'school',
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {language === 'bn' ? 'স্বাগতম, অ্যানালিস্ট' : 'Welcome back, Analyst'}
          </h1>
          <p className="text-gray-400 text-sm">
            {language === 'bn' ? 'সিস্টেম এখন অনলাইনে এবং সুরক্ষিত।' : 'System is online and secure. Sovereign mode active.'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Quick Actions could go here */}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#111827] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                {stat.trend && (
                  <span className={`text-xs font-mono ${stat.trendUp ? 'text-red-400' : 'text-emerald-400'}`}>
                    {stat.trend}
                  </span>
                )}
                {stat.sub && (
                  <span className="text-xs text-gray-500 font-mono">{stat.sub}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Split View: Investigation Call-to-Action & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Primary Action Card (Takes 2/3 width) - Redesigned for Visual Impact */}
        <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-[#0A0E17] border border-white/10 hover:border-red-500/50 transition-all duration-500 p-px">
          {/* Animated Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-purple-500/20 opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
          
          {/* Scanning Line Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent absolute top-0 left-0 animate-scan-slow opacity-20"></div>
          </div>

          <div className="relative h-full bg-[#0A0E17]/90 backdrop-blur-xl rounded-xl p-8 md:p-12 flex flex-col justify-between overflow-hidden">
            {/* Decorative Orbiting Rings */}
            <div className="absolute -right-20 -top-20 w-80 h-80 border border-red-500/10 rounded-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
            <div className="absolute -right-10 -top-10 w-60 h-60 border border-red-500/5 rounded-full group-hover:rotate-12 transition-transform duration-1000 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-start justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {language === 'bn' ? 'জরুরী সতর্কতা' : 'Critical Priority'}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  {primaryMission.title}
                </h2>
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                  {primaryMission.description}
                </p>
              </div>

              <div className="relative flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                <div className="relative p-6 bg-gradient-to-br from-red-600/20 to-transparent border border-white/10 rounded-3xl backdrop-blur-sm shadow-2xl">
                  <Icon name={primaryMission.icon} size={64} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Link
                href={primaryMission.link}
                className="group/btn relative px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl flex items-center justify-center gap-3 transition-all overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover/btn:translate-x-[250%] transition-transform duration-700 ease-in-out"></div>
                <span className="relative z-10 text-lg uppercase tracking-wide">
                  {language === 'bn' ? 'প্রিওরিটি বক্স খুলুন' : 'Open Priority Box'}
                </span>
                <Icon name="arrow_forward" className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/dashboard/audit"
                className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                <Icon name="history" size={20} />
                {language === 'bn' ? 'ইতিহাস দেখুন' : 'View History'}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Tools Grid (Takes 1/3 width) */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.link}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#111827] border border-white/5 hover:bg-[#1a2235] hover:border-white/20 transition-all group text-center"
            >
              <div className={`mb-3 p-2 rounded-lg bg-white/5 ${tool.color} group-hover:scale-110 transition-transform`}>
                <Icon name={tool.icon} size={28} />
              </div>
              <h3 className="text-sm font-semibold text-gray-200">{tool.title}</h3>
              <p className="text-[10px] text-gray-500 mt-1">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Secure Receiver & Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/receiver" className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-900/10 to-cyan-900/10 border border-white/10 hover:border-emerald-500/30 p-6 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Icon name="qr_code_scanner" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {language === 'bn' ? 'সিকিউর রিসিভার' : 'Secure Receiver'}
              </h3>
              <p className="text-sm text-gray-400">
                {language === 'bn' ? 'এয়ার-গ্যাপড ডেটা স্ক্যান করুন' : 'Import air-gapped evidence via QR bridge'}
              </p>
            </div>
            <Icon name="arrow_forward" className="ml-auto text-emerald-500/50 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <div className="rounded-xl border border-white/5 bg-[#111827] p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">
              {language === 'bn' ? 'ডাটাবেস' : 'Database'}
            </h3>
            <p className="text-xs text-gray-500">Supabase Connected • 14ms Latency</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-emerald-500 text-sm font-mono font-bold">ONLINE</span>
          </div>
        </div>
      </div>

    </div>
  )
}