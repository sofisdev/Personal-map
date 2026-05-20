'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/lib/session-context'
import { bulkUpdatePositions } from '@/lib/write-ops'
import ConnectScreen from '@/components/ConnectScreen'
import { MapNode, MapEdge } from '@/lib/types'

const GraphViewer = dynamic(() => import('@/components/GraphViewer'), { ssr: false })

export default function Home() {
  const { session, anonClient, serviceClient } = useSession()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [edges, setEdges] = useState<MapEdge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!anonClient) return
    setLoading(true)
    setError(null)

    async function fetchData() {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          anonClient!.from('nodes').select('*').order('created_at'),
          anonClient!.from('edges').select('*'),
        ])
        if (nodesRes.error) throw nodesRes.error
        if (edgesRes.error) throw edgesRes.error
        setNodes(nodesRes.data as MapNode[])
        setEdges(edgesRes.data as MapEdge[])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [anonClient])

  async function handlePositionsStable(positions: { id: string; x: number; y: number; z: number }[]) {
    if (!serviceClient) return
    try {
      await bulkUpdatePositions(serviceClient, positions)
    } catch {
      // silently ignore position save failures
    }
  }

  if (!session) {
    return <ConnectScreen onConnected={() => {}} />
  }

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="text-white/30 text-sm animate-pulse">Loading…</div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <GraphViewer
        nodes={nodes}
        edges={edges}
        onPositionsStable={handlePositionsStable}
      />

      <Link
        href="/edit"
        className="fixed bottom-6 left-6 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors"
      >
        Edit ✏
      </Link>
    </main>
  )
}
