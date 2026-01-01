/**
 * Root Layout
 * App-wide layout and providers
 */

import type { Metadata } from 'next'
import { Inter, Hind_Siliguri } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })
const hindSiliguri = Hind_Siliguri({ 
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
})

export const metadata: Metadata = {
  title: 'CloverShield Fraud Analyst Workstation',
  description: 'Mobile Banking Fraud Detection System for Bangladesh',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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
      <body className={`${inter.className} ${hindSiliguri.variable}`}>
        <AuthProvider>
          <AnalyticsProvider>
            <div className="min-h-screen bg-gradient-dark">
              {children}
            </div>
          </AnalyticsProvider>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

