import React, { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { Icon } from './Icon'
import { RiskLegend } from './RiskLegend'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface GraphNode {
  id: string
  val: number // size
  color: string
  type: 'sender' | 'receiver'
  riskScore: number
  isMule?: boolean
  community?: string
}

// ... (keep getNodeColor)

const MULE_THRESHOLD = 5 // Nodes with > 5 unique neighbors are flagged as potential stars/mules

const runCommunityDetection = (nodes: GraphNode[], links: GraphLink[]) => {
    // Label Propagation Algorithm
    const labels = new Map<string, string>()
    const adj = new Map<string, string[]>()
    
    nodes.forEach(n => {
        labels.set(n.id, n.id)
        adj.set(n.id, [])
    })
    
    links.forEach(l => {
        const src = typeof l.source === 'string' ? l.source : (l.source as any).id
        const tgt = typeof l.target === 'string' ? l.target : (l.target as any).id
        if (adj.has(src)) adj.get(src)!.push(tgt)
        if (adj.has(tgt)) adj.get(tgt)!.push(src)
    })
    
    // Iterate 5 times (sufficient for small graphs)
    for (let i = 0; i < 5; i++) {
        const nodeIds = nodes.map(n => n.id).sort(() => Math.random() - 0.5)
        nodeIds.forEach(nodeId => {
            const neighbors = adj.get(nodeId) || []
            if (neighbors.length === 0) return
            
            const neighborLabels = neighbors.map(n => labels.get(n)!)
            const counts = new Map<string, number>()
            let maxCount = 0
            let bestLabel = labels.get(nodeId)!
            
            neighborLabels.forEach(l => {
                const c = (counts.get(l) || 0) + 1
                counts.set(l, c)
                if (c > maxCount) {
                    maxCount = c
                    bestLabel = l
                }
            })
            labels.set(nodeId, bestLabel)
        })
    }
    
    return labels
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
  const [showAI, setShowAI] = useState(true)

  // Initialize from history
  useEffect(() => {
    if (history.length > 0) {
      const nodesMap = new Map<string, GraphNode>()
      const links: GraphLink[] = []

      // First pass: Calculate risk scores and degree centrality
      const nodeRisks = new Map<string, number>()
      const nodeNeighbors = new Map<string, Set<string>>()

      history.forEach(tx => {
        const p = tx.fraud_probability || 0
        nodeRisks.set(tx.sender_id, Math.max(nodeRisks.get(tx.sender_id) || 0, p))
        nodeRisks.set(tx.receiver_id, Math.max(nodeRisks.get(tx.receiver_id) || 0, p))

        if (!nodeNeighbors.has(tx.sender_id)) nodeNeighbors.set(tx.sender_id, new Set())
        if (!nodeNeighbors.has(tx.receiver_id)) nodeNeighbors.set(tx.receiver_id, new Set())
        nodeNeighbors.get(tx.sender_id)!.add(tx.receiver_id)
        nodeNeighbors.get(tx.receiver_id)!.add(tx.sender_id)
      })

      history.forEach(tx => {
        // Add Sender
        if (!nodesMap.has(tx.sender_id)) {
          const risk = nodeRisks.get(tx.sender_id) || 0
          const neighborCount = nodeNeighbors.get(tx.sender_id)?.size || 0
          nodesMap.set(tx.sender_id, {
            id: tx.sender_id,
            val: 4 + (risk * 2), 
            color: getNodeColor(risk, 'sender'),
            type: 'sender',
            riskScore: risk,
            isMule: neighborCount >= MULE_THRESHOLD
          })
        }
        
        // Add Receiver
        if (!nodesMap.has(tx.receiver_id)) {
          const risk = nodeRisks.get(tx.receiver_id) || 0
          const neighborCount = nodeNeighbors.get(tx.receiver_id)?.size || 0
          nodesMap.set(tx.receiver_id, {
            id: tx.receiver_id,
            val: 4 + (risk * 2),
            color: getNodeColor(risk, 'receiver'),
            type: 'receiver',
            riskScore: risk,
            isMule: neighborCount >= MULE_THRESHOLD
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

      const updatedNodes = Array.from(nodesMap.values())
      const communityLabels = runCommunityDetection(updatedNodes, links)
      updatedNodes.forEach(n => {
          n.community = communityLabels.get(n.id)
      })

      setData({
        nodes: updatedNodes,
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
      
      // We need to re-calculate isMule for these nodes
      const updateNodeMuleStatus = (nodeId: string) => {
          const neighbors = new Set<string>()
          newLinks.forEach(l => {
              const src = typeof l.source === 'string' ? l.source : (l.source as any).id
              const tgt = typeof l.target === 'string' ? l.target : (l.target as any).id
              if (src === nodeId) neighbors.add(tgt)
              if (tgt === nodeId) neighbors.add(src)
          })
          return neighbors.size >= MULE_THRESHOLD
      }

      // Add Link first so degree calculation is accurate
      newLinks.push({
        source: tx.nameOrig,
        target: tx.nameDest,
        color: p > 0.7 ? '#EF4444' : p > 0.3 ? '#F59E0B' : '#22D3EE',
        width: p > 0.7 ? 4 : 2,
        particles: p > 0.7 ? 4 : 0
      })

      // Update or Add Sender Node
      const senderIdx = newNodes.findIndex(n => n.id === tx.nameOrig)
      if (senderIdx === -1) {
        newNodes.push({
          id: tx.nameOrig,
          val: 4 + (p * 2),
          color: getNodeColor(p, 'sender'),
          type: 'sender',
          riskScore: p,
          isMule: updateNodeMuleStatus(tx.nameOrig)
        })
      } else {
        const node = newNodes[senderIdx]
        const newRisk = Math.max(node.riskScore, p)
        newNodes[senderIdx] = {
          ...node,
          riskScore: newRisk,
          color: getNodeColor(newRisk, 'sender'),
          val: 4 + (newRisk * 2),
          isMule: updateNodeMuleStatus(tx.nameOrig)
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
          riskScore: p,
          isMule: updateNodeMuleStatus(tx.nameDest)
        })
      } else {
        const node = newNodes[receiverIdx]
        const newRisk = Math.max(node.riskScore, p)
        newNodes[receiverIdx] = {
          ...node,
          riskScore: newRisk,
          color: getNodeColor(newRisk, 'receiver'),
          val: 4 + (newRisk * 2),
          isMule: updateNodeMuleStatus(tx.nameDest)
        }
      }
      
      // Re-run community detection on update
      const communityLabels = runCommunityDetection(newNodes, newLinks)
      newNodes.forEach(n => {
          n.community = communityLabels.get(n.id)
      })

      if (newLinks.length > 100) {
        const keptLinks = newLinks.slice(-100)
        return { nodes: newNodes, links: keptLinks }
      }
      
      return { nodes: newNodes, links: newLinks }
    })
  }, [])  // TODO: In Task 05, we will connect this to the actual stream.
  useEffect(() => {
    if (fgRef.current) {
      // Increase repulsion (charge) to separate nodes more
      fgRef.current.d3Force('charge').strength(-150)
      // Increase link distance
      fgRef.current.d3Force('link').distance(50)
    }
  }, [data])

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

        {/* AI Toggle */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
             {language === 'bn' ? 'এআই প্যাটার্ন' : 'AI Patterns'}
           </span>
           <button 
             onClick={() => setShowAI(!showAI)}
             className={`w-8 h-4 rounded-full transition-all relative ${showAI ? 'bg-emerald-500' : 'bg-slate-700'}`}
           >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showAI ? 'left-4.5' : 'left-0.5'}`} />
           </button>
        </div>
      </div>

      <div className="scanline" />

      <ForceGraph2D
        ref={fgRef}
        width={undefined} // Auto-width
        height={height}
        graphData={data}
        nodeLabel="id"
        nodeRelSize={6}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.id
          const fontSize = 12/globalScale
          ctx.font = `${fontSize}px Sans-Serif`

          // Highlighting for Mules - only if AI is enabled
          if (showAI && node.isMule) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)' // Red glow
            ctx.fill()
            ctx.strokeStyle = '#EF4444'
            ctx.setLineDash([2, 2])
            ctx.lineWidth = 1/globalScale
            ctx.stroke()
            ctx.setLineDash([])
          }

          // Main Node Circle
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
          ctx.fillStyle = showAI ? node.color : (node.type === 'sender' ? '#60A5FA' : '#F472B6')
          ctx.fill()
          
          // Border for high risk - only if AI is enabled
          if (showAI && node.riskScore > 0.7) {
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2/globalScale
            ctx.stroke()
          }

          // Label
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.fillText(label, node.x, node.y + node.val + 5)
        }}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false)
          ctx.fill()
        }}
        linkColor="color"
        linkWidth="width"
        linkDirectionalParticles="particles"
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={4}
        backgroundColor="#00000000" // Transparent
        d3AlphaDecay={0.03}
        d3VelocityDecay={0.4}
        warmupTicks={200}
        cooldownTicks={150}
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
