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
  other: {
    'material-symbols': 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
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

