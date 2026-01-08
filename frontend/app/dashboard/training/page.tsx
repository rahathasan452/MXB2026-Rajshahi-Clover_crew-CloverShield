'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// --- Types ---
interface Model {
    id: string
    name: string
    version?: string
    status: 'training' | 'ready' | 'failed' | 'pending'
    metrics?: {
        accuracy: number
        precision: number
        recall: number
        f1: number
        error?: string
    }
    is_active: boolean
    created_at: string
}

export default function TrainingPage() {
    const { language } = useAppStore()

    // --- State ---
    // Wizard State
    const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Upload, 2: Config, 3: Training/Result

    // API Configuration
    const [apiUrl, setApiUrl] = useState('http://localhost:7860')
    const [showApiConfig, setShowApiConfig] = useState(false)

    // Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // Config State
    const [trainingConfig, setTrainingConfig] = useState({
        name: 'FraudModel_v1',
        version: new Date().toISOString().split('T')[0],
        test_split: 0.2,
        n_estimators: 100,
        max_depth: 6,
        learning_rate: 0.1,
        pagerank_limit: 10000,
        advanced_preprocessing: false,
        advanced_feature_engineering: false
    })

    // Training State
    const [trainingJobId, setTrainingJobId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Registry State
    const [models, setModels] = useState<Model[]>([])
    const [isLoadingModels, setIsLoadingModels] = useState(false)

    // --- Effects ---
    useEffect(() => {
        // Load API URL from localStorage if available
        const savedUrl = localStorage.getItem('ml_api_url')
        if (savedUrl) setApiUrl(savedUrl)
    }, [])

    useEffect(() => {
        fetchModels()
        const interval = setInterval(fetchModels, 5000)
        return () => clearInterval(interval)
    }, [apiUrl]) // Refetch when URL changes

    // --- Actions ---

    const fetchModels = async () => {
        if (!apiUrl) return
        try {
            const response = await axios.get(`${apiUrl}/models`)
            setModels(response.data)
        } catch (error) {
            console.error('Failed to fetch models from API, falling back to Supabase:', error)
            // Fallback to Supabase directly if API fails (handling RLS via policy)
            const { data, error: sbError } = await supabase
                .from('model_registry')
                .select('*')
                .order('created_at', { ascending: false })

            if (!sbError && data) setModels(data as Model[])
        }
    }

    const saveApiUrl = (url: string) => {
        setApiUrl(url)
        localStorage.setItem('ml_api_url', url)
        toast.success(`API URL updated`)
    }

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (file.name.endsWith('.csv')) {
                setSelectedFile(file)
            } else {
                toast.error('Only CSV files are allowed')
            }
        }
    }

    const handleActivate = async (modelId: string) => {
        try {
            await axios.post(`${apiUrl}/models/${modelId}/activate`)
            toast.success('Model activated successfully!')
            fetchModels()
        } catch (error) {
            toast.error('Failed to activate model')
            console.error(error)
        }
    }

    const startTraining = async () => {
        if (!selectedFile) return
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('config', JSON.stringify(trainingConfig))

        try {
            const response = await axios.post(`${apiUrl}/train`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setTrainingJobId(response.data.job_id)
            setStep(3)
            toast.success('Training started!')
            fetchModels()
        } catch (error) {
            toast.error('Failed to start training. Check API URL.')
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Icon name="school" size={32} className="text-blue-500" />
                        </div>
                        {language === 'bn' ? 'মডেল ট্রেনিং' : 'Model Training & Registry'}
                    </h1>
                    <p className="text-text-secondary ml-14">
                        {language === 'bn'
                            ? 'নতুন ডেটা দিয়ে মডেল ট্রেইন করুন এবং ম্যানেজ করুন।'
                            : 'Train new models with latest data and manage deployments.'}
                    </p>
                </div>

                {/* API Config Toggle */}
                <div className="relative">
                    <button
                        onClick={() => setShowApiConfig(!showApiConfig)}
                        className="text-text-secondary hover:text-white flex items-center gap-2 text-sm bg-white/5 px-3 py-2 rounded-lg"
                    >
                        <Icon name="settings" size={16} />
                        {showApiConfig ? 'Hide Config' : 'API Config'}
                    </button>

                    {showApiConfig && (
                        <div className="absolute right-0 top-12 w-80 bg-card-bg border border-white/10 rounded-xl p-4 shadow-2xl z-50 animate-fade-in">
                            <label className="text-xs text-text-secondary block mb-2">Backend API URL</label>
                            <input
                                type="text"
                                value={apiUrl}
                                onChange={(e) => saveApiUrl(e.target.value)}
                                placeholder="http://localhost:7860"
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-xs focus:border-blue-500 outline-none mb-2"
                            />
                            <p className="text-[10px] text-white/40">
                                Point to your local server or Cloud/Hugging Face Space URL (e.g., https://my-space.hf.space)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN - WIZARD */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card-bg border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Training Wizard</h2>

                        {/* Step Indicators */}
                        <div className="flex items-center mb-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex-1 flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold 
                                ${step === s ? 'bg-blue-500 text-white' : step > s ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/50'}`}>
                                        {step > s ? <Icon name="check" size={16} /> : s}
                                    </div>
                                    {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Upload */}
                        {step === 1 && (
                            <div className="animate-fade-in">
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleFileDrop}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40'}
                                ${selectedFile ? 'border-emerald-500 bg-emerald-500/5' : ''}
                            `}
                                >
                                    <input
                                        type="file"
                                        id="csvUpload"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
                                    />
                                    <label htmlFor="csvUpload" className="cursor-pointer">
                                        <div className="mb-4 flex justify-center">
                                            <Icon name={selectedFile ? "description" : "cloud_upload"} size={48} className={selectedFile ? "text-emerald-400" : "text-blue-400"} />
                                        </div>
                                        <p className="text-white font-medium mb-1">
                                            {selectedFile ? selectedFile.name : "Drop CSV dataset here"}
                                        </p>
                                        {!selectedFile && <p className="text-xs text-text-secondary">or click to browse</p>}
                                    </label>
                                </div>
                                <button
                                    disabled={!selectedFile}
                                    onClick={() => setStep(2)}
                                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    Next: Configure <Icon name="arrow_forward" size={18} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Configure */}
                        {step === 2 && (
                            <div className="animate-fade-in space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-text-secondary block mb-1">Model Name Tag</label>
                                        <input
                                            type="text"
                                            value={trainingConfig.name}
                                            onChange={(e) => setTrainingConfig({ ...trainingConfig, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary block mb-1">Version</label>
                                        <input
                                            type="text"
                                            value={trainingConfig.version}
                                            onChange={(e) => setTrainingConfig({ ...trainingConfig, version: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/10 space-y-4">
                                    <div>
                                        <label className="text-xs text-text-secondary block mb-2 flex justify-between">
                                            <span>Test Split</span>
                                            <span className="text-blue-400">{trainingConfig.test_split * 100}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="0.5"
                                            step="0.05"
                                            value={trainingConfig.test_split}
                                            onChange={(e) => setTrainingConfig({ ...trainingConfig, test_split: parseFloat(e.target.value) })}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-secondary block mb-2 flex justify-between">
                                            <span>Max Depth</span>
                                            <span className="text-blue-400">{trainingConfig.max_depth}</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="3"
                                            max="12"
                                            step="1"
                                            value={trainingConfig.max_depth}
                                            onChange={(e) => setTrainingConfig({ ...trainingConfig, max_depth: parseInt(e.target.value) })}
                                            className="w-full accent-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Advanced Options */}
                                <div className="pt-2 border-t border-white/10">
                                    <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Advanced Settings</h3>

                                    <label className="flex items-center justify-between cursor-pointer group mb-3">
                                        <span className="text-sm text-text-secondary group-hover:text-white transition-colors">Advanced Preprocessing</span>
                                        <div
                                            onClick={() => setTrainingConfig({ ...trainingConfig, advanced_preprocessing: !trainingConfig.advanced_preprocessing })}
                                            className={`w-10 h-6 rounded-full p-1 transition-colors ${trainingConfig.advanced_preprocessing ? 'bg-emerald-500' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${trainingConfig.advanced_preprocessing ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer group mb-3">
                                        <span className="text-sm text-text-secondary group-hover:text-white transition-colors">Feature Engineering</span>
                                        <div
                                            onClick={() => setTrainingConfig({ ...trainingConfig, advanced_feature_engineering: !trainingConfig.advanced_feature_engineering })}
                                            className={`w-10 h-6 rounded-full p-1 transition-colors ${trainingConfig.advanced_feature_engineering ? 'bg-emerald-500' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${trainingConfig.advanced_feature_engineering ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </label>

                                    <div>
                                        <label className="text-xs text-text-secondary block mb-1">PageRank Limit</label>
                                        <input
                                            type="number"
                                            value={trainingConfig.pagerank_limit}
                                            onChange={(e) => setTrainingConfig({ ...trainingConfig, pagerank_limit: parseInt(e.target.value) })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-lg transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={startTraining}
                                        disabled={isSubmitting}
                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isSubmitting ? <Icon name="refresh" className="animate-spin" size={20} /> : <Icon name="rocket_launch" size={20} />}
                                        Start Training
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Status */}
                        {step === 3 && (
                            <div className="animate-fade-in text-center py-8">
                                <div className="mb-4 inline-flex p-4 rounded-full bg-blue-500/10 text-blue-400 animate-pulse">
                                    <Icon name="engineering" size={48} />
                                </div>
                                <h3 className="text-white text-lg font-bold mb-2">Training in Progress</h3>
                                <p className="text-text-secondary text-sm mb-6">
                                    Job ID: <span className="font-mono text-xs">{trainingJobId?.slice(0, 8)}...</span>
                                </p>
                                <p className="text-xs text-white/40">
                                    You can see the status in the registry list.<br />
                                    Once 'Ready', you can activate it.
                                </p>

                                <button
                                    onClick={() => {
                                        setStep(1)
                                        setSelectedFile(null)
                                    }}
                                    className="mt-8 text-blue-400 text-sm hover:text-blue-300 underline"
                                >
                                    Train Another
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - REGISTRY */}
                <div className="lg:col-span-2">
                    <div className="bg-card-bg border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">Model Registry</h2>
                            <button onClick={fetchModels} className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors">
                                <Icon name="refresh" size={20} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-xs uppercase tracking-wider text-text-secondary">
                                        <th className="p-4">Model</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Accuracy</th>
                                        <th className="p-4">F1 Score</th>
                                        <th className="p-4">Created</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {models.map((model) => (
                                        <tr key={model.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${model.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-white/20'}`}></div>
                                                    <div>
                                                        <div className="font-medium text-white">{model.name}</div>
                                                        <div className="text-xs text-text-secondary">{model.version}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                            ${model.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                                            ${model.status === 'training' ? 'bg-blue-500/10 text-blue-400 animate-pulse' : ''}
                                            ${model.status === 'failed' ? 'bg-red-500/10 text-red-400' : ''}
                                            ${model.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                                        `}>
                                                    {model.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-white/80">
                                                {model.metrics?.accuracy ? (model.metrics.accuracy * 100).toFixed(1) + '%' : '-'}
                                            </td>
                                            <td className="p-4 font-mono text-white/80">
                                                {model.metrics?.f1 ? (model.metrics.f1 * 100).toFixed(1) + '%' : '-'}
                                            </td>
                                            <td className="p-4 text-text-secondary">
                                                {new Date(model.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {model.status === 'ready' && !model.is_active && (
                                                    <button
                                                        onClick={() => handleActivate(model.id)}
                                                        className="px-3 py-1 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/70 rounded border border-white/10 hover:border-emerald-500/50 transition-all text-xs"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                {model.is_active && (
                                                    <span className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1">
                                                        <Icon name="check_circle" size={14} /> Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {models.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-text-secondary">
                                                No models found. Upload a dataset to train one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
