/**
 * Landing Page - CloverShield Sovereign AI Workstation
 * Redesigned Jan 2026 for National AI Build-a-thon
 */

'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthButton } from '@/components/AuthButton'
import { Icon } from '@/components/Icon'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2 bg-slate-900 border border-white/10 rounded-lg group-hover:border-emerald-500/50 transition-colors">
                  <Image
                    src="/logo.png"
                    alt="CloverShield"
                    width={28}
                    height={28}
                    className="w-7 h-7"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  CloverShield
                </span>
                <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">
                  Sovereign AI Defense
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <Link 
                href="/docs" 
                className="hidden md:block text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Documentation
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Console
                </Link>
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 px-4 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>

        <div className="relative z-10 container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM ONLINE: MXB2026 BUILD
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-tight font-mono animate-fade-in-up delay-100">
            Secure the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Financial Frontier
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
            The Sovereign AI Workstation for Mobile Finance. Detect fraud in <span className="text-emerald-400 font-mono">200ms</span>. Explain every block. Deploy on-premise with zero data egress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-bold transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 flex items-center gap-3 group"
            >
              <Icon name="rocket_launch" />
              Launch Workstation
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-white rounded-lg font-mono font-bold transition-all flex items-center gap-3"
            >
              <Icon name="menu_book" />
              Read User Guide
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-up delay-500">
            <div>
              <div className="text-3xl font-mono font-bold text-white mb-1">100%</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Recall Rate</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-white mb-1">&lt;200ms</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Latency</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-white mb-1">99.8%</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-emerald-400 mb-1">Local</div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Deployment</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Digital Immune System (Feature Grid) */}
      <section className="py-32 px-4 bg-slate-950 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-mono font-bold text-white mb-6">
              The Digital Immune System
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl">
              A comprehensive defense suite designed for the modern fraud analyst. 
              From automated detection to legally-compliant reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Hybrid Engine */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <Icon name="psychology" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Hybrid Engine</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Combines high-speed <strong>XGBoost</strong> scoring with a SQL-based <strong>Policy Lab</strong>. Catch known patterns instantly while learning new vectors in real-time.
              </p>
            </div>

            {/* Feature 2: Analyst Copilot */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Icon name="smart_toy" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Analyst Copilot</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Your AI partner. Ask questions like <em>"Why was this blocked?"</em> or <em>"Draft a SAR for this case"</em>. Powered by context-aware LLMs.
              </p>
            </div>

            {/* Feature 3: Graph Intelligence */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Icon name="hub" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Graph Intel</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Visualize the syndicate. Interactive <strong>Network Graphs</strong> reveal hidden links between accounts, showing money laundering rings at a glance.
              </p>
            </div>

            {/* Feature 4: Governance & Audit */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform">
                <Icon name="gavel" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Governance</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Every click logged. Immutable <strong>Audit Trails</strong> and automated <strong>SAR Generation</strong> ensure you stay compliant with BFIU regulations.
              </p>
            </div>

            {/* Feature 5: Model Registry */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center mb-6 text-teal-400 group-hover:scale-110 transition-transform">
                <Icon name="model_training" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Model Registry</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Democratized AI. Upload new datasets and retrain the model via a <strong>Code-Free UI</strong>. Hot-swap versions without downtime.
              </p>
            </div>

            {/* Feature 6: Secure QR Bridge */}
            <div className="group bg-slate-900/50 border border-white/5 p-8 rounded-2xl hover:border-emerald-500/30 hover:bg-slate-900 transition-all">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 transition-transform">
                <Icon name="qr_code_scanner" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-mono">Secure Bridge</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Zero-Trust data ingest. Import external evidence (PDFs, Images) via <strong>Air-Gapped QR Codes</strong>. No internet required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Deep Dive (Zero Trust) */}
      <section className="py-32 px-4 bg-slate-900 border-y border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <div className="inline-block p-2 px-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6 uppercase tracking-wider">
                Deployment Architecture
              </div>
              <h2 className="text-3xl md:text-5xl font-mono font-bold text-white mb-6">
                Zero-Trust by Design.
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Your financial data never leaves your premises. CloverShield is delivered as a self-contained <strong>Docker</strong> ecosystem.
              </p>
              
              <ul className="space-y-4 font-mono text-sm text-slate-300">
                <li className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-lg border border-white/5">
                  <Icon name="lock" className="text-emerald-400" />
                  <span>Air-Gapped Compatible (No Internet Required)</span>
                </li>
                <li className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-lg border border-white/5">
                  <Icon name="storage" className="text-emerald-400" />
                  <span>Local PostgreSQL + Vector Database</span>
                </li>
                <li className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-lg border border-white/5">
                  <Icon name="security" className="text-emerald-400" />
                  <span>Row-Level Security (RLS) & Audit Logging</span>
                </li>
              </ul>
            </div>
            
            <div className="flex-1 w-full">
              <div className="bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="ml-2 text-xs text-slate-500 font-mono">server — bash</span>
                </div>
                <div className="p-6 font-mono text-sm space-y-4">
                  <div>
                    <span className="text-emerald-400">root@server:~$</span> <span className="text-slate-300">docker-compose up -d</span>
                  </div>
                  <div className="text-slate-500">
                    [+] Running 4/4<br/>
                    <span className="text-emerald-500"> ✔</span> Network clovershield-net &nbsp;&nbsp;&nbsp;&nbsp;Created<br/>
                    <span className="text-emerald-500"> ✔</span> Container clovershield-db &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Started<br/>
                    <span className="text-emerald-500"> ✔</span> Container clovershield-ml-api &nbsp;Started<br/>
                    <span className="text-emerald-500"> ✔</span> Container clovershield-web &nbsp;&nbsp;&nbsp;&nbsp;Started
                  </div>
                  <div>
                    <span className="text-emerald-400">root@server:~$</span> <span className="text-slate-300">curl http://localhost:8000/health</span>
                  </div>
                  <div className="text-emerald-300">
                    {`{"status": "healthy", "model_version": "v2.1.0"}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5 bg-slate-950">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-80">
            <div className="p-1.5 bg-white/5 rounded border border-white/10">
              <Image src="/logo.png" alt="Logo" width={20} height={20} />
            </div>
            <span className="font-mono font-bold text-slate-300">CloverShield</span>
          </div>
          
          <div className="text-slate-500 text-sm">
            &copy; 2026 Clover Crew. Built for National AI Build-a-thon.
          </div>
          
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link href="#" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-emerald-400 transition-colors">Security</Link>
            <Link href="https://github.com/clovershield" className="hover:text-emerald-400 transition-colors">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
