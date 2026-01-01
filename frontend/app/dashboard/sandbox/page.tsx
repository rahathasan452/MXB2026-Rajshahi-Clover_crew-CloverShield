/**
 * Rule Sandbox - Policy Lab
 * Backtest fraud rules against historical data
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppStore } from '@/store/useAppStore'
import { backtestRule } from '@/lib/ml-api'
import { Icon } from '@/components/Icon'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Feature Metadata
const FEATURES = [
  { id: 'amount', name: 'Transaction Amount', type: 'number', description: 'The amount of money being transferred.' },
  { id: 'type', name: 'Transaction Type', type: 'select', options: ['CASH_OUT', 'TRANSFER'], description: 'Type of transaction (Cash Out or Transfer).' },
  { id: 'oldBalanceOrig', name: 'Sender Account Balance', type: 'number', description: 'Balance in sender\'s account before transaction.' },
  { id: 'orig_txn_count', name: 'Sender Transaction Count', type: 'number', description: 'Total number of transactions made by this sender in the dataset.' },
  { id: 'dest_txn_count', name: 'Receiver Transaction Count', type: 'number', description: 'Total number of transactions received by this beneficiary.' },
  { id: 'in_degree', name: 'Incoming Network Degree', type: 'number', description: 'Number of unique senders who have sent money to this receiver.' },
  { id: 'out_degree', name: 'Outgoing Network Degree', type: 'number', description: 'Number of unique receivers this sender has sent money to.' },
  { id: 'network_trust', name: 'Network Trust Score', type: 'number', range: '0.0 - 1.0', description: 'PageRank score indicating the trustworthiness of the account in the network (0-1).' },
  { id: 'hour', name: 'Hour of Day', type: 'number', range: '0 - 23', description: 'The hour when the transaction occurred (0-23).' },
  { id: 'amt_ratio_to_user_median', name: 'Amount Ratio to Median', type: 'number', description: 'Ratio of current transaction amount to the user\'s median transaction amount.' },
  { id: 'amount_over_oldBalanceOrig', name: 'Amount / Balance Ratio', type: 'number', description: 'Ratio of transaction amount to available balance. > 1 indicates attempting to send more than available.' },
]

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '==', label: '=' },
  { value: '!=', label: '!=' },
]

interface Condition {
  id: string
  feature: string
  operator: string
  value: string
}

export default function SandboxPage() {
  const { language } = useAppStore()
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', feature: 'amount', operator: '>', value: '50000' }
  ])
  const [limit, setLimit] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  // Generate rule string from conditions
  const generateRuleString = () => {
    return conditions.map(c => {
      const featureConfig = FEATURES.find(f => f.id === c.feature)
      const val = featureConfig?.type === 'select' ? `"${c.value}"` : c.value
      return `${c.feature} ${c.operator} ${val}`
    }).join(' and ')
  }

  const handleRun = async () => {
    try {
      setLoading(true)
      const ruleString = generateRuleString()
      console.log('Running rule:', ruleString)
      const data = await backtestRule(ruleString, limit)
      setResults(data)
      toast.success('Backtest complete')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Math.random().toString(36).substr(2, 9), 
      feature: 'amount', 
      operator: '>', 
      value: '0' 
    }])
  }

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id))
    }
  }

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => {
      if (c.id === id) {
        const updated = { ...c, [field]: value }
        // Reset value if feature changes to a select type
        if (field === 'feature') {
          const newFeature = FEATURES.find(f => f.id === value)
          if (newFeature?.type === 'select') {
            updated.value = newFeature.options![0]
            updated.operator = '=='
          } else {
            updated.value = '0'
            updated.operator = '>'
          }
        }
        return updated
      }
      return c
    }))
  }

  // Pre-defined templates
  const applyTemplate = (templateConditions: Condition[]) => {
    setConditions(templateConditions.map(c => ({...c, id: Math.random().toString(36).substr(2, 9)})))
  }

  const templates = [
    { 
      name: 'High Value Transfers', 
      conditions: [
        { id: 't1', feature: 'amount', operator: '>', value: '200000' },
        { id: 't2', feature: 'type', operator: '==', value: 'TRANSFER' }
      ]
    },
    { 
      name: 'Repeated Small Payments', 
      conditions: [
        { id: 't1', feature: 'amount', operator: '<', value: '500' },
        { id: 't2', feature: 'type', operator: '==', value: 'TRANSFER' }, // Changed from PAYMENT to TRANSFER as per request only 2 types
        { id: 't3', feature: 'orig_txn_count', operator: '>', value: '10' }
      ]
    },
    { 
      name: 'Balance Draining', 
      conditions: [
        { id: 't1', feature: 'amount_over_oldBalanceOrig', operator: '>=', value: '1' },
        { id: 't2', feature: 'oldBalanceOrig', operator: '>', value: '0' }
      ]
    },
    {
      name: 'Suspicious Network Activity',
      conditions: [
        { id: 't1', feature: 'in_degree', operator: '>', value: '5' },
        { id: 't2', feature: 'network_trust', operator: '<', value: '0.1' }
      ]
    }
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Icon name="tune" /> Rule Logic
                </h3>
                <button 
                  onClick={addCondition}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                  title="Add Condition"
                >
                  <Icon name="add" size={20} />
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                {conditions.map((condition, idx) => {
                  const featureConfig = FEATURES.find(f => f.id === condition.feature)
                  return (
                    <div key={condition.id} className="relative bg-white/5 border border-white/10 rounded-lg p-3 group">
                      <div className="flex flex-col gap-2">
                        {/* Feature Select with Tooltip */}
                        <div className="flex items-center gap-2">
                          <select 
                            value={condition.feature} 
                            onChange={(e) => updateCondition(condition.id, 'feature', e.target.value)}
                            className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm font-semibold focus:border-primary focus:outline-none"
                          >
                            {FEATURES.map(f => (
                              <option key={f.id} value={f.id} className="bg-card-bg text-white">{f.name}</option>
                            ))}
                          </select>
                          
                          <div className="relative">
                            <button 
                              onMouseEnter={() => setActiveTooltip(condition.id)}
                              onMouseLeave={() => setActiveTooltip(null)}
                              className="text-text-secondary hover:text-primary transition-colors cursor-help"
                            >
                              <Icon name="help" size={16} />
                            </button>
                            
                            {activeTooltip === condition.id && featureConfig && (
                              <div className="absolute right-0 top-6 w-64 bg-slate-800 border border-white/20 rounded-lg p-3 shadow-2xl z-50 text-xs">
                                <p className="font-bold text-white mb-1">{featureConfig.name}</p>
                                <p className="text-text-secondary mb-2">{featureConfig.description}</p>
                                {featureConfig.range && (
                                  <div className="bg-white/10 rounded px-2 py-1 inline-block">
                                    <span className="text-primary font-mono">Range: {featureConfig.range}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Operator & Value */}
                        <div className="flex items-center gap-2">
                          <select 
                            value={condition.operator}
                            onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                            className="w-16 bg-white/5 rounded px-2 py-1 text-sm font-mono focus:border-primary focus:outline-none"
                          >
                            {OPERATORS.map(op => (
                              <option key={op.value} value={op.value} className="bg-card-bg">{op.label}</option>
                            ))}
                          </select>

                          {featureConfig?.type === 'select' ? (
                            <select
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                              className="flex-1 bg-white/5 rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
                            >
                              {featureConfig.options?.map(opt => (
                                <option key={opt} value={opt} className="bg-card-bg">{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="number" 
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                              className="flex-1 bg-white/5 rounded px-2 py-1 text-sm font-mono focus:border-primary focus:outline-none"
                              step="any"
                            />
                          )}

                          <button 
                            onClick={() => removeCondition(condition.id)}
                            className="text-red-400 hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={conditions.length === 1}
                          >
                            <Icon name="delete" size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
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

                <div className="bg-black/20 rounded p-2 text-xs font-mono text-text-secondary break-all">
                  <span className="text-primary">Query:</span> {generateRuleString()}
                </div>

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

            <div className="bg-card-bg border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Quick Templates</h3>
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <button 
                    key={i}
                    onClick={() => applyTemplate(t.conditions)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm group"
                  >
                    <div className="font-bold text-white group-hover:text-primary mb-1">{t.name}</div>
                    <div className="text-xs text-text-secondary opacity-70">
                       {t.conditions.length} conditions
                    </div>
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
                <div className="bg-card-bg border border-white/10 rounded-xl p-6 h-[500px]">
                  <h3 className="text-lg font-bold mb-6">Impact Analysis</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Total Tested', value: results.total_tested, color: '#94a3b8' },
                        { name: 'Rule Matches', value: results.total_matches, color: '#60a5fa' },
                        { name: 'Fraud Caught', value: results.fraud_caught, color: '#4ade80' },
                        { name: 'Legit Blocked', value: results.false_positives, color: '#f87171' },
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
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                        {
                          [0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#94a3b8', '#60a5fa', '#4ade80', '#f87171'][index]} />
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
                <p className="max-w-md">Add conditions on the left and click "Run Simulation" to backtest against the in-memory dataset.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
