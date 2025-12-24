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
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-bg/80 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="CloverShield Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                CloverShield
              </span>
            </Link>

            {/* Sign In Button */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-text-primary hover:text-primary transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Screen Height */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-primary/5 to-dark-bg"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/10 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto max-w-5xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-text-primary via-primary to-success bg-clip-text text-transparent leading-tight">
            Fraud Protection for Mobile Banking
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
            Empowering financial institutions with real-time, AI-driven fraud detection to safeguard every transaction and protect Bangladesh&apos;s digital financial ecosystem.
          </p>

          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
            CloverShield leverages advanced machine learning algorithms to detect fraudulent transactions in real-time, providing instant alerts and actionable insights to protect your customers and your business.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-primary text-dark-bg rounded-full text-lg font-semibold hover:bg-primary/80 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              <Icon name="shield" size={24} />
              Start Shielding
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-transparent border-2 border-primary text-primary rounded-full text-lg font-semibold hover:bg-primary/10 transition-all flex items-center gap-2"
            >
              <Icon name="play_circle" size={24} />
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 px-4 bg-card-bg/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Trusted by Financial Institutions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Metric 1 */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">$1B+</div>
              <div className="text-text-secondary text-sm md:text-base mb-2">Transactions Analyzed</div>
              <p className="text-text-secondary text-xs md:text-sm">
                Our system has processed over one billion transactions
              </p>
            </div>

            {/* Metric 2 */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-success mb-2">99.9%</div>
              <div className="text-text-secondary text-sm md:text-base mb-2">Detection Accuracy Rate</div>
              <p className="text-text-secondary text-xs md:text-sm">
                Industry-leading accuracy with minimal false positives
              </p>
            </div>

            {/* Metric 3 */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">&lt;100ms</div>
              <div className="text-text-secondary text-sm md:text-base mb-2">Average Response Time</div>
              <p className="text-text-secondary text-xs md:text-sm">
                Lightning-fast analysis in real-time
              </p>
            </div>

            {/* Metric 4 */}
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-success mb-2">500+</div>
              <div className="text-text-secondary text-sm md:text-base mb-2">Financial Institutions Protected</div>
              <p className="text-text-secondary text-xs md:text-sm">
                Trusted by banks and fintech companies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why CloverShield?
          </h2>
          <p className="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
            Advanced fraud detection powered by machine learning and real-time analytics
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Real-time Detection */}
            <div className="bg-card-bg rounded-2xl p-8 border border-white/10 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Icon name="speed" size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-time Detection</h3>
              <p className="text-text-secondary leading-relaxed">
                Instantly identify and mitigate fraudulent activities as they occur, ensuring continuous protection with sub-second response times. Our system analyzes every transaction in real-time, blocking threats before they impact your business.
              </p>
            </div>

            {/* Feature 2: ML-Powered Analysis */}
            <div className="bg-card-bg rounded-2xl p-8 border border-white/10 hover:border-success/50 transition-all hover:shadow-lg hover:shadow-success/20">
              <div className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center mb-6">
                <Icon name="psychology" size={40} className="text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-4">ML-Powered Analysis</h3>
              <p className="text-text-secondary leading-relaxed">
                Leverage advanced machine learning algorithms trained on vast datasets to detect even the most subtle fraud patterns. Powered by XGBoost and enhanced with SHAP explanations for transparent, explainable AI decisions.
              </p>
            </div>

            {/* Feature 3: Instant Alerts */}
            <div className="bg-card-bg rounded-2xl p-8 border border-white/10 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Icon name="notifications_active" size={40} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instant Alerts</h3>
              <p className="text-text-secondary leading-relaxed">
                Receive immediate notifications of suspicious activities through multiple channels, enabling swift response and minimizing potential losses. Get detailed risk assessments and actionable recommendations with every alert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card-bg border-t border-white/10 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Press</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API Documentation</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Integration Guide</Link></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Case Studies</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">White Papers</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Support Center</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Security Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-white/10 pt-8 text-center text-text-secondary text-sm">
            <p className="mb-2">
              Built by Team Clover Crew for MXB2026 Rajshahi
            </p>
            <p className="mb-2">
              Powered by XGBoost & SHAP
            </p>
            <p>
              © 2024 CloverShield. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
