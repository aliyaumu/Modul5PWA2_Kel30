// ---------------------------------------------------------------------------
// queryCache.js — Lightweight in-memory + sessionStorage query caching
// Features colored DevTools console logging and reactive event notifications
// ---------------------------------------------------------------------------

const memoryCache = new Map()
const DEFAULT_TTL_MS = 3 * 60 * 1000 // 3 minutes

export const queryCache = {
  lastHit: false,
  lastHitKey: null,
  lastHitTime: null,

  get(key) {
    const now = Date.now()

    // 1. Check memory cache first
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key)
      if (entry.expiresAt > now) {
        this.lastHit = true
        this.lastHitKey = key
        this.lastHitTime = entry.cachedAt || now
        console.info(
          `%c[QueryCache] 🟢 HIT: Mengambil data dari Cache (tanpa request server)\nKey: ${key}`,
          'background: #e8f8f5; color: #1e8449; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
          entry.data,
        )
        window.dispatchEvent(
          new CustomEvent('query_cache_event', {
            detail: { type: 'HIT', key, cachedAt: entry.cachedAt },
          }),
        )
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
          this.lastHit = true
          this.lastHitKey = key
          this.lastHitTime = parsed.cachedAt || now
          console.info(
            `%c[QueryCache] 🟢 HIT (SessionStorage): Mengambil dari Cache\nKey: ${key}`,
            'background: #e8f8f5; color: #1e8449; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
            parsed.data,
          )
          window.dispatchEvent(
            new CustomEvent('query_cache_event', {
              detail: { type: 'HIT', key, cachedAt: parsed.cachedAt },
            }),
          )
          return parsed.data
        }
        sessionStorage.removeItem(`qc_${key}`)
      }
    } catch {
      // sessionStorage unavailable
    }

    this.lastHit = false
    console.info(
      `%c[QueryCache] 🟠 MISS: Data tidak ada di cache, melakukan request ke server...\nKey: ${key}`,
      'background: #fef5e7; color: #b9770e; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    )
    window.dispatchEvent(
      new CustomEvent('query_cache_event', {
        detail: { type: 'MISS', key },
      }),
    )
    return null
  },

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    const now = Date.now()
    const entry = {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    }

    memoryCache.set(key, entry)
    console.info(
      `%c[QueryCache] 💾 STORED: Hasil request disimpan ke cache (TTL ${ttlMs / 1000}s)\nKey: ${key}`,
      'background: #ebf5fb; color: #2471a3; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    )

    try {
      sessionStorage.setItem(`qc_${key}`, JSON.stringify(entry))
    } catch {
      // ignore
    }

    window.dispatchEvent(
      new CustomEvent('query_cache_event', {
        detail: { type: 'SET', key, cachedAt: now },
      }),
    )
  },

  invalidate(prefixOrKey) {
    console.info(
      `%c[QueryCache] 🗑️ INVALIDATED: Cache dibersihkan karena ada mutasi (CRUD)\nFilter: ${prefixOrKey}`,
      'background: #fadbd8; color: #922b21; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
    )

    for (const key of memoryCache.keys()) {
      if (!prefixOrKey || key.includes(prefixOrKey)) {
        memoryCache.delete(key)
      }
    }

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

    window.dispatchEvent(
      new CustomEvent('query_cache_event', {
        detail: { type: 'INVALIDATE', prefixOrKey },
      }),
    )
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
