'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d'
import * as THREE from 'three'
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

// Projects 3D positions to screen coordinates for HTML labels
function Labels({ nodes }: { nodes: SimNode[] }) {
  const { camera, size } = useThree()
  const [screenPositions, setScreenPositions] = useState<{ id: string; x: number; y: number; label: string }[]>([])

  useFrame(() => {
    const positions = nodes.map((node) => {
      const vec = new THREE.Vector3(node.x, node.y, node.z)
      vec.project(camera)
      return {
        id: node.id,
        label: node.label,
        x: (vec.x * 0.5 + 0.5) * size.width,
        y: (-vec.y * 0.5 + 0.5) * size.height - 24,
      }
    })
    setScreenPositions(positions)
  })

  return (
    <group>
      {screenPositions.map((p) => (
        // Labels are rendered as HTML overlays outside this component
        // We attach them to a data store via a side-effect-free mechanism
        <mesh key={p.id} position={[0, 0, -9999]} visible={false}>
          <boxGeometry args={[0, 0, 0]} />
          <meshBasicMaterial />
        </mesh>
      ))}
    </group>
  )
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
  const [labelPositions, setLabelPositions] = useState<{ id: string; x: number; y: number; label: string }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simRef = useRef<any>(null)
  const stableRef = useRef(false)
  const cameraRef = useRef<THREE.Camera | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })

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

  // Update label screen positions on animation frame
  useEffect(() => {
    let rafId: number
    const update = () => {
      if (cameraRef.current && containerRef.current) {
        const { width, height } = sizeRef.current
        const positions = simNodes.map((node) => {
          const vec = new THREE.Vector3(node.x, node.y, node.z)
          vec.project(cameraRef.current!)
          return {
            id: node.id,
            label: node.label,
            x: (vec.x * 0.5 + 0.5) * width,
            y: (-vec.y * 0.5 + 0.5) * height,
          }
        })
        setLabelPositions(positions)
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [simNodes])

  const handleNodeClick = useCallback((node: MapNode) => {
    if (!editMode) setSelectedNode(node)
  }, [editMode])

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 80], fov: 60 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ background: '#050510', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        onCreated={({ camera, size }) => {
          cameraRef.current = camera
          sizeRef.current = size
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[50, 50, 50]} intensity={1.5} />
          <pointLight position={[-50, -50, -50]} intensity={0.5} color="#6366f1" />

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
            onChange={() => {
              // trigger label recalc via camera ref
            }}
          />
        </Suspense>
      </Canvas>

      {/* HTML labels overlaid on canvas */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {labelPositions.map((p) => (
          <div
            key={p.id}
            className="absolute text-white text-xs font-medium whitespace-nowrap select-none"
            style={{
              left: p.x,
              top: p.y - 28,
              transform: 'translateX(-50%)',
              textShadow: '0 0 6px #000, 0 0 12px #000',
            }}
          >
            {p.label}
          </div>
        ))}
      </div>

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
