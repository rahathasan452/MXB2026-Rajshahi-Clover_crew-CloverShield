'use client'

import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Title
} from 'chart.js'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'
import { Chart } from 'react-chartjs-2'
import { CONFUSION_MATRIX_DATA } from '@/lib/mock-data/model-metrics'
import { useAppStore } from '@/store/useAppStore'

// Register ChartJS components and the Matrix plugin
ChartJS.register(
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Title,
    MatrixController,
    MatrixElement
)

export const ConfusionMatrix = () => {
    const { language } = useAppStore()

    // Emerald color scale
    const getColor = (v: number) => {
        // Adjusted for 137k dataset size
        if (v > 100000) return 'rgba(16, 185, 129, 1)' // emerald-500
        if (v > 1000) return 'rgba(52, 211, 153, 0.8)' // emerald-400
        if (v > 100) return 'rgba(110, 231, 183, 0.6)' // emerald-300
        return 'rgba(209, 250, 229, 0.4)' // emerald-100
    }

    const data = {
        datasets: [
            {
                label: 'Confusion Matrix',
                data: CONFUSION_MATRIX_DATA,
                backgroundColor({ raw }: any) {
                    return getColor(raw.v)
                },
                borderColor: 'rgba(16, 185, 129, 0.2)',
                borderWidth: 1,
                width: ({ chart }: any) => (chart.chartArea || {}).width / 2 - 1,
                height: ({ chart }: any) => (chart.chartArea || {}).height / 2 - 1,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    title() {
                        return ''
                    },
                    label(context: any) {
                        const v = context.raw
                        return `${language === 'bn' ? 'আসল' : 'Actual'}: ${v.y}, ${language === 'bn' ? 'অনুমান' : 'Predicted'}: ${v.x}, ${language === 'bn' ? 'সংখ্যা' : 'Count'}: ${v.v}`
                    },
                },
                backgroundColor: '#1f2937',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            },
            title: {
                display: true,
                text: language === 'bn' ? 'কনফিউশন ম্যাট্রিক্স' : 'Confusion Matrix',
                color: '#fff',
                font: {
                    size: 16,
                    family: "'Inter', sans-serif",
                    weight: 'normal'
                }
            }
        },
        scales: {
            x: {
                type: 'category',
                labels: ['Legit', 'Fraud'],
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                    }
                },
                grid: {
                    display: false
                },
                title: {
                    display: true,
                    text: language === 'bn' ? 'অনুমান' : 'Predicted',
                    color: '#6b7280'
                }
            },
            y: {
                type: 'category',
                labels: ['Legit', 'Fraud'],
                offset: true,
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                    }
                },
                grid: {
                    display: false
                },
                title: {
                    display: true,
                    text: language === 'bn' ? 'আসল' : 'Actual',
                    color: '#6b7280'
                }
            },
        },
    }

    return (
        <div className="w-full h-[300px] bg-card-bg border border-white/10 rounded-xl p-4">
            <Chart type='matrix' data={data} options={options as any} />
        </div>
    )
}
