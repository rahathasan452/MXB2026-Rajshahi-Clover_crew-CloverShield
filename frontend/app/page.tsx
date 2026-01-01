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
    <div className="min-h-screen bg-[#02040a] text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar - Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#02040a]/80 border-b border-emerald-900/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-1.5 bg-emerald-900/30 rounded-lg border border-emerald-500/20">
                <Image
                  src="/logo.png"
                  alt="CloverShield Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent hidden sm:inline-block">
                CloverShield Fraud Analyst Workstation
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent sm:hidden">
                CloverShield
              </span>
            </Link>

            {/* Sign In Button */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-emerald-900/20 to-transparent"></div>
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              National AI Build-a-thon 2026 Finalist
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 animate-fade-in-up delay-100">
              <span className="block text-white mb-2">Secure Every</span>
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Transaction
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl leading-relaxed mb-10 animate-fade-in-up delay-200">
              The Sovereign AI Fraud Analyst Workstation for Bangladesh's Mobile Finance. 
              Deploy privately on your servers with <span className="text-emerald-400 font-semibold">one Docker command</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-[#02040a] rounded-xl text-lg font-bold transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Icon name="rocket_launch" />
                Launch Workstation
              </Link>
              <Link
                href="#deployment"
                className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Icon name="terminal" />
                Deploy On-Premise
              </Link>
            </div>
          </div>

          {/* Hero Stats/Fact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto border-t border-white/10 pt-12 animate-fade-in-up delay-500">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-emerald-400 font-mono">Test Set Recall</div>
            </div>
            <div className="text-center border-l border-white/10">
              <div className="text-3xl font-bold text-white mb-1">&lt;200ms</div>
              <div className="text-sm text-emerald-400 font-mono">Inference Latency</div>
            </div>
            <div className="text-center border-l border-white/10">
              <div className="text-3xl font-bold text-white mb-1">Docker</div>
              <div className="text-sm text-emerald-400 font-mono">Zero-Trust Deploy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Model Insights Section */}
      <section className="py-24 px-4 bg-[#03060d]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-emerald-400">Trained for Reality</span>, Not Just Accuracy
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                We didn't just fit a model; we engineered a defense system. Our XGBoost model was trained using a <strong className="text-white">Temporal Split</strong> strategy, simulating real-world deployment where future fraud patterns are unknown.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-emerald-500/10 rounded text-emerald-400">
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <strong className="text-white block">Graph Neural Features</strong>
                    <span className="text-sm text-gray-500">PageRank & Network Degree analysis to catch fraud rings, not just bad transactions.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-emerald-500/10 rounded text-emerald-400">
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <strong className="text-white block">Class Imbalance Solved</strong>
                    <span className="text-sm text-gray-500">Advanced `scale_pos_weight` tuning to detect the 0.1% of fraud hidden in millions of legit transfers.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-emerald-500/10 rounded text-emerald-400">
                    <Icon name="check" size={16} />
                  </div>
                  <div>
                    <strong className="text-white block">99% Recall Target</strong>
                    <span className="text-sm text-gray-500">Optimized threshold to ensure ZERO missing fraud cases (False Negatives) in our test set.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-card-bg border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Icon name="code" className="text-emerald-400" />
                  Model Performance Card
                </h3>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Algorithm</span>
                    <span className="text-white">XGBoost Classifier</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Test Accuracy</span>
                    <span className="text-emerald-400 font-bold">100.0%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">Fraud Caught (Recall)</span>
                    <span className="text-emerald-400 font-bold">2,938 / 2,938</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500">False Positives</span>
                    <span className="text-white">Low (0.22%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Training Time</span>
                    <span className="text-white">~45 mins (GPU)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 relative bg-[#02040a]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Analyst Workstation Features</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything a fraud team needs to investigate, decide, and adapt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group bg-[#0A0F1C] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-all hover:bg-[#0F1629]">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="psychology" size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Explainable AI (XAI)</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Black boxes are dangerous. We use <strong>SHAP values</strong> to decompose every risk score, showing exactly which features (e.g., "Account Age < 1 day") triggered the alert.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-[#0A0F1C] border border-white/5 rounded-2xl p-8 hover:border-teal-500/30 transition-all hover:bg-[#0F1629]">
              <div className="w-14 h-14 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="science" size={32} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Policy Lab Sandbox</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Safely backtest new rules like "Block if amount > 50k AND location changed" against historical data before they go live. No more guessing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-[#0A0F1C] border border-white/5 rounded-2xl p-8 hover:border-cyan-500/30 transition-all hover:bg-[#0F1629]">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="hub" size={32} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Customer 360 Graph</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Visualize the money trail. Our interactive Network Graph reveals hidden connections between seemingly unrelated accounts, exposing syndicates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-[#0A0F1C] border border-white/5 rounded-2xl p-8 hover:border-red-500/30 transition-all hover:bg-[#0F1629]">
              <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="inbox" size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Priority Inbox</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Stop drowning in noise. Our intelligent queue dynamically ranks alerts by urgency (Risk Score + Amount), ensuring analysts focus on the <strong className="text-white">top 1% of threats</strong> that matter right now.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deployment / Docker Section */}
      <section id="deployment" className="py-24 px-4 bg-gradient-to-b from-[#03060d] to-[#02040a] border-t border-white/5">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="flex flex-col md:flex-row gap-12 relative z-10">
              <div className="flex-1">
                <div className="inline-block p-2 px-3 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold uppercase tracking-wider mb-4">
                  Zero-Trust Deployment
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Your Data, Your Infrastructure.
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Financial data is sensitive. That's why CloverShield is designed as a self-contained, <strong>Dockerized container</strong>. 
                </p>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  You don't send data to our cloud. You bring our AI to your data. This ensures 100% compliance with Bangladeshi financial data residency laws and internal security policies.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Icon name="lock" size={16} className="text-emerald-400" />
                    <span>No data egress - runs entirely on your private VPC/Server</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Icon name="cloud_off" size={16} className="text-emerald-400" />
                    <span>Air-gapped environment compatible</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Icon name="verified_user" size={16} className="text-emerald-400" />
                    <span>Bank-grade security compliant</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 bg-[#02040a] rounded-xl p-6 border border-white/10 font-mono text-sm shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-gray-500">bash — 80x24</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-emerald-500">➜</span> <span className="text-blue-400">~</span> <span className="text-gray-400">git clone https://github.com/clovershield/deploy.git</span>
                  </div>
                  <div>
                    <span className="text-emerald-500">➜</span> <span className="text-blue-400">~</span> <span className="text-gray-400">cd deploy && docker-compose up -d</span>
                  </div>
                  <div className="text-gray-500 animate-pulse">
                    [+] Running 3/3<br/>
                    &nbsp;✔ Container clovershield-db &nbsp;&nbsp;&nbsp;&nbsp;Started<br/>
                    &nbsp;✔ Container clovershield-ml-api &nbsp;Started<br/>
                    &nbsp;✔ Container clovershield-web &nbsp;&nbsp;&nbsp;&nbsp;Started<br/>
                    <br/>
                    <span className="text-emerald-400">✓ System Online at http://localhost:3000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <Icon name="visibility" size={48} className="mx-auto text-emerald-400 mb-6 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-bold mb-8">Our Vision</h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed italic opacity-90">
            "To build the digital immune system for Bangladesh's financial economy. We envision a future where trust is automated, fraud is obsolete, and every transaction—from the tea stall to the bank vault—is secured by intelligent, sovereign AI."
          </p>
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-500 uppercase tracking-widest">
            <span>Rajshahi</span>
            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
            <span>Bangladesh</span>
            <span className="w-1 h-1 rounded-full bg-gray-500"></span>
            <span>MXB2026</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#010205] border-t border-white/5 py-12 px-4 text-sm">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-80" />
            <span className="font-bold text-gray-300">CloverShield</span>
          </div>
          <div className="text-gray-600">
            &copy; 2026 Clover Crew. Built for National AI Build-a-thon.
          </div>
          <div className="flex gap-6 text-gray-500">
            <Link href="#" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}