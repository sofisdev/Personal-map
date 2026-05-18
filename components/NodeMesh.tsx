'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
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
      const scale = hovered ? 1.2 : 1
      mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={mesh}
        onClick={(e) => { e.stopPropagation(); onClick(node) }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.8}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* glow sprite */}
      <sprite scale={[radius * 4, radius * 4, 1]}>
        <spriteMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </sprite>

      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, radius + 0.5, 0]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          {node.label}
        </Text>
      </Billboard>
    </group>
  )
}
