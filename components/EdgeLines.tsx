'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { MapEdge } from '@/lib/types'

interface PositionedNode {
  id: string
  x: number
  y: number
  z: number
}

interface EdgeLinesProps {
  edges: MapEdge[]
  nodes: PositionedNode[]
}

export default function EdgeLines({ edges, nodes }: EdgeLinesProps) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, PositionedNode>()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const lineObjects = useMemo(() => {
    return edges.map((edge) => {
      const src = nodeMap.get(edge.source_id)
      const tgt = nodeMap.get(edge.target_id)
      if (!src || !tgt) return null

      const points = [
        new THREE.Vector3(src.x, src.y, src.z),
        new THREE.Vector3(tgt.x, tgt.y, tgt.z),
      ]
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: '#6366f1',
        transparent: true,
        opacity: 0.5 + (edge.strength ?? 0.5) * 0.3,
        depthWrite: false,
      })
      const lineObj = new THREE.Line(geo, mat)
      return { key: edge.id, lineObj }
    }).filter(Boolean) as { key: string; lineObj: THREE.Line }[]
  }, [edges, nodeMap])

  return (
    <>
      {lineObjects.map(({ key, lineObj }) => (
        <primitive key={key} object={lineObj} />
      ))}
    </>
  )
}
