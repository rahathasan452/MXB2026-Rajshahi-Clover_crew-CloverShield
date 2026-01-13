'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { URDecoder } from '@/lib/ur-encoder'
import { Icon } from '@/components/Icon'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserProfileCard } from '@/components/UserProfileCard'
import { useAppStore } from '@/store/useAppStore'

export default function ReceiverPage() {
    const [data, setData] = useState<any>(null)
    const [progress, setProgress] = useState(0)
    const [isScanning, setIsScanning] = useState(true)
    const [debugStats, setDebugStats] = useState({ scans: 0, lastFrame: '' })
    const decoderRef = useRef(new URDecoder())
    const { language, authUser, isAuthInitialized, setAuthModalOpen } = useAppStore()
    const router = useRouter()

    useEffect(() => {
        if (isAuthInitialized && !authUser) {
            router.push('/')
            setTimeout(() => setAuthModalOpen(true), 100)
        }
    }, [isAuthInitialized, authUser, router, setAuthModalOpen])

    if (!isAuthInitialized) return null
    if (!authUser) return null

    const handleScan = (text: string) => {
        if (!text) return

        // Update debug stats
        setDebugStats(prev => ({
            scans: prev.scans + 1,
            lastFrame: text.substring(0, 20) + '...'
        }))

        const result = decoderRef.current.receiveFrame(text)

        // Smooth progress update
        setProgress(result.progress)

        if (result.complete && result.data) {
            setIsScanning(false)
            setData(result.data)
            // Play success sound logic here if needed
        }
    }

    const handleReset = () => {
        decoderRef.current.reset()
        setData(null)
        setProgress(0)
        setIsScanning(true)
        setDebugStats({ scans: 0, lastFrame: '' })
    }

    const handleExport = () => {
        if (!data) return
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `secure_payload_${new Date().getTime()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-green-900 flex justify-between items-center bg-black/90 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Icon name="terminal" />
                    <span className="font-bold tracking-widest text-sm">SECURE_RECEIVER_V1.0</span>
                </div>
                <Link href="/dashboard" className="text-xs text-green-700 hover:text-green-500 border border-green-900 px-2 py-1 rounded">
                    EXIT
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">

                {isScanning ? (
                    <div className="w-full max-w-md relative">
                        {/* Scanner Viewport */}
                        <div className="aspect-square bg-green-900/10 border-2 border-green-500/50 rounded-lg overflow-hidden relative shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                            <Scanner
                                onScan={(result) => {
                                    if (result[0]?.rawValue) {
                                        handleScan(result[0].rawValue)
                                    }
                                }}
                                onError={(error: any) => console.log(error?.message)}
                                scanDelay={100}
                                components={{
                                    onOff: false,
                                    torch: false,
                                    zoom: false,
                                    finder: false
                                }}
                                styles={{
                                    container: { width: '100%', height: '100%' },
                                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                                }}
                            />

                            {/* Overlay UI */}
                            <div className="absolute inset-0 border-[2px] border-green-500 opacity-50 m-8 rounded-lg animate-pulse" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-scanline shadow-[0_0_10px_#22c55e]" />

                            {/* Debug Info Overlay */}
                            <div className="absolute top-2 left-2 right-2 text-[10px] font-mono text-green-500 bg-black/50 p-1 pointer-events-none z-10">
                                <div className="flex justify-between">
                                    <span>DELAY: 100ms</span>
                                    <span>SCANS: {debugStats.scans}</span>
                                </div>
                                <div className="text-xs opacity-70 truncate">{debugStats.lastFrame}</div>
                            </div>

                            <div className="absolute bottom-4 left-4 right-4 text-center">
                                <div className="text-xs bg-black/80 inline-block px-2 py-1 rounded text-green-400 mb-2">
                                    {progress > 0 ? `RECEIVING PACKETS... ${progress}%` : 'WAITING FOR SIGNAL...'}
                                </div>
                                <div className="h-1 w-full bg-green-900/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-200"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-xs text-green-700">
                            ALIGN CAMERA WITH ANIMATED QR CODE<br />
                            ENSURE STABLE CONNECTION
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-2xl animate-fade-in">
                        <div className="bg-black border border-green-500/30 rounded-lg p-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                            <div className="flex justify-between items-start mb-6 border-b border-green-900/50 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-green-400">PAYLOAD RECEIVED</h2>
                                    <p className="text-xs text-green-700 mt-1">INTEGRITY CHECK: PASSED</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExport}
                                        className="text-xs bg-green-900/20 hover:bg-green-900/40 text-green-400 px-3 py-2 rounded border border-green-800 transition-colors flex items-center gap-2"
                                    >
                                        <Icon name="download" /> SAVE
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="text-xs bg-green-900/20 hover:bg-green-900/40 text-green-400 px-3 py-2 rounded border border-green-800 transition-colors"
                                    >
                                        SCAN NEW
                                    </button>
                                </div>
                            </div>

                            {/* Determine Data Type and Render */}
                            {data.caseId ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-green-900/10 border border-green-900/30 rounded">
                                            <span className="block text-[10px] text-green-700 uppercase">CASE ID</span>
                                            {data.caseId}
                                        </div>
                                        <div className="p-3 bg-green-900/10 border border-green-900/30 rounded">
                                            <span className="block text-[10px] text-green-700 uppercase">RISK LEVEL</span>
                                            <span className={data.risk === 'high' ? 'text-red-500' : 'text-green-500'}>{data.risk || 'UNKNOWN'}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold border-b border-green-900/50 pb-2 mt-4">TRANSACTION EVIDENCE</h3>
                                    {data.transactions && Array.isArray(data.transactions) ? (
                                        <div className="max-h-60 overflow-y-auto font-mono text-xs border border-green-900/30 rounded">
                                            <table className="w-full text-left">
                                                <thead className="bg-green-900/20 text-green-300">
                                                    <tr>
                                                        <th className="p-2">TYPE</th>
                                                        <th className="p-2">AMOUNT</th>
                                                        <th className="p-2">FROM</th>
                                                        <th className="p-2">TO</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-green-900/30">
                                                    {data.transactions.map((tx: any, i: number) => (
                                                        <tr key={i}>
                                                            <td className="p-2">{tx.transaction_type}</td>
                                                            <td className="p-2">{tx.amount}</td>
                                                            <td className="p-2 truncate max-w-[80px]">{tx.sender_id}</td>
                                                            <td className="p-2 truncate max-w-[80px]">{tx.receiver_id}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="bg-green-900/10 p-4 text-xs font-mono whitespace-pre-wrap break-all border border-green-900/30 rounded">
                                            {JSON.stringify(data, null, 2)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Fallback for generic JSON
                                <div className="bg-green-900/10 p-4 text-xs font-mono whitespace-pre-wrap break-all border border-green-900/30 rounded h-64 overflow-y-auto">
                                    {JSON.stringify(data, null, 2)}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
