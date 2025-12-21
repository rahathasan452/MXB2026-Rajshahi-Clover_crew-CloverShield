/**
 * Root Layout
 * App-wide layout and providers
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CloverShield - Fraud Detection System',
  description: 'Mobile Banking Fraud Detection System for Bangladesh',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider>
          <div className="min-h-screen bg-gradient-dark">
            {children}
          </div>
        </AnalyticsProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

