'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/useAppStore'
import Image from 'next/image'

export const Sidebar = () => {
  const pathname = usePathname()
  const { language } = useAppStore()

  const navItems = [
    {
      label: language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard',
      href: '/dashboard',
      icon: 'dashboard',
      exact: true
    },
    {
      label: language === 'bn' ? 'তদন্ত' : 'Investigate',
      href: '/dashboard/investigate',
      icon: 'inbox',
      badge: true // Could be dynamic
    },
    {
      label: language === 'bn' ? 'কেস ফাইল' : 'Case Files',
      href: '/dashboard/cases',
      icon: 'folder_managed'
    },
    {
      label: language === 'bn' ? 'গ্রাফ অনুসন্ধান' : 'Graph Explorer',
      href: '/dashboard/profile/search',
      icon: 'hub'
    },
    {
      label: language === 'bn' ? 'স্ক্যানার' : 'Scanner',
      href: '/dashboard/simulator',
      icon: 'radar'
    },
    {
      label: language === 'bn' ? 'পলিসি ল্যাব' : 'Policy Lab',
      href: '/dashboard/sandbox',
      icon: 'science'
    },
    {
      label: language === 'bn' ? 'মডেল হেলথ' : 'Model Health',
      href: '/dashboard/model-health',
      icon: 'monitoring'
    },
    {
      label: language === 'bn' ? 'অডিট লগ' : 'Audit Logs',
      href: '/dashboard/audit',
      icon: 'fact_check'
    }
  ]

  return (
    <aside className="w-64 bg-[#0A0E17] border-r border-white/5 flex flex-col h-screen sticky top-0 z-50">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="relative w-8 h-8">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">
            Clover<span className="text-emerald-500">Shield</span>
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
            Sovereign AI
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon 
                name={item.icon} 
                className={`transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white'}`}
                filled={isActive}
              />
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              
              {item.badge && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / User Mini */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-emerald-400 truncate">Senior Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
