'use client'

import React from 'react'
import { MODEL_SUMMARY, CONFUSION_MATRIX_DATA } from '@/lib/mock-data/model-metrics'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/useAppStore'
import dynamic from 'next/dynamic'

const ConfusionMatrix = dynamic(() => import('@/components/model-health/ConfusionMatrix').then(mod => mod.ConfusionMatrix), {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center text-white/20">Loading Chart...</div>
})
const ROCCurve = dynamic(() => import('@/components/model-health/ROCCurve').then(mod => mod.ROCCurve), {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center text-white/20">Loading Chart...</div>
})

export default function ModelHealthPage() {
    const { language } = useAppStore()

    const stats = [
        {
            label: language === 'bn' ? 'সঠিকতা' : 'Accuracy',
            value: (MODEL_SUMMARY.accuracy * 100).toFixed(1) + '%',
            icon: 'check_circle',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            label: language === 'bn' ? 'নির্ভুলতা' : 'Precision',
            value: (MODEL_SUMMARY.precision * 100).toFixed(1) + '%',
            icon: 'gps_fixed',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            label: language === 'bn' ? 'রিকল' : 'Recall',
            value: (MODEL_SUMMARY.recall * 100).toFixed(1) + '%',
            icon: 'restart_alt',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            label: 'F1 Score',
            value: (MODEL_SUMMARY.f1 * 100).toFixed(1) + '%',
            icon: 'functions',
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10'
        },
        {
            label: language === 'bn' ? 'বৈধতা' : 'Specificity',
            value: (MODEL_SUMMARY.specificity * 100).toFixed(1) + '%',
            icon: 'verified_user',
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10'
        }
    ]

    // Calculate Ratio: FP (Annoyed) / TP (Fraud Caught)
    // From mock data: FP is index 1, TP is index 3
    const fp = CONFUSION_MATRIX_DATA[1].v
    const tp = CONFUSION_MATRIX_DATA[3].v
    const ratio = (fp / tp).toFixed(2)

    stats.push({
        label: language === 'bn' ? 'বিরক্তি অনুপাত' : 'Annoyance Ratio (FP:TP)',
        value: `1 : ${(tp / fp).toFixed(0)}`, // Format as "1 : 10"
        icon: 'notifications_off',
        color: 'text-rose-400',
        bg: 'bg-rose-400/10'
    })

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Icon name="monitoring" size={32} className="text-emerald-500" />
                    </div>
                    {language === 'bn' ? 'মডেল স্বাস্থ্য' : 'Model Health Monitoring'}
                </h1>
                <p className="text-text-secondary ml-14">
                    {language === 'bn'
                        ? 'রিয়েল-টাইম এমএল মডেল কর্মক্ষমতা মেট্রিক্স।'
                        : 'Real-time ML model performance metrics and health status.'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-card-bg border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-text-secondary text-sm">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <Icon name={stat.icon} size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Confusion Matrix */}
                <div className="bg-card-bg/50 border border-white/5 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Icon name="grid_on" size={24} className="text-emerald-400" />
                        {language === 'bn' ? 'কনফিউশন ম্যাট্রিক্স' : 'Confusion Matrix'}
                    </h2>
                    <ConfusionMatrix />
                    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-text-secondary">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                            <span>High Confidence</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500/20 rounded-sm"></div>
                            <span>Low Confidence</span>
                        </div>
                    </div>
                </div>

                {/* ROC Curve */}
                <div className="bg-card-bg/50 border border-white/5 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Icon name="show_chart" size={24} className="text-emerald-400" />
                        {language === 'bn' ? 'ROC বক্ররেখা' : 'ROC Curve'}
                    </h2>
                    <ROCCurve />
                    <p className="mt-4 text-center text-xs text-text-secondary">
                        Area Under Curve (AUC): 0.99
                    </p>
                </div>
            </div>
        </div>
    )
}
