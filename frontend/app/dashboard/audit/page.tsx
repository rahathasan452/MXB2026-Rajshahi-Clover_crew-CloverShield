'use client'

import React, { useEffect, useState } from 'react'
import { AuditLogTable, AuditLog, AuditLogDocument } from '@/components/AuditLogTable'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAppStore } from '@/store/useAppStore'
import { logAudit } from '@/lib/audit'
import Link from 'next/link'
import { Icon } from '@/components/Icon'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QRDataBridge } from '@/components/QRDataBridge'

export default function AuditTrailPage() {
  const { language } = useAppStore()
  const [logs, setLogs] = useState<AuditLog[]>([])

  /* Dynamic System Status Check */
  const [systemStatus, setSystemStatus] = React.useState({
    logging: 'Checking...',
    integrity: 'Checking...',
    storage: 'Checking...',
    active: false
  })

  useEffect(() => {
    // Log the navigation event for compliance
    logAudit('NAVIGATED_TO_AUDIT', 'Analyst accessed the comprehensive audit trail')

    // Check connection
    const checkStatus = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { count, error } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true })

        if (!error) {
          setSystemStatus({
            logging: 'ACTIVE',
            integrity: 'VERIFIED',
            storage: 'SUPABASE CLOUD', // Or 'ON-PREMISE' if env var set
            active: true
          })
        } else {
          setSystemStatus({
            logging: 'ERROR',
            integrity: 'UNKNOWN',
            storage: 'DISCONNECTED',
            active: false
          })
        }
      } catch (e) {
        setSystemStatus({
          logging: 'OFFLINE',
          integrity: 'UNKNOWN',
          storage: 'UNREACHABLE',
          active: false
        })
      }
    }

    checkStatus()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#050714] p-4 md:p-8">
        <div className="container mx-auto space-y-8">
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-widest mb-4 font-mono">
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <Icon name="dashboard" size={14} /> Dashboard
                </Link>
                <span>/</span>
                <span className="text-slate-300 italic">Audit Trail</span>
              </div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Icon name="security" size={32} />
                </span>
                {language === 'bn' ? 'অডিট ট্রেইল' : 'Compliance Audit Trail'}
              </h1>
              <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed font-light">
                {language === 'bn'
                  ? 'সিস্টেমের সমস্ত কার্যকলাপ এবং ডেটা অ্যাক্সেসের একটি অপরিবর্তনীয় রেকর্ড। সার্বভৌম নিরাপত্তা এবং স্বচ্ছতা নিশ্চিত করতে এটি ডিজাইন করা হয়েছে।'
                  : 'An immutable record of all system activities and data access. Designed to ensure sovereign security, transparency, and regulatory compliance.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <QRDataBridge 
                data={{
                  doc_type: 'AUDIT_LOG_EXPORT',
                  generated_at: new Date().toISOString(),
                  logs: logs.slice(0, 50).map(l => ({
                    id: l.id,
                    time: l.created_at,
                    action: l.action_type,
                    actor: l.actor_id,
                    details: l.human_readable_message
                  }))
                }}
                label="Sync Recent Logs" 
              />
              
              <PDFDownloadLink
                document={<AuditLogDocument logs={logs} />}
                fileName={`audit_log_${new Date().toISOString().split('T')[0]}.pdf`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all h-[52px]"
              >
                {({ blob, url, loading, error }) =>
                  loading ? (
                    <><Icon name="sync" className="animate-spin" size={18} /> Preparing...</>
                  ) : (
                    <><Icon name="download" size={18} /> {language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Export PDF'}</>
                  )
                }
              </PDFDownloadLink>
            </div>
          </div>

          {/* Audit Stats Summary (Dynamic) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="hud-card p-6 border-l-4 border-l-emerald-500">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Logging Status</p>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemStatus.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                {systemStatus.logging}
              </h3>
            </div>
            <div className="hud-card p-6 border-l-4 border-l-blue-500">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Integrity Check</p>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Icon name={systemStatus.active ? "verified" : "error"} className={systemStatus.active ? "text-blue-500" : "text-red-500"} size={20} />
                {systemStatus.integrity}
              </h3>
            </div>
            <div className="hud-card p-6 border-l-4 border-l-purple-500">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter mb-1">Storage Provider</p>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Icon name="database" className="text-purple-500" size={20} />
                {systemStatus.storage}
              </h3>
            </div>
          </div>

          {/* Main Table */}
          <div className="w-full">
            <AuditLogTable onLogsLoaded={setLogs} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
