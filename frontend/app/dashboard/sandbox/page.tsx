/**
 * Rule Sandbox - Policy Lab
 * Backtest fraud rules against historical data
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { backtestRule } from '@/lib/ml-api'
import { Icon } from '@/components/Icon'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SandboxPage() {
  const { language } = useAppStore()
  const [rule, setRule] = useState('amount > 50000')
  const [limit, setLimit] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleRun = async () => {
    try {
      setLoading(true)
      const data = await backtestRule(rule, limit)
      setResults(data)
      toast.success('Backtest complete')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Pre-defined templates
  const templates = [
    { name: 'High Value Transfers', rule: 'amount > 200000 and type == "TRANSFER"' },
    { name: 'Repeated Small Payments', rule: 'amount < 500 and type == "PAYMENT"' },
    { name: 'Balance Draining', rule: 'oldBalanceOrig > 0 and newBalanceOrig == 0' },
  ]

  return (
    <div className={`min-h-screen bg-[#050714] text-white ${language === 'bn' ? 'font-bengali' : ''}`}>
       {/* Nav */}
       <div className="bg-gradient-header border-b border-white/10 p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-white transition-colors">
            <Icon name="arrow_back" />
            <span className="font-bold">{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Icon name="science" className="text-blue-400" />
            {language === 'bn' ? 'পলিসি ল্যাব' : 'Policy Lab'}
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card-bg border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="tune" /> Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Limit (Recent Transactions)</label>
                  <select 
                    value={limit} 
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  >
                    <option value={100}>Last 100</option>
                    <option value={1000}>Last 1,000</option>
                    <option value={5000}>Last 5,000</option>
                    <option value={10000}>Last 10,000</option>
                    <option value={50000}>Last 50,000 (Slow)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Rule Logic (Python/Pandas Syntax)</label>
                  <textarea 
                    value={rule} 
                    onChange={(e) => setRule(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-sm focus:border-primary focus:outline-none resize-none"
                    placeholder="e.g. amount > 10000"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleRun} 
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <Icon name="autorenew" className="animate-spin" />
                    ) : (
                      <Icon name="play_arrow" />
                    )}
                    Run Simulation
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card-bg border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <button 
                    key={i}
                    onClick={() => setRule(t.rule)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm group"
                  >
                    <div className="font-bold text-white group-hover:text-primary mb-1">{t.name}</div>
                    <div className="font-mono text-xs text-text-secondary truncate">{t.rule}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card-bg border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-text-secondary text-xs uppercase mb-1">Tested</div>
                    <div className="text-2xl font-black text-white">{results.total_tested.toLocaleString()}</div>
                  </div>
                  <div className="bg-card-bg border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-text-secondary text-xs uppercase mb-1">Matches</div>
                    <div className="text-2xl font-black text-blue-400">{results.total_matches.toLocaleString()}</div>
                  </div>
                  <div className="bg-card-bg border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-text-secondary text-xs uppercase mb-1">Fraud Caught</div>
                    <div className="text-2xl font-black text-green-400">{results.fraud_caught.toLocaleString()}</div>
                  </div>
                  <div className="bg-card-bg border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-text-secondary text-xs uppercase mb-1">Precision</div>
                    <div className="text-2xl font-black text-purple-400">{(results.precision * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-card-bg border border-white/10 rounded-xl p-6 h-[400px]">
                  <h3 className="text-lg font-bold mb-6">Impact Analysis</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Matches', value: results.total_matches, color: '#60a5fa' },
                        { name: 'Fraud Caught', value: results.fraud_caught, color: '#4ade80' },
                        { name: 'False Positives', value: results.false_positives, color: '#f87171' },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} width={100} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                        {
                          [0, 1, 2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#60a5fa', '#4ade80', '#f87171'][index]} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-right text-xs text-text-secondary">
                  Execution Time: {results.execution_time_ms}ms
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-white/10 border-dashed rounded-xl opacity-50">
                <Icon name="science" size={64} className="mb-4" />
                <h2 className="text-xl font-bold">Ready to Simulate</h2>
                <p className="max-w-md">Enter a rule on the left and click "Run Simulation" to backtest against the in-memory dataset.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
