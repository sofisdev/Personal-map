import dynamic from 'next/dynamic'
import { MapNode, MapEdge } from '@/lib/types'

// Dynamically import to avoid SSR issues with Three.js
const GraphViewer = dynamic(() => import('@/components/GraphViewer'), { ssr: false })

// Hardcoded test data — will be replaced with Supabase fetch in Step 4
const TEST_NODES: MapNode[] = [
  {
    id: 'node-1',
    label: 'Me',
    type: 'core',
    description: 'The center of this map.',
    url: null,
    color: null,
    size: 2,
    position_x: null,
    position_y: null,
    position_z: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'node-2',
    label: 'TypeScript',
    type: 'skill',
    description: 'Typed superset of JavaScript.',
    url: 'https://www.typescriptlang.org',
    color: null,
    size: 1.2,
    position_x: null,
    position_y: null,
    position_z: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'node-3',
    label: 'Open Source',
    type: 'value',
    description: 'Building in the open.',
    url: null,
    color: null,
    size: 1,
    position_x: null,
    position_y: null,
    position_z: null,
    created_at: new Date().toISOString(),
  },
]

const TEST_EDGES: MapEdge[] = [
  {
    id: 'edge-1',
    source_id: 'node-1',
    target_id: 'node-2',
    strength: 0.8,
    label: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'edge-2',
    source_id: 'node-1',
    target_id: 'node-3',
    strength: 0.6,
    label: null,
    created_at: new Date().toISOString(),
  },
]

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
      <GraphViewer nodes={TEST_NODES} edges={TEST_EDGES} />
    </main>
  )
}
