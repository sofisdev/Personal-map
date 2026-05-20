export type NodeType = 'core' | 'skill' | 'project' | 'value' | 'custom'

export interface MapNode {
  id: string
  label: string
  type: NodeType | null
  description: string | null
  url: string | null
  color: string | null
  size: number
  position_x: number | null
  position_y: number | null
  position_z: number | null
  created_at: string
}

export interface MapEdge {
  id: string
  source_id: string
  target_id: string
  strength: number
  label: string | null
  created_at: string
}

export interface MapConfig {
  id: string
  title: string | null
  subtitle: string | null
  theme: {
    primaryColor: string
    accentColor: string
    bgStyle: string
  } | null
  physics: {
    linkDistance: number
    chargeStrength: number
    alphaDecay: number
  } | null
  updated_at: string
}

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  core: '#ffffff',
  skill: '#60a5fa',
  project: '#34d399',
  value: '#f472b6',
  custom: '#a78bfa',
}
