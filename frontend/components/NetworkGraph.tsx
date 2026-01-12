import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'
import { RiskLegend } from './RiskLegend'
import { getNetworkConnections } from '@/lib/supabase'
import { Transaction } from '@/types/dashboard'

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
  latestTransaction?: Transaction
  history?: Transaction[]
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
  const [expanding, setExpanding] = useState(false)

  const addTransactionsToGraph = useCallback((transactions: Transaction[]) => {
    setData(currentData => {
      const newNodes = [...currentData.nodes]
      const newLinks = [...currentData.links]
      
      transactions.forEach(tx => {
        const p = tx.fraud_probability || 0
        const senderId = tx.sender_id || (tx as any).nameOrig
        const receiverId = tx.receiver_id || (tx as any).nameDest

        // Link
        const linkExists = newLinks.find(l => {
            const s = typeof l.source === 'string' ? l.source : (l.source as any).id
            const t = typeof l.target === 'string' ? l.target : (l.target as any).id
            return (s === senderId && t === receiverId) || (s === receiverId && t === senderId)
        })

        if (!linkExists) {
            newLinks.push({
                source: senderId,
                target: receiverId,
                color: p > 0.7 ? '#EF4444' : p > 0.3 ? '#F59E0B' : '#22D3EE',
                width: p > 0.7 ? 4 : 2,
                particles: p > 0.7 ? 4 : 0
            })
        }

        // Nodes
        const updateOrAdd = (id: string, type: 'sender' | 'receiver') => {
            const idx = newNodes.findIndex(n => n.id === id)
            if (idx === -1) {
                newNodes.push({
                    id,
                    val: 4 + (p * 2),
                    color: getNodeColor(p, type),
                    type,
                    riskScore: p
                })
            } else {
                const node = newNodes[idx]
                const newRisk = Math.max(node.riskScore, p)
                newNodes[idx] = {
                    ...node,
                    riskScore: newRisk,
                    color: getNodeColor(newRisk, type),
                    val: 4 + (newRisk * 2)
                }
            }
        }

        updateOrAdd(senderId, 'sender')
        updateOrAdd(receiverId, 'receiver')
      })

      // Limit to last 200 nodes/links for performance
      return { 
          nodes: newNodes.slice(-200), 
          links: newLinks.slice(-200) 
      }
    })
  }, [])

  // Initialize from history
  useEffect(() => {
    if (history.length > 0) {
      addTransactionsToGraph(history)
    }
  }, [history, addTransactionsToGraph])

  // Listen for new transactions
  useEffect(() => {
    if (latestTransaction) {
      addTransactionsToGraph([latestTransaction])
    }
  }, [latestTransaction, addTransactionsToGraph])

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
  }, [])

  const handleExpand = async () => {
    if (!selectedNode) return
    setExpanding(true)
    try {
      // 1. Fetch 1st degree connections
      const firstDegree = await getNetworkConnections([selectedNode.id], 20)
      addTransactionsToGraph(firstDegree)

      // 2. Extract neighbors for 2nd degree
      const neighbors = new Set<string>()
      firstDegree.forEach(tx => {
          if (tx.sender_id !== selectedNode.id) neighbors.add(tx.sender_id)
          if (tx.receiver_id !== selectedNode.id) neighbors.add(tx.receiver_id)
      })

      if (neighbors.size > 0) {
          // Fetch 2nd degree connections for top 5 neighbors (limit depth)
          const topNeighbors = Array.from(neighbors).slice(0, 5)
          const secondDegree = await getNetworkConnections(topNeighbors, 20)
          addTransactionsToGraph(secondDegree)
      }
      
      setSelectedNode(null)
    } catch (error) {
      console.error("Expansion failed:", error)
    } finally {
      setExpanding(false)
    }
  }

  useEffect(() => {
    if (fgRef.current) {
      // Increase repulsion (charge) to separate nodes more
      fgRef.current.d3Force('charge').strength(-150)
      // Increase link distance
      fgRef.current.d3Force('link').distance(50)
    }
  }, [data])

  const handleReset = () => {
    setData({ nodes: [], links: [] })
    // Re-initialize from history
    if (history.length > 0) {
        addTransactionsToGraph(history)
    }
  }

  return (
    <div className="hud-card border border-white/10 relative overflow-hidden" style={{ height }}>
      <div className="absolute top-0 left-0 p-4 z-10 pointer-events-none w-full flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 hud-glow-blue">
            <Icon name="hub" size={24} />
            {language === 'bn' ? 'লাইভ নেটওয়ার্ক গ্রাফ' : 'LIVE NETWORK TOPOLOGY'}
          </h3>
          <p className="text-xs text-text-secondary font-mono mt-1">
            {data.nodes.length} {language === 'bn' ? 'নোড' : 'NODES'} | {data.links.length} {language === 'bn' ? 'লিঙ্ক' : 'EDGES'}
          </p>
        </div>

        <button 
          onClick={handleReset}
          className="pointer-events-auto flex items-center gap-1 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/5 text-slate-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
        >
          <Icon name="restart_alt" size={14} />
          {language === 'bn' ? 'রিসেট' : 'RESET VIEW'}
        </button>
      </div>
      
      <div className="scanline" />
      
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
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="text-xs text-slate-300 px-2 py-1 font-mono border-r border-slate-800">
            {selectedNode.id}
          </div>
          <button 
            onClick={handleExpand}
            disabled={expanding}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-all disabled:opacity-50"
          >
            {expanding ? (
                <Icon name="progress_activity" size={12} className="animate-spin" />
            ) : (
                <Icon name="add_circle" size={12} />
            )}
            {expanding ? (language === 'bn' ? 'প্রক্রিয়াকরণ' : 'EXPANDING...') : (language === 'bn' ? 'প্রসারণ' : 'EXPAND')}
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
