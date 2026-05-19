'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '@/lib/session-context'
import { createAnonClient } from '@/lib/supabase-session'
import { SupabaseSession } from '@/lib/session'

interface ConnectScreenProps {
  onConnected: () => void
  requireServiceKey?: boolean
}

export default function ConnectScreen({ onConnected, requireServiceKey }: ConnectScreenProps) {
  const { connect } = useSession()
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [serviceKey, setServiceKey] = useState('')
  const [showServiceKey, setShowServiceKey] = useState(!!requireServiceKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedUrl = url.trim().replace(/\/$/, '')
    const trimmedAnon = anonKey.trim()
    const trimmedService = serviceKey.trim()

    if (!trimmedUrl.startsWith('https://')) {
      setError('Project URL must start with https://')
      return
    }
    if (!trimmedAnon) {
      setError('Anon key is required')
      return
    }
    if (requireServiceKey && !trimmedService) {
      setError('Service role key is required to edit')
      return
    }

    setLoading(true)
    try {
      // Validate credentials with a test query
      const testClient = createAnonClient({ url: trimmedUrl, anonKey: trimmedAnon })
      const { error: testError } = await testClient.from('nodes').select('id').limit(1)
      if (testError && testError.code !== 'PGRST116') {
        throw new Error(`Could not connect: ${testError.message}`)
      }

      const session: SupabaseSession = {
        url: trimmedUrl,
        anonKey: trimmedAnon,
        ...(trimmedService ? { serviceKey: trimmedService } : {}),
      }
      connect(session)
      onConnected()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050510] px-4">
      {/* star-like background dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-[#0d0d20]/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Connect your Supabase</h1>
          <p className="text-white/50 text-sm">
            Your credentials stay in this browser tab only — never sent to any server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50 uppercase tracking-widest">Project URL</span>
            <input
              type="url"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 placeholder:text-white/20 transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50 uppercase tracking-widest">Anon Key</span>
            <input
              type="password"
              placeholder="eyJ..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 placeholder:text-white/20 transition-colors font-mono"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-widest">Service Role Key</span>
              {!requireServiceKey && (
                <button
                  type="button"
                  onClick={() => setShowServiceKey((v) => !v)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {showServiceKey ? 'hide' : 'add for edit access'}
                </button>
              )}
            </div>
            {showServiceKey && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input
                  type="password"
                  placeholder="eyJ..."
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 placeholder:text-white/20 transition-colors font-mono"
                />
                <p className="text-xs text-amber-400/70 mt-1.5">
                  Grants full write access. Stored in sessionStorage only — cleared when this tab closes.
                </p>
              </motion.div>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting…' : 'Connect'}
          </button>
        </form>

        <details className="mt-6">
          <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 transition-colors">
            Where do I find these?
          </summary>
          <div className="mt-3 text-xs text-white/40 leading-relaxed space-y-1">
            <p>1. Go to your Supabase project → Settings → API</p>
            <p>2. Copy <strong className="text-white/60">Project URL</strong> and <strong className="text-white/60">anon public</strong> key</p>
            <p>3. For editing, also copy <strong className="text-white/60">service_role secret</strong> key</p>
            <p>4. Run the SQL migrations in <code className="bg-white/10 px-1 rounded">supabase/migrations/</code> if you haven&apos;t yet</p>
          </div>
        </details>
      </motion.div>
    </div>
  )
}
