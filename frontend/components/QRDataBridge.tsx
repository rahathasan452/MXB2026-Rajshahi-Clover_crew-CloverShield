import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { Icon } from './Icon'

interface QRDataBridgeProps {
  data: any
  label?: string
}

export const QRDataBridge: React.FC<QRDataBridgeProps> = ({ data, label = "Secure Air-Gap Transfer" }) => {
  const [showQR, setShowQR] = useState(false)

  // Compress data to essential fields to keep QR density manageable
  const cleanData = JSON.stringify({
    id: data.caseId || data.transaction_id,
    risk: data.risk_level || data.riskScore,
    type: data.type || data.transaction_type,
    amt: data.amount,
    ts: data.timestamp || new Date().toISOString()
  })

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
          <div className="p-2 border-2 border-black rounded mb-4">
            <QRCode 
              value={cleanData} 
              size={200} 
              level="M" 
            />
          </div>
          <p className="text-center text-black font-mono text-xs max-w-[200px]">
            SCAN WITH SECURE TERMINAL
          </p>
          <div className="mt-2 text-[10px] text-gray-500 text-center break-all w-full max-w-[250px]">
            MD5: {data.id ? data.id.substring(0, 8) : 'UNK'}...
          </div>
        </div>
      )}
    </div>
  )
}
