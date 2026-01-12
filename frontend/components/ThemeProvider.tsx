'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppStore()

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }, [theme])

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
