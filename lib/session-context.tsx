'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  SupabaseSession,
  loadSession,
  saveSession,
  clearSession as clearSessionStorage,
} from './session'
import { createAnonClient, createServiceClient } from './supabase-session'

interface SessionContextValue {
  session: SupabaseSession | null
  anonClient: SupabaseClient | null
  serviceClient: SupabaseClient | null
  connect: (s: SupabaseSession) => void
  disconnect: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null)

  useEffect(() => {
    setSession(loadSession())
  }, [])

  const anonClient = useMemo(
    () => (session ? createAnonClient(session) : null),
    [session]
  )

  const serviceClient = useMemo(
    () => (session?.serviceKey ? createServiceClient(session) : null),
    [session]
  )

  function connect(s: SupabaseSession) {
    saveSession(s)
    setSession(s)
  }

  function disconnect() {
    clearSessionStorage()
    setSession(null)
  }

  return (
    <SessionContext.Provider value={{ session, anonClient, serviceClient, connect, disconnect }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
