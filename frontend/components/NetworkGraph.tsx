import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'
import { RiskLegend } from './RiskLegend'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-primary">Loading Graph Engine...</div>
})

interface GraphNode {
  id: string
  val: number // size
  color: string
  type: 'sender' | 'receiver'
  riskScore: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  color: string
  width: number
  particles?: number
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

interface NetworkGraphProps {
  height?: number
  language?: 'en' | 'bn'
  latestTransaction?: any
  history?: any[]
}

const getNodeColor = (risk: number, type: 'sender' | 'receiver') => {
  if (risk > 0.7) return '#EF4444' // Red
  if (risk > 0.3) return '#F59E0B' // Amber
  return type === 'sender' ? '#60A5FA' : '#F472B6' // Default Blue/Pink
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  height = 400,
  language = 'en',
  latestTransaction,
  history = []
}) => {
  const fgRef = useRef<any>()
  const { brandTheme } = useAppStore()
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // ... (keep useEffect etc)

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
  }, [])

  const handleExpand = () => {
    if (!selectedNode) return
    console.log("Expanding node:", selectedNode.id)
    // Expansion logic will be implemented in the next task
    setSelectedNode(null)
  }

  return (
    <div className="hud-card border border-white/10 relative overflow-hidden" style={{ height }}>
      {/* ... header ... */}
      
      <ForceGraph2D
        ref={fgRef}
        width={undefined} 
        height={height}
        graphData={data}
        nodeLabel="id"
        nodeRelSize={6}
        nodeColor="color"
        linkColor="color"
        linkWidth="width"
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => setSelectedNode(null)}
        linkDirectionalParticles="particles"
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={4}
        backgroundColor="#00000000" 
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.4}
        warmupTicks={200}
        cooldownTicks={150}
      />

      {selectedNode && (
        <div 
          className="absolute z-50 bg-slate-900 border border-emerald-500/50 rounded-lg p-2 shadow-xl flex gap-2 animate-fade-in"
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)' // Center for now, or use node coordinates if possible
          }}
        >
          <div className="text-xs text-slate-300 px-2 py-1 font-mono border-r border-slate-800">
            {selectedNode.id}
          </div>
          <button 
            onClick={handleExpand}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-all"
          >
            <Icon name="add_circle" size={12} />
            {language === 'bn' ? 'প্রসারণ' : 'EXPAND'}
          </button>
          <button 
            onClick={() => setSelectedNode(null)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10">
        <RiskLegend language={language} />
      </div>
      
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-text-secondary opacity-50">
            <Icon name="scatter_plot" size={48} className="mx-auto mb-2" />
            <p className="font-mono text-sm">WAITING FOR DATA STREAM...</p>
          </div>
        </div>
      )}
    </div>
  )
}