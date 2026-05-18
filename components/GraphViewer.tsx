'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d'
import { MapNode, MapEdge } from '@/lib/types'
import NodeMesh from './NodeMesh'
import EdgeLines from './EdgeLines'
import StarField from './StarField'
import NodeDrawer from './NodeDrawer'

interface SimNode extends MapNode {
  x: number
  y: number
  z: number
  vx?: number
  vy?: number
  vz?: number
}

interface GraphViewerProps {
  nodes: MapNode[]
  edges: MapEdge[]
  onPositionsStable?: (positions: { id: string; x: number; y: number; z: number }[]) => void
  editMode?: boolean
}

export default function GraphViewer({ nodes, edges, onPositionsStable, editMode }: GraphViewerProps) {
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simRef = useRef<any>(null)
  const stableRef = useRef(false)

  const hasSavedPositions = nodes.length > 0 && nodes[0].position_x != null

  useEffect(() => {
    if (nodes.length === 0) return

    const initial: SimNode[] = nodes.map((n) => ({
      ...n,
      x: n.position_x ?? (Math.random() - 0.5) * 30,
      y: n.position_y ?? (Math.random() - 0.5) * 30,
      z: n.position_z ?? (Math.random() - 0.5) * 30,
    }))

    if (hasSavedPositions) {
      setSimNodes(initial)
      return
    }

    stableRef.current = false
    const sim = forceSimulation(initial)
      .numDimensions(3)
      .force('link', forceLink(
        edges.map((e) => ({ source: e.source_id, target: e.target_id, strength: e.strength }))
      ).id((d: SimNode) => d.id).distance(30).strength(0.4))
      .force('charge', forceManyBody().strength(-80))
      .force('center', forceCenter())
      .alpha(1)
      .alphaDecay(0.02)

    simRef.current = sim

    sim.on('tick', () => {
      setSimNodes([...sim.nodes() as SimNode[]])
    })

    sim.on('end', () => {
      if (!stableRef.current) {
        stableRef.current = true
        const positions = (sim.nodes() as SimNode[]).map((n) => ({ id: n.id, x: n.x, y: n.y, z: n.z }))
        onPositionsStable?.(positions)
      }
    })

    return () => { sim.stop() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.map((n) => n.id).join(',')])

  const handleNodeClick = useCallback((node: MapNode) => {
    if (!editMode) setSelectedNode(node)
  }, [editMode])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 80], fov: 60 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ background: '#050510' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[50, 50, 50]} intensity={1} />

          <StarField />

          <EdgeLines edges={edges} nodes={simNodes} />

          {simNodes.map((node) => (
            <NodeMesh key={node.id} node={node} onClick={handleNodeClick} />
          ))}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            enableDamping
            dampingFactor={0.05}
            touches={{ ONE: 2, TWO: 1 }}
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              intensity={1.5}
              radius={0.8}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {!editMode && (
        <NodeDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}

      {!editMode && (
        <button
          className="fixed bottom-6 right-6 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          onClick={() => {
            const canvas = document.querySelector('canvas')
            if (!canvas) return
            const link = document.createElement('a')
            link.download = 'map.png'
            link.href = canvas.toDataURL('image/png')
            link.click()
          }}
        >
          Download ↓
        </button>
      )}
    </div>
  )
}
