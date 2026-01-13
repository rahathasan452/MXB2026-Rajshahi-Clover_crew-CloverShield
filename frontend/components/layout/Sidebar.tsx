'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/useAppStore'
import Image from 'next/image'
import { NAV_CONFIG, UserRole } from '@/config/navigation'

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

interface NavLinkProps {
  item: typeof NAV_CONFIG[0];
  isMobile?: boolean;
  pathname: string;
  language: string;
  setMobileOpen?: (open: boolean) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ item, isMobile = false, pathname, language, setMobileOpen }) => {
  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href)

  const handleClick = () => {
    if (isMobile && setMobileOpen) setMobileOpen(false)
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden
        ${isActive
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_#10b981]" />
      )}

      <Icon
        name={item.icon}
        className={`transition-colors z-10 ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white'}`}
        filled={isActive}
      />

      <span className={`text-sm font-medium z-10 ${isActive ? 'font-semibold' : ''}`}>
        {language === 'bn' ? item.labelBn : item.label}
      </span>

      {item.badge && (
        <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
      )}
    </Link>
  )
}

interface SidebarContentProps {
  isMobile?: boolean;
  allowedNavItems: typeof NAV_CONFIG;
  language: string;
  authUser: any;
  setMobileOpen?: (open: boolean) => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ isMobile = false, allowedNavItems, language, authUser, setMobileOpen }) => (
  <div className="flex flex-col h-full bg-[#0A0E17] border-r border-white/5">
    {/* Brand */}
    <div className="p-6 flex items-center justify-between border-b border-white/5 bg-[#0A0E17]/50 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-lg tracking-tight text-white whitespace-nowrap">
            Clover<span className="text-emerald-500">Shield</span>
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono truncate">
            Sovereign AI
          </p>
        </div>
      </Link>

      {isMobile && setMobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1 text-gray-500 hover:text-white"
        >
          <Icon name="close" />
        </button>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/5">
      <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
        {language === 'bn' ? 'মেনু' : 'Menu'}
      </div>
      {/* We need to use usePathname here? No, pass it down or use it in NavLink. NavLink uses props now but we need to pass it. */}
      {/* Wait, NavLink defined above takes pathname prop. */}
      <NavList allowedNavItems={allowedNavItems} language={language} isMobile={isMobile} setMobileOpen={setMobileOpen} />
    </nav>

    {/* User Footer & Theme Toggle */}
    <div className="p-4 border-t border-white/5 bg-[#080b12] space-y-4">
      {authUser ? (
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-[#0A0E17] group-hover:ring-emerald-500/50 transition-all uppercase">
            {authUser.email?.substring(0, 2) || 'AN'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
              {authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Analyst'}
            </p>
            <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">
              {authUser.email || 'Session Active'}
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Icon name="settings" size={16} className="text-gray-600 group-hover:text-white transition-colors" />
          </Link>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center text-xs text-gray-500">
          Not Authenticated
        </div>
      )}
    </div>
  </div>
)

// Helper to get pathname inside SidebarContent? 
// Actually, SidebarContent is a pure component now. It needs NavList which uses usePathname.
// Let's create NavList component to use usePathname hook properly.

const NavList = ({ allowedNavItems, language, isMobile, setMobileOpen }: { allowedNavItems: typeof NAV_CONFIG, language: string, isMobile: boolean, setMobileOpen?: (open: boolean) => void }) => {
  const pathname = usePathname()
  return (
    <>
      {allowedNavItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isMobile={isMobile}
          pathname={pathname}
          language={language}
          setMobileOpen={setMobileOpen}
        />
      ))}
    </>
  )
}


export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const { language, authUser } = useAppStore()

  // Determine role from auth metadata or default to 'analyst'
  const currentRole: UserRole = (authUser?.app_metadata?.role as UserRole) ||
    (authUser?.user_metadata?.role as UserRole) ||
    'admin'

  // Memoize filtered nav items based on role
  const allowedNavItems = useMemo(() => {
    return NAV_CONFIG.filter(item =>
      !item.roles || item.roles.includes(currentRole)
    )
  }, [currentRole])

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-50">
        <SidebarContent
          allowedNavItems={allowedNavItems}
          language={language}
          authUser={authUser}
          isMobile={false}
        />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`
        fixed inset-0 z-[60] md:hidden transition-all duration-300
        ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none delay-300'}
      `}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen?.(false)}
        />

        {/* Drawer Panel */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-[80%] max-w-xs transform transition-transform duration-300 shadow-2xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent
            allowedNavItems={allowedNavItems}
            language={language}
            authUser={authUser}
            isMobile={true}
            setMobileOpen={setMobileOpen}
          />
        </div>
      </div>
    </>
  )
}