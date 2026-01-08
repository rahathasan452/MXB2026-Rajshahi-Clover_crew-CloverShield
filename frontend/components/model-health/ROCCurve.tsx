'use client'

import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ROC_DATA } from '@/lib/mock-data/model-metrics'
import { useAppStore } from '@/store/useAppStore'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

export const ROCCurve = () => {
    const { language } = useAppStore()

    const data = {
        labels: ROC_DATA.map((d) => d.x),
        datasets: [
            {
                label: 'ROC Curve',
                data: ROC_DATA.map((d) => d.y),
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: 'Baseline',
                data: ROC_DATA.map((d) => d.x), // y = x
                borderColor: '#6b7280', // gray-500
                borderDash: [5, 5],
                pointRadius: 0,
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Hide legend for cleaner look
            },
            title: {
                display: true,
                text: language === 'bn' ? 'ROC বক্ররেখা' : 'ROC Curve',
                color: '#fff',
                font: {
                    size: 16,
                    family: "'Inter', sans-serif",
                    weight: 'normal'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#1f2937',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                type: 'linear',
                min: 0,
                max: 1,
                title: {
                    display: true,
                    text: 'False Positive Rate',
                    color: '#6b7280'
                },
                ticks: {
                    color: '#9ca3af',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                }
            },
            y: {
                type: 'linear',
                min: 0,
                max: 1,
                title: {
                    display: true,
                    text: 'True Positive Rate',
                    color: '#6b7280'
                },
                ticks: {
                    color: '#9ca3af',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                }
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }

    return (
        <div className="w-full h-[300px] bg-card-bg border border-white/10 rounded-xl p-4">
            <Line options={options as any} data={data} />
        </div>
    )
}
