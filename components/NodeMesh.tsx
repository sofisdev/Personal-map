'use client'

import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MapNode, NODE_TYPE_COLORS } from '@/lib/types'

interface NodeMeshProps {
  node: MapNode & { x: number; y: number; z: number }
  onClick: (node: MapNode) => void
}

export default function NodeMesh({ node, onClick }: NodeMeshProps) {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const color = node.color ?? NODE_TYPE_COLORS[(node.type as keyof typeof NODE_TYPE_COLORS) ?? 'custom'] ?? '#a78bfa'
  const radius = 0.6 * (node.size ?? 1)

  useFrame(() => {
    if (mesh.current) {
      const target = hovered ? 1.2 : 1
      mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onClick(node) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2 : 1}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* glow halo */}
      <sprite scale={[radius * 5, radius * 5, 1]}>
        <spriteMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </sprite>
    </group>
  )
}
