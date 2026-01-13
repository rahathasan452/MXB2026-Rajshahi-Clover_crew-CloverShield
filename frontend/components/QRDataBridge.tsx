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
  const [mode, setMode] = useState<'static' | 'animated'>('static')
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
        ts: data.timestamp || new Date().toISOString()
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
    <div className="border border-slate-700 bg-slate-900 rounded-lg overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setShowQR(!showQR)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded text-emerald-400">
            <Icon name="qr_code" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">QR Data Bridge</h4>
            <p className="text-xs text-slate-500">Optical handoff to secure device</p>
          </div>
        </div>
        <Icon name={showQR ? "expand_less" : "expand_more"} className="text-slate-500" />
      </div>

      {showQR && (
        <div className="p-6 bg-white flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">

          {/* Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4 w-full max-w-[200px]">
            <button
              onClick={() => setMode('static')}
              className={`flex-1 py-1 text-xs font-bold rounded ${mode === 'static' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
            >
              Static
            </button>
            <button
              onClick={() => setMode('animated')}
              className={`flex-1 py-1 text-xs font-bold rounded ${mode === 'animated' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
            >
              Animated
            </button>
          </div>

          {/* Frame Counter - Outside QR to prevent obstruction */}
          {mode === 'animated' && (
            <div className="w-full max-w-[200px] flex justify-end mb-1">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {currentFrameIdx + 1}/{frames.length}
              </span>
            </div>
          )}

          <div className="p-2 border-2 border-black rounded mb-4 relative">
            <QRCode
              value={currentQRValue}
              size={200}
              level="M"
            />
          </div>

          <p className="text-center text-black font-mono text-xs max-w-[200px] mb-2">
            SCAN WITH SECURE TERMINAL
          </p>

          {mode === 'animated' && (
            <div className="w-full max-w-[200px]">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Speed: {fps} FPS</span>
                <span>{Math.round(frames.length * 200 / 1024)} KB Total</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          )}

          <div className="mt-2 text-[10px] text-gray-500 text-center break-all w-full max-w-[250px]">
            {mode === 'static' ? `Preview: ${staticData.substring(0, 20)}...` : 'Transferring Full Payload...'}
          </div>
        </div>
      )}
    </div>
  )
}