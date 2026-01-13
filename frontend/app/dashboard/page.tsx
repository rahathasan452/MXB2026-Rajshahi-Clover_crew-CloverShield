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
      title: language === 'bn' ? 'কেস ফাইল' : 'Cases',
      desc: language === 'bn' ? 'সব কেস ম্যানেজ করুন' : 'Manage all files',
      link: '/dashboard/cases',
      icon: 'folder_managed',
      color: 'text-teal-400'
    },
    {
      title: language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Customer 360',
      desc: language === 'bn' ? 'গ্রাহক প্রোফাইল' : 'Profile Search',
      link: '/dashboard/profile/search',
      icon: 'person_search',
      color: 'text-purple-400'
    },
    {
      title: language === 'bn' ? 'ফ্রড স্ক্যানার' : 'Fraud Scanner',
      desc: language === 'bn' ? 'ম্যানুয়াল চেক' : 'Manual Check',
      link: '/dashboard/simulator',
      icon: 'bolt',
      color: 'text-yellow-400'
    },
    {
      title: language === 'bn' ? 'পলিসি' : 'Policy',
      desc: language === 'bn' ? 'নিয়ম পরীক্ষা' : 'Rule Sandbox',
      link: '/dashboard/sandbox',
      icon: 'science',
      color: 'text-blue-400'
    },
    {
      title: language === 'bn' ? 'হেলথ' : 'Health',
      desc: language === 'bn' ? 'মডেল স্ট্যাটাস' : 'Model Status',
      link: '/dashboard/model-health',
      icon: 'monitoring',
      color: 'text-emerald-400'
    },
    {
      title: language === 'bn' ? 'ট্রেনিং' : 'Training',
      desc: language === 'bn' ? 'মডেল ট্রেনিং' : 'Retrain Model',
      link: '/dashboard/training',
      icon: 'school',
      color: 'text-orange-400'
    }
  ]

  return (
    <div className="space-y-8">



      {/* KPI Stats Row - Utilitarian Info Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#0A0E17]/50 border border-white/5 p-4 rounded-lg flex items-center gap-4 group hover:bg-[#0A0E17]/80 transition-all">
            <div className={`p-2 rounded ${stat.bg} ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
              <Icon name={stat.icon} size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-mono font-bold text-gray-200">{stat.value}</h3>
                {stat.trend && (
                  <span className={`text-[10px] font-mono px-1 rounded bg-white/5 ${stat.trendUp ? 'text-red-500/80' : 'text-emerald-500/80'}`}>
                    {stat.trend}
                  </span>
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

        {/* Feature Tools Grid - Interactive & High Design */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.link}
              className="group relative flex flex-col items-center justify-center p-5 rounded-2xl bg-[#111827]/40 border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden"
            >
              {/* Feature Accent Glow */}
              <div className={`absolute -inset-2 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 bg-current ${tool.color}`}></div>

              <div className={`relative mb-4 p-3 rounded-2xl bg-[#0A0E17] border border-white/10 ${tool.color} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 shadow-xl`}>
                <Icon name={tool.icon} size={32} />
              </div>

              <div className="relative text-center">
                <h3 className="text-sm font-black text-white tracking-wide uppercase group-hover:text-emerald-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 font-medium group-hover:text-gray-300 transition-colors">
                  {tool.desc}
                </p>
              </div>

              {/* Decorative Corner Element */}
              <div className={`absolute bottom-0 right-0 w-8 h-8 opacity-10 group-hover:opacity-30 transition-opacity ${tool.color}`}>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-current rounded-full"></div>
                <div className="absolute bottom-2 right-4 w-1 h-px bg-current"></div>
                <div className="absolute bottom-4 right-2 h-1 w-px bg-current"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Secure Receiver & Database Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/receiver" className="group relative overflow-hidden rounded-2xl bg-[#0A0E17] border border-white/10 hover:border-emerald-500/50 p-6 transition-all duration-500">
          {/* Advanced Visual Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>

          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/40 transition-colors"></div>
              <div className="relative p-5 bg-[#0A0E17] border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Icon name="qr_code_scanner" size={40} />
              </div>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                <Icon name="security" size={10} />
                {language === 'bn' ? 'সুরক্ষিত' : 'Encrypted Bridge'}
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors leading-none mb-1">
                {language === 'bn' ? 'সিকিউর রিসিভার' : 'Secure Receiver'}
              </h3>
              <p className="text-sm text-gray-500 font-medium group-hover:text-gray-300 transition-colors">
                {language === 'bn' ? 'এয়ার-গ্যাপড ডেটা স্ক্যান করুন' : 'Import air-gapped evidence via QR bridge'}
              </p>
            </div>

            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300">
              <Icon name="arrow_forward" size={24} />
            </div>
          </div>

          {/* Decorative Scanner Effect */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
        </Link>

        {/* Database Info - Minimalist Utility Panel */}
        <div className="rounded-2xl border border-white/5 bg-[#050714]/50 p-6 flex items-center justify-between group hover:bg-[#0A0E17]/80 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-emerald-500 transition-colors">
              <Icon name="dns" size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1">
                {language === 'bn' ? 'ডাটাবেস স্ট্যাটাস' : 'Engine Connectivity'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-300">Supabase Cloud</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">14ms</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span className="text-emerald-500 text-xs font-black tracking-widest uppercase">Live</span>
            </div>
            <p className="text-[10px] text-gray-600 font-mono tracking-tighter">SOVEREIGN_MODE: ENABLED</p>
          </div>
        </div>
      </div>

    </div>
  )
}