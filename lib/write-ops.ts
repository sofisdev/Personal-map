import { SupabaseClient } from '@supabase/supabase-js'
import { MapNode, MapEdge, MapConfig } from './types'
import { getTemplateData } from './templates'

export async function createNode(
  client: SupabaseClient,
  data: Omit<MapNode, 'id' | 'created_at'>
): Promise<MapNode> {
  const { data: row, error } = await client.from('nodes').insert(data).select().single()
  if (error) throw error
  return row as MapNode
}

export async function updateNode(
  client: SupabaseClient,
  id: string,
  patch: Partial<Omit<MapNode, 'id' | 'created_at'>>
): Promise<MapNode> {
  const { data: row, error } = await client.from('nodes').update(patch).eq('id', id).select().single()
  if (error) throw error
  return row as MapNode
}

export async function deleteNode(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('nodes').delete().eq('id', id)
  if (error) throw error
}

export async function createEdge(
  client: SupabaseClient,
  data: Omit<MapEdge, 'id' | 'created_at'>
): Promise<MapEdge> {
  const { data: row, error } = await client.from('edges').insert(data).select().single()
  if (error) throw error
  return row as MapEdge
}

export async function deleteEdge(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('edges').delete().eq('id', id)
  if (error) throw error
}

export async function upsertConfig(
  client: SupabaseClient,
  patch: Partial<Omit<MapConfig, 'id' | 'updated_at'>>
): Promise<MapConfig> {
  const { data: existing } = await client.from('map_config').select('id').limit(1).single()
  const payload = existing ? { ...patch, id: existing.id } : patch
  const { data: row, error } = await client.from('map_config').upsert(payload).select().single()
  if (error) throw error
  return row as MapConfig
}

export async function bulkUpdatePositions(
  client: SupabaseClient,
  positions: { id: string; x: number; y: number; z: number }[]
): Promise<void> {
  if (positions.length === 0) return
  const { error } = await client.from('nodes').upsert(
    positions.map((p) => ({ id: p.id, position_x: p.x, position_y: p.y, position_z: p.z })),
    { onConflict: 'id' }
  )
  if (error) throw error
}

export async function clearPositions(client: SupabaseClient): Promise<void> {
  const { error } = await client
    .from('nodes')
    .update({ position_x: null, position_y: null, position_z: null })
    .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows
  if (error) throw error
}

export async function insertTemplate(
  client: SupabaseClient,
  templateName: 'developer' | 'creative' | 'blank'
): Promise<void> {
  // Clear existing data first
  await client.from('edges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await client.from('nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { nodes, edges } = getTemplateData(templateName)
  if (nodes.length === 0) return

  // Insert nodes and build _id → real UUID map
  const idMap = new Map<string, string>()
  for (const { _id, ...nodeData } of nodes) {
    const { data, error } = await client
      .from('nodes')
      .insert(nodeData)
      .select('id')
      .single()
    if (error) throw error
    idMap.set(_id, data.id)
  }

  // Insert edges with remapped IDs
  if (edges.length > 0) {
    const edgeRows = edges.map((e) => ({
      source_id: idMap.get(e.source)!,
      target_id: idMap.get(e.target)!,
      strength: e.strength,
      label: e.label,
    }))
    const { error } = await client.from('edges').insert(edgeRows)
    if (error) throw error
  }
}
