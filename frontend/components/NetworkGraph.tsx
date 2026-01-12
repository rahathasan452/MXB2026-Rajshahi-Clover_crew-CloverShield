import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'
import { RiskLegend } from './RiskLegend'

// ... (dynamic import etc)

interface GraphNode {
  id: string
  val: number // size
  color: string
  type: 'sender' | 'receiver'
  riskScore: number
}

// ... (keep GraphLink etc)

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

  // Initialize from history
  useEffect(() => {
    if (history.length > 0) {
      const nodesMap = new Map<string, GraphNode>()
      const links: GraphLink[] = []

      // First pass: Calculate risk scores
      const nodeRisks = new Map<string, number>()
      history.forEach(tx => {
         const p = tx.fraud_probability || 0
         nodeRisks.set(tx.sender_id, Math.max(nodeRisks.get(tx.sender_id) || 0, p))
         nodeRisks.set(tx.receiver_id, Math.max(nodeRisks.get(tx.receiver_id) || 0, p))
      })

      history.forEach(tx => {
        // Add Sender
        if (!nodesMap.has(tx.sender_id)) {
          const risk = nodeRisks.get(tx.sender_id) || 0
          nodesMap.set(tx.sender_id, {
            id: tx.sender_id,
            val: 4 + (risk * 2), // Slightly larger if high risk
            color: getNodeColor(risk, 'sender'),
            type: 'sender',
            riskScore: risk
          })
        }
        
        // Add Receiver
        if (!nodesMap.has(tx.receiver_id)) {
          const risk = nodeRisks.get(tx.receiver_id) || 0
          nodesMap.set(tx.receiver_id, {
            id: tx.receiver_id,
            val: 4 + (risk * 2),
            color: getNodeColor(risk, 'receiver'),
            type: 'receiver',
            riskScore: risk
          })
        }

        // Add Link
        const isFraud = tx.fraud_probability > 0.7
        const isWarn = tx.fraud_probability > 0.3
        
        links.push({
          source: tx.sender_id,
          target: tx.receiver_id,
          color: isFraud ? '#EF4444' : isWarn ? '#F59E0B' : '#22D3EE',
          width: isFraud ? 4 : 2,
          particles: isFraud ? 4 : 0
        })
      })

      setData({
        nodes: Array.from(nodesMap.values()),
        links: links.slice(0, 200) 
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
      const p = tx.fraud_probability || 0
      
      // Update or Add Sender Node
      const senderIdx = newNodes.findIndex(n => n.id === tx.nameOrig)
      if (senderIdx === -1) {
        newNodes.push({
          id: tx.nameOrig,
          val: 4 + (p * 2),
          color: getNodeColor(p, 'sender'),
          type: 'sender',
          riskScore: p
        })
      } else {
        // Update risk if new txn is riskier
        const node = newNodes[senderIdx]
        const newRisk = Math.max(node.riskScore, p)
        if (newRisk > node.riskScore) {
             newNodes[senderIdx] = {
                 ...node,
                 riskScore: newRisk,
                 color: getNodeColor(newRisk, 'sender'),
                 val: 4 + (newRisk * 2)
             }
        }
      }
      
      // Update or Add Receiver Node
      const receiverIdx = newNodes.findIndex(n => n.id === tx.nameDest)
      if (receiverIdx === -1) {
        newNodes.push({
          id: tx.nameDest,
          val: 4 + (p * 2),
          color: getNodeColor(p, 'receiver'),
          type: 'receiver',
          riskScore: p
        })
      } else {
         const node = newNodes[receiverIdx]
         const newRisk = Math.max(node.riskScore, p)
         if (newRisk > node.riskScore) {
             newNodes[receiverIdx] = {
                 ...node,
                 riskScore: newRisk,
                 color: getNodeColor(newRisk, 'receiver'),
                 val: 4 + (newRisk * 2)
             }
         }
      }
      
      // Add Link
      const isFraud = p > 0.7
      const isWarn = p > 0.3
      
      newLinks.push({
        source: tx.nameOrig,
        target: tx.nameDest,
        color: isFraud ? '#EF4444' : isWarn ? '#F59E0B' : '#22D3EE',
        width: isFraud ? 4 : 2,
        particles: isFraud ? 4 : 0
      })
      
      if (newLinks.length > 100) {
        const keptLinks = newLinks.slice(-100)
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
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.3}
        warmupTicks={100}
        cooldownTicks={100}
      />

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
