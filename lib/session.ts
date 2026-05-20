const SESSION_KEY = 'pm_session'

export interface SupabaseSession {
  url: string
  anonKey: string
  serviceKey?: string
}

export function saveSession(s: SupabaseSession): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function loadSession(): SupabaseSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SupabaseSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

export function hasWriteAccess(s: SupabaseSession | null): boolean {
  return !!s?.serviceKey
}
