// ---------------------------------------------------------------------------
// queryCache.js — Lightweight in-memory + sessionStorage query caching
// ---------------------------------------------------------------------------

const memoryCache = new Map()
const DEFAULT_TTL_MS = 3 * 60 * 1000 // 3 minutes

export const queryCache = {
  get(key) {
    const now = Date.now()

    // 1. Check memory cache first
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key)
      if (entry.expiresAt > now) {
        return entry.data
      }
      memoryCache.delete(key)
    }

    // 2. Check sessionStorage fallback
    try {
      const stored = sessionStorage.getItem(`qc_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.expiresAt > now) {
          memoryCache.set(key, parsed)
          return parsed.data
        }
        sessionStorage.removeItem(`qc_${key}`)
      }
    } catch {
      // sessionStorage unavailable or quota exceeded
    }

    return null
  },

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    const entry = {
      data,
      expiresAt: Date.now() + ttlMs,
    }

    memoryCache.set(key, entry)

    try {
      sessionStorage.setItem(`qc_${key}`, JSON.stringify(entry))
    } catch {
      // ignore storage error
    }
  },

  invalidate(prefixOrKey) {
    // Invalidate in memory
    for (const key of memoryCache.keys()) {
      if (!prefixOrKey || key.includes(prefixOrKey)) {
        memoryCache.delete(key)
      }
    }

    // Invalidate in sessionStorage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('qc_') && (!prefixOrKey || k.includes(prefixOrKey))) {
          sessionStorage.removeItem(k)
        }
      }
    } catch {
      // ignore
    }
  },

  clear() {
    memoryCache.clear()
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('qc_')) {
          sessionStorage.removeItem(k)
        }
      }
    } catch {
      // ignore
    }
  },
}

export default queryCache
