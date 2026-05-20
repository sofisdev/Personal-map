'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '@/lib/session-context'
import {
  createNode, updateNode, deleteNode,
  createEdge, deleteEdge,
  upsertConfig, bulkUpdatePositions, clearPositions,
  insertTemplate,
} from '@/lib/write-ops'
import ConnectScreen from '@/components/ConnectScreen'
import { MapNode, MapEdge, MapConfig, NodeType, NODE_TYPE_COLORS } from '@/lib/types'

const GraphViewer = dynamic(() => import('@/components/GraphViewer'), { ssr: false })

type Panel = 'config' | 'nodes' | 'edges' | 'templates'

const NODE_TYPES: NodeType[] = ['core', 'skill', 'project', 'value', 'custom']

export default function EditPage() {
  const { session, anonClient, serviceClient, disconnect } = useSession()

  const [nodes, setNodes] = useState<MapNode[]>([])
  const [edges, setEdges] = useState<MapEdge[]>([])
  const [config, setConfig] = useState<MapConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>('nodes')
  const [editingNode, setEditingNode] = useState<MapNode | null>(null)
  const [showNodeForm, setShowNodeForm] = useState(false)
  const [showEdgeForm, setShowEdgeForm] = useState(false)
  const [showTemplateConfirm, setShowTemplateConfirm] = useState<'developer' | 'creative' | 'blank' | null>(null)
  const [saving, setSaving] = useState(false)

  // Fetch initial data
  useEffect(() => {
    if (!anonClient) return
    setLoading(true)

    async function fetchData() {
      try {
        const [nodesRes, edgesRes, configRes] = await Promise.all([
          anonClient!.from('nodes').select('*').order('created_at'),
          anonClient!.from('edges').select('*'),
          anonClient!.from('map_config').select('*').limit(1).single(),
        ])
        if (nodesRes.error) throw nodesRes.error
        if (edgesRes.error) throw edgesRes.error
        setNodes(nodesRes.data as MapNode[])
        setEdges(edgesRes.data as MapEdge[])
        if (!configRes.error) setConfig(configRes.data as MapConfig)
        // Empty DB → show templates
        if ((nodesRes.data as MapNode[]).length === 0) setActivePanel('templates')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [anonClient])

  const handlePositionsStable = useCallback(
    async (positions: { id: string; x: number; y: number; z: number }[]) => {
      if (!serviceClient) return
      try { await bulkUpdatePositions(serviceClient, positions) } catch { /* ignore */ }
    },
    [serviceClient]
  )

  // ── Node mutations ────────────────────────────────────────────────
  async function handleCreateNode(data: Omit<MapNode, 'id' | 'created_at'>) {
    if (!serviceClient) return
    setSaving(true)
    try {
      const node = await createNode(serviceClient, data)
      setNodes((prev) => [...prev, node])
      setShowNodeForm(false)
      setEditingNode(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create node')
    } finally { setSaving(false) }
  }

  async function handleUpdateNode(id: string, data: Partial<Omit<MapNode, 'id' | 'created_at'>>) {
    if (!serviceClient) return
    setSaving(true)
    try {
      const node = await updateNode(serviceClient, id, data)
      setNodes((prev) => prev.map((n) => n.id === id ? node : n))
      setEditingNode(null)
      setShowNodeForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update node')
    } finally { setSaving(false) }
  }

  async function handleDeleteNode(id: string) {
    if (!serviceClient) return
    setSaving(true)
    try {
      await deleteNode(serviceClient, id)
      setNodes((prev) => prev.filter((n) => n.id !== id))
      setEdges((prev) => prev.filter((e) => e.source_id !== id && e.target_id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete node')
    } finally { setSaving(false) }
  }

  // ── Edge mutations ───────────────────────────────────────────────
  async function handleCreateEdge(data: Omit<MapEdge, 'id' | 'created_at'>) {
    if (!serviceClient) return
    setSaving(true)
    try {
      const edge = await createEdge(serviceClient, data)
      setEdges((prev) => [...prev, edge])
      setShowEdgeForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create edge')
    } finally { setSaving(false) }
  }

  async function handleDeleteEdge(id: string) {
    if (!serviceClient) return
    try {
      await deleteEdge(serviceClient, id)
      setEdges((prev) => prev.filter((e) => e.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete edge')
    }
  }

  // ── Config mutations ─────────────────────────────────────────────
  async function handleConfigChange(patch: Partial<Omit<MapConfig, 'id' | 'updated_at'>>) {
    if (!serviceClient) return
    const optimistic = config ? { ...config, ...patch } : (patch as MapConfig)
    setConfig(optimistic)
    try {
      const updated = await upsertConfig(serviceClient, patch)
      setConfig(updated)
    } catch { /* revert is complex, just keep optimistic */ }
  }

  // ── Templates ───────────────────────────────────────────────────
  async function handleInsertTemplate(name: 'developer' | 'creative' | 'blank') {
    if (!serviceClient) return
    setSaving(true)
    try {
      await insertTemplate(serviceClient, name)
      // Reload
      const [nodesRes, edgesRes] = await Promise.all([
        anonClient!.from('nodes').select('*').order('created_at'),
        anonClient!.from('edges').select('*'),
      ])
      if (!nodesRes.error) setNodes(nodesRes.data as MapNode[])
      if (!edgesRes.error) setEdges(edgesRes.data as MapEdge[])
      setShowTemplateConfirm(null)
      setActivePanel('nodes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to insert template')
    } finally { setSaving(false) }
  }

  // ── Reset physics ───────────────────────────────────────────────
  async function handleResetPhysics() {
    if (!serviceClient) return
    try {
      await clearPositions(serviceClient)
      setNodes((prev) => prev.map((n) => ({ ...n, position_x: null, position_y: null, position_z: null })))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset positions')
    }
  }

  if (!session) return <ConnectScreen onConnected={() => {}} />
  if (!serviceClient) return <ServiceKeyPrompt />

  return (
    <div className="flex h-screen bg-[#050510] text-white overflow-hidden">
      {/* ── Left panel ─────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-[#0a0a1a] border-r border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">← View</Link>
          <span className="text-xs text-white/30">Editor</span>
          <button onClick={disconnect} className="text-white/30 hover:text-white/60 text-xs transition-colors">
            Disconnect
          </button>
        </div>

        {/* Panel tabs */}
        <div className="flex border-b border-white/10">
          {(['nodes', 'edges', 'config', 'templates'] as Panel[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePanel(p)}
              className={`flex-1 py-2 text-xs capitalize transition-colors ${
                activePanel === p ? 'text-white border-b-2 border-white/60' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-3 text-red-400 text-xs bg-red-400/10 rounded px-2 py-1.5">
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-400/60 hover:text-red-400">✕</button>
            </div>
          )}

          {/* ── Nodes panel ── */}
          {activePanel === 'nodes' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40">{nodes.length} nodes</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetPhysics}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                    title="Reset simulation positions"
                  >
                    Reset physics
                  </button>
                  <button
                    onClick={() => { setEditingNode(null); setShowNodeForm(true) }}
                    className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {showNodeForm && (
                <NodeForm
                  node={editingNode}
                  onSubmit={(data) => editingNode ? handleUpdateNode(editingNode.id, data) : handleCreateNode(data as Omit<MapNode, 'id' | 'created_at'>)}
                  onCancel={() => { setShowNodeForm(false); setEditingNode(null) }}
                  saving={saving}
                />
              )}

              {nodes.map((node) => (
                <div key={node.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.color ?? NODE_TYPE_COLORS[node.type as NodeType ?? 'custom'] ?? '#a78bfa' }}
                  />
                  <span className="text-sm flex-1 truncate">{node.label}</span>
                  <span className="text-xs text-white/20">{node.type}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button
                      onClick={() => { setEditingNode(node); setShowNodeForm(true) }}
                      className="text-white/40 hover:text-white text-xs px-1"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="text-red-400/40 hover:text-red-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Edges panel ── */}
          {activePanel === 'edges' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40">{edges.length} edges</span>
                <button
                  onClick={() => setShowEdgeForm(true)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                >
                  + Add
                </button>
              </div>

              {showEdgeForm && (
                <EdgeForm
                  nodes={nodes}
                  onSubmit={handleCreateEdge}
                  onCancel={() => setShowEdgeForm(false)}
                  saving={saving}
                />
              )}

              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source_id)
                const tgt = nodes.find((n) => n.id === edge.target_id)
                return (
                  <div key={edge.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-sm flex-1 truncate text-white/70">
                      {src?.label ?? '?'} → {tgt?.label ?? '?'}
                    </span>
                    <span className="text-xs text-white/20">{edge.strength.toFixed(1)}</span>
                    <button
                      onClick={() => handleDeleteEdge(edge.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400/40 hover:text-red-400 text-xs px-1 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Config panel ── */}
          {activePanel === 'config' && (
            <div className="space-y-4">
              <ConfigForm config={config} onChange={handleConfigChange} />
            </div>
          )}

          {/* ── Templates panel ── */}
          {activePanel === 'templates' && (
            <div className="space-y-3">
              <p className="text-xs text-white/40 mb-4">
                {nodes.length === 0
                  ? 'Your map is empty. Start with a template or add nodes manually.'
                  : 'Warning: applying a template will replace all existing nodes and edges.'}
              </p>

              {(['developer', 'creative', 'blank'] as const).map((name) => (
                <button
                  key={name}
                  onClick={() => setShowTemplateConfirm(name)}
                  className="w-full p-3 rounded-lg border border-white/10 hover:bg-white/5 text-left transition-colors"
                >
                  <p className="text-sm font-medium capitalize">{name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {name === 'developer' && 'Skills, projects, and values for a developer'}
                    {name === 'creative' && 'Skills, works, and values for a creative'}
                    {name === 'blank' && 'Start with just a core "Me" node'}
                  </p>
                </button>
              ))}

              <AnimatePresence>
                {showTemplateConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="bg-[#0d0d20] border border-white/10 rounded-xl p-6 max-w-sm w-full"
                    >
                      <p className="text-sm mb-4">
                        Apply <strong className="capitalize">{showTemplateConfirm}</strong> template?
                        {nodes.length > 0 && ' This will delete all existing nodes and edges.'}
                      </p>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => setShowTemplateConfirm(null)}
                          className="text-sm text-white/40 hover:text-white px-3 py-1.5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleInsertTemplate(showTemplateConfirm)}
                          disabled={saving}
                          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Applying…' : 'Apply'}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {saving && (
          <div className="px-4 py-2 border-t border-white/10 text-xs text-white/30 animate-pulse">Saving…</div>
        )}
      </div>

      {/* ── Right panel: live preview ────────────────── */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="text-white/30 text-sm animate-pulse">Loading…</div>
          </div>
        )}
        <GraphViewer
          nodes={nodes}
          edges={edges}
          onPositionsStable={handlePositionsStable}
          editMode
        />
      </div>
    </div>
  )
}

// ── ServiceKeyPrompt ──────────────────────────────────────────────

function ServiceKeyPrompt() {
  const { session, connect } = useSession()
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) { setError('Service role key is required'); return }
    connect({ ...session!, serviceKey: trimmed })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] px-4">
      <div className="w-full max-w-sm bg-[#0d0d20]/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Enter service role key</h2>
        <p className="text-white/40 text-sm mb-6">
          Required for write access. Found in your Supabase project under{' '}
          <span className="text-white/60">Settings → API → service_role secret</span>.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="eyJ…"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(null) }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-white/30 placeholder:text-white/20"
          />
          <p className="text-xs text-amber-400/70">
            Stored in sessionStorage only — cleared when this tab closes.
          </p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-colors"
          >
            Unlock editor
          </button>
        </form>
        <Link href="/" className="block mt-4 text-xs text-white/30 hover:text-white/60 transition-colors text-center">
          ← Back to viewer
        </Link>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

interface NodeFormProps {
  node: MapNode | null
  onSubmit: (data: Omit<MapNode, 'id' | 'created_at'>) => void
  onCancel: () => void
  saving: boolean
}

function NodeForm({ node, onSubmit, onCancel, saving }: NodeFormProps) {
  const [label, setLabel] = useState(node?.label ?? '')
  const [type, setType] = useState<NodeType>(node?.type ?? 'custom')
  const [description, setDescription] = useState(node?.description ?? '')
  const [url, setUrl] = useState(node?.url ?? '')
  const [color, setColor] = useState(node?.color ?? '')
  const [size, setSize] = useState(node?.size ?? 1)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      label,
      type,
      description: description || null,
      url: url || null,
      color: color || null,
      size,
      position_x: node?.position_x ?? null,
      position_y: node?.position_y ?? null,
      position_z: node?.position_z ?? null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 rounded-lg p-3 mb-3 space-y-2.5">
      <input
        type="text"
        placeholder="Label *"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30 placeholder:text-white/20"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as NodeType)}
        className="w-full bg-[#0a0a1a] border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30"
      >
        {NODE_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30 placeholder:text-white/20 resize-none"
      />
      <input
        type="url"
        placeholder="URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30 placeholder:text-white/20"
      />
      <div className="flex gap-2 items-center">
        <label className="text-xs text-white/40">Color</label>
        <input
          type="color"
          value={color || '#a78bfa'}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
        />
        <button type="button" onClick={() => setColor('')} className="text-xs text-white/30 hover:text-white/60">
          reset
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-white/40">Size</label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={size}
          onChange={(e) => setSize(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-white/40 w-6">{size.toFixed(1)}</span>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-white/40 hover:text-white px-2 py-1 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : node ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}

interface EdgeFormProps {
  nodes: MapNode[]
  onSubmit: (data: Omit<MapEdge, 'id' | 'created_at'>) => void
  onCancel: () => void
  saving: boolean
}

function EdgeForm({ nodes, onSubmit, onCancel, saving }: EdgeFormProps) {
  const [sourceId, setSourceId] = useState(nodes[0]?.id ?? '')
  const [targetId, setTargetId] = useState(nodes[1]?.id ?? '')
  const [strength, setStrength] = useState(0.5)
  const [label, setLabel] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ source_id: sourceId, target_id: targetId, strength, label: label || null })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 rounded-lg p-3 mb-3 space-y-2.5">
      <select
        value={sourceId}
        onChange={(e) => setSourceId(e.target.value)}
        className="w-full bg-[#0a0a1a] border border-white/10 rounded px-2 py-1.5 text-sm outline-none"
      >
        {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
      </select>
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="w-full bg-[#0a0a1a] border border-white/10 rounded px-2 py-1.5 text-sm outline-none"
      >
        {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
      </select>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-white/40">Strength</label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.1}
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-xs text-white/40 w-6">{strength.toFixed(1)}</span>
      </div>
      <input
        type="text"
        placeholder="Label (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none placeholder:text-white/20"
      />
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="text-xs text-white/40 hover:text-white px-2 py-1 transition-colors">Cancel</button>
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

interface ConfigFormProps {
  config: MapConfig | null
  onChange: (patch: Partial<Omit<MapConfig, 'id' | 'updated_at'>>) => void
}

function ConfigForm({ config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Title</label>
        <input
          type="text"
          defaultValue={config?.title ?? ''}
          onBlur={(e) => onChange({ title: e.target.value })}
          placeholder="My Map"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30 placeholder:text-white/20"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Subtitle</label>
        <input
          type="text"
          defaultValue={config?.subtitle ?? ''}
          onBlur={(e) => onChange({ subtitle: e.target.value })}
          placeholder="A short description"
          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm outline-none focus:border-white/30 placeholder:text-white/20"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Primary Color</label>
        <input
          type="color"
          defaultValue={config?.theme?.primaryColor ?? '#6366f1'}
          onBlur={(e) => onChange({ theme: { ...config?.theme, primaryColor: e.target.value, accentColor: config?.theme?.accentColor ?? '#a78bfa', bgStyle: config?.theme?.bgStyle ?? 'dark' } })}
          className="w-full h-9 rounded cursor-pointer bg-transparent border border-white/10"
        />
      </div>
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest block mb-1.5">Accent Color</label>
        <input
          type="color"
          defaultValue={config?.theme?.accentColor ?? '#a78bfa'}
          onBlur={(e) => onChange({ theme: { primaryColor: config?.theme?.primaryColor ?? '#6366f1', accentColor: e.target.value, bgStyle: config?.theme?.bgStyle ?? 'dark' } })}
          className="w-full h-9 rounded cursor-pointer bg-transparent border border-white/10"
        />
      </div>
    </div>
  )
}
