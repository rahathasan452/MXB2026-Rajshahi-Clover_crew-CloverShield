/**
 * Landing Page - CloverShield Public Entry Point
 * Marketing landing page for fraud detection system
 */

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'
import { Icon } from '@/components/Icon'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050714] text-white">
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#050714]/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="CloverShield Logo"
                width={48}
                height={48}
                className="h-10 w-10 object-contain"
                priority
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden sm:inline-block">
                CloverShield Fraud Analyst Workstation
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent sm:hidden">
                CloverShield
              </span>
            </Link>

            {/* Sign In Button */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-[#050714] to-[#050714]"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

        <div className="relative z-10 container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Next-Gen Fraud Detection
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="block text-white">AI-Powered</span>
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Financial Security
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Empower your fraud analysts with CloverShield's advanced workstation. Detect, investigate, and prevent mobile banking fraud in real-time with Explainable AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Icon name="rocket_launch" />
                  Launch Workstation
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="play_circle" />
                  Watch Demo
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-8 text-sm text-gray-500 font-mono">
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-green-500" size={16} />
                  <span>ISO 20022 Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-green-500" size={16} />
                  <span>99.9% Uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-green-500" size={16} />
                  <span>XGBoost Engine</span>
                </div>
              </div>
            </div>

            {/* Hero Visual/Dashboard Preview */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl transform rotate-3"></div>
              <div className="relative bg-[#0F172A] border border-white/10 rounded-2xl p-4 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Mock UI Header */}
                <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-white/5 h-6 rounded-lg w-full max-w-[200px]"></div>
                </div>
                {/* Mock UI Body */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="col-span-2 space-y-4">
                    <div className="bg-white/5 h-32 rounded-xl animate-pulse"></div>
                    <div className="bg-white/5 h-48 rounded-xl"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 h-40 rounded-xl p-4">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                        <Icon name="warning" className="text-red-400" size={16} />
                      </div>
                      <div className="h-2 w-16 bg-red-500/20 rounded mb-2"></div>
                      <div className="h-6 w-24 bg-red-500/20 rounded"></div>
                    </div>
                    <div className="bg-white/5 h-40 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-2">175M+</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Users Protected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-2">&lt;200ms</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-2">99.9%</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-2">24/7</div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Complete Fraud Intelligence</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A comprehensive suite of tools designed for the modern fraud analyst.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="psychology" size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Explainable AI</h3>
              <p className="text-gray-400 leading-relaxed">
                Don't just get a score. Understand the 'Why' behind every decision with SHAP values and LLM-powered natural language explanations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="science" size={32} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Policy Lab</h3>
              <p className="text-gray-400 leading-relaxed">
                Test new fraud rules against historical data in a safe sandbox environment before deploying them to production.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-pink-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="hub" size={32} className="text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Customer 360</h3>
              <p className="text-gray-400 leading-relaxed">
                Deep dive into user profiles, visualize transaction networks, and uncover hidden relationships between entities.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="bolt" size={32} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Scoring</h3>
              <p className="text-gray-400 leading-relaxed">
                Sub-second latency for every transaction. Block fraudulent attempts instantly without adding friction for genuine users.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-green-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="translate" size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Bilingual Interface</h3>
              <p className="text-gray-400 leading-relaxed">
                Built for Bangladesh with full English and Bengali support, ensuring accessibility for all analyst teams.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-card-bg border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all hover:bg-white/5">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="security" size={32} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Enterprise Secure</h3>
              <p className="text-gray-400 leading-relaxed">
                Role-based access control, audit logs, and secure data handling to meet the highest financial compliance standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Secure Your Network?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the leading financial institutions using CloverShield to protect millions of transactions daily.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-white text-[#050714] rounded-full text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl shadow-white/10"
                >
                  Get Started Now
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full text-lg font-bold hover:bg-white/5 transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020308] border-t border-white/5 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                <span className="text-xl font-bold text-white">CloverShield</span>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed">
                The advanced fraud detection workstation for modern financial teams. Powered by AI, designed for security.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Fraud Detection</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Policy Lab</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Customer 360</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Case Management</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">System Status</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Security</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <p>© 2026 Clover Crew. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}