import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'

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
}

interface GraphLink {
  source: string
  target: string
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

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  height = 400,
  language = 'en',
  latestTransaction,
  history = []
}) => {
  const fgRef = useRef<any>()
  const { brandTheme } = useAppStore()
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] })

  // Initialize from history
  useEffect(() => {
    if (history.length > 0) {
      const nodesMap = new Map<string, GraphNode>()
      const links: GraphLink[] = []

      history.forEach(tx => {
        // Add Sender
        if (!nodesMap.has(tx.sender_id)) {
          nodesMap.set(tx.sender_id, {
            id: tx.sender_id,
            val: 5,
            color: '#ffffff',
            type: 'sender'
          })
        }
        
        // Add Receiver
        if (!nodesMap.has(tx.receiver_id)) {
          nodesMap.set(tx.receiver_id, {
            id: tx.receiver_id,
            val: 5,
            color: '#ffffff',
            type: 'receiver'
          })
        }

        // Add Link
        links.push({
          source: tx.sender_id,
          target: tx.receiver_id,
          color: tx.fraud_probability > 0.7 ? '#FF4444' : '#00FF88', // Simplified color logic
          width: 1,
          particles: 0
        })
      })

      setData({
        nodes: Array.from(nodesMap.values()),
        links: links.slice(0, 200) // Limit to avoid performance issues
      })
    }
  }, [history])

  // Listen for new transactions
  useEffect(() => {
    if (latestTransaction) {
      addTransactionToGraph(latestTransaction)
    }
  }, [latestTransaction])
  
  const addTransactionToGraph = useCallback((tx: any) => {
    setData(currentData => {
      const newNodes = [...currentData.nodes]
      const newLinks = [...currentData.links]
      
      // Add Sender Node
      if (!newNodes.find(n => n.id === tx.nameOrig)) {
        newNodes.push({
          id: tx.nameOrig,
          val: 5,
          color: '#ffffff',
          type: 'sender'
        })
      }
      
      // Add Receiver Node
      if (!newNodes.find(n => n.id === tx.nameDest)) {
        newNodes.push({
          id: tx.nameDest,
          val: 5,
          color: '#ffffff',
          type: 'receiver'
        })
      }
      
      // Add Link
      const isFraud = tx.fraud_probability > 0.7
      const isWarn = tx.fraud_probability > 0.3
      
      newLinks.push({
        source: tx.nameOrig,
        target: tx.nameDest,
        color: isFraud ? '#FF4444' : isWarn ? '#FFD700' : '#00FF88',
        width: isFraud ? 3 : 1,
        particles: isFraud ? 4 : 0
      })
      
      // Limit graph size to prevent performance issues (keep last 100 links)
      if (newLinks.length > 100) {
        // Simple slicing (might leave orphaned nodes, but acceptable for demo visualizer)
        const keptLinks = newLinks.slice(-100)
        // Cleanup nodes could be complex, skipping for now
        return { nodes: newNodes, links: keptLinks }
      }
      
      return { nodes: newNodes, links: newLinks }
    })
  }, [])
  
  // TODO: In Task 05, we will connect this to the actual stream.
  // For Task 04, I'll set up the visualizer component.

  return (
    <div className="hud-card border border-white/10 relative overflow-hidden" style={{ height }}>
      <div className="absolute top-0 left-0 p-4 z-10 pointer-events-none">
        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 hud-glow-blue">
          <Icon name="hub" size={24} />
          {language === 'bn' ? 'লাইভ নেটওয়ার্ক গ্রাফ' : 'LIVE NETWORK TOPOLOGY'}
        </h3>
        <p className="text-xs text-text-secondary font-mono mt-1">
          {data.nodes.length} {language === 'bn' ? 'নোড' : 'NODES'} | {data.links.length} {language === 'bn' ? 'লিঙ্ক' : 'EDGES'}
        </p>
      </div>
      
      <div className="scanline" />
      
      <ForceGraph2D
        ref={fgRef}
        width={undefined} // Auto-width
        height={height}
        graphData={data}
        nodeLabel="id"
        nodeRelSize={6}
        nodeColor="color"
        linkColor="color"
        linkWidth="width"
        linkDirectionalParticles="particles"
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={4}
        backgroundColor="#00000000" // Transparent
        cooldownTicks={100}
        onEngineStop={() => fgRef.current.zoomToFit(400)}
      />
      
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
