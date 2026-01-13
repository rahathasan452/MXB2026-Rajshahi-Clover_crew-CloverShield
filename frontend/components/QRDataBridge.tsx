import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { Icon } from './Icon'
import { encodeDataToFrames } from '@/lib/ur-encoder'

interface QRDataBridgeProps {
  data: any
  label?: string
}

export const QRDataBridge: React.FC<QRDataBridgeProps> = ({ data, label = "Secure Air-Gap Transfer" }) => {
  const [showQR, setShowQR] = useState(false)
  const [mode, setMode] = useState<'static' | 'animated'>('animated')
  const [frames, setFrames] = useState<string[]>([])
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0)
  const [fps, setFps] = useState(5) // Default 5 frames per second
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Compress data to essential fields for static mode
  const staticData = React.useMemo(() => {
    if (Array.isArray(data)) {
      return JSON.stringify({ 
        type: 'batch_transfer', 
        count: data.length, 
        sample_id: data[0]?.id || data[0]?.transaction_id 
      })
    }
    
    // Check if it's a transaction-like object
    if (data.caseId || data.transaction_id || data.amount) {
      return JSON.stringify({
        id: data.caseId || data.transaction_id,
        risk: data.risk_level || data.riskScore,
        type: data.type || data.transaction_type,
        amt: data.amount,
        ts: data.timestamp || "N/A"
      })
    }
    
    // Fallback for generic data
    const str = JSON.stringify(data)
    return str.length > 500 ? str.substring(0, 500) + '...' : str
  }, [data])

  // Prepare frames when data changes or mode switches
  useEffect(() => {
    if (mode === 'animated') {
      // Encode FULL data object, not just summary
      const encoded = encodeDataToFrames(data, 200) // 200 chars per frame
      setFrames(encoded)
      setCurrentFrameIdx(0)
    }
  }, [data, mode])

  // Animation Loop
  useEffect(() => {
    if (showQR && mode === 'animated' && frames.length > 0) {
      const intervalMs = 1000 / fps

      timerRef.current = setInterval(() => {
        setCurrentFrameIdx(prev => (prev + 1) % frames.length)
      }, intervalMs)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [showQR, mode, frames, fps])

  const currentQRValue = mode === 'static' ? staticData : (frames[currentFrameIdx] || "")

  return (
    <div className="relative">
      <div
        className={`border border-slate-700 bg-slate-900 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors h-[52px] px-4 min-w-[200px] ${showQR ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : ''}`}
        onClick={() => setShowQR(!showQR)}
      >
        <div className="flex items-center gap-3">
          <div className="text-emerald-400">
            <Icon name="qr_code" size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</h4>
          </div>
        </div>
        <Icon name={showQR ? "close" : "expand_more"} size={18} className="text-slate-500" />
      </div>

      {showQR && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setShowQR(false)}></div>
          
          <div className="absolute top-full right-0 mt-3 p-6 bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in slide-in-from-top-2 duration-200 z-50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 min-w-[280px]">
            {/* Pointer Tip */}
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-l border-t border-slate-200"></div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); setMode('static'); }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'static' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-black'}`}
              >
                Static
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMode('animated'); }}
                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'animated' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-black'}`}
              >
                Animated
              </button>
            </div>

            {/* Frame Counter - Outside QR to prevent obstruction */}
            {mode === 'animated' && (
              <div className="w-full flex justify-end mb-1">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {currentFrameIdx + 1}/{frames.length}
                </span>
              </div>
            )}

            <div className="p-3 bg-white border-4 border-slate-900 rounded-2xl mb-4 relative shadow-inner">
              <QRCode
                value={currentQRValue}
                size={200}
                level="M"
              />
            </div>

            <p className="text-center text-slate-900 font-black text-[10px] tracking-[0.2em] mb-4 uppercase">
              Secure Terminal Scan
            </p>

            {mode === 'animated' && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>Speed: {fps} FPS</span>
                  <span>{Math.round(frames.length * 200 / 1024)} KB Payload</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={fps}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 w-full text-[9px] text-slate-400 text-center font-mono leading-tight">
              {mode === 'static' ? `CRC: ${staticData.substring(0, 12)}...` : 'Transmitting encrypted frames...'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}