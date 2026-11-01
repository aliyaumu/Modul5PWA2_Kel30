// ---------------------------------------------------------------------------
// archiveStorage.js — Soft delete / archive storage management
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isArchived = (gunId) => {
  if (!gunId) return false
  const list = getArchivedGuns()
  return list.some((g) => String(g.id) === String(gunId))
}

export const archiveGun = (gun) => {
  if (!gun || !gun.id) return false
  try {
    const list = getArchivedGuns()
    const exists = list.some((g) => String(g.id) === String(gun.id))
    if (!exists) {
      const archivedItem = {
        ...gun,
        archived_at: new Date().toISOString(),
      }
      list.unshift(archivedItem)
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list))
    }
    return true
  } catch {
    return false
  }
}

export const restoreGun = (gunId) => {
  if (!gunId) return null
  try {
    const list = getArchivedGuns()
    const target = list.find((g) => String(g.id) === String(gunId))
    const updated = list.filter((g) => String(g.id) !== String(gunId))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated))
    return target || null
  } catch {
    return null
  }
}

export const removeArchivedGun = (gunId) => {
  if (!gunId) return false
  try {
    const list = getArchivedGuns()
    const updated = list.filter((g) => String(g.id) !== String(gunId))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated))
    return true
  } catch {
    return false
  }
}

export const getArchivedCount = () => {
  return getArchivedGuns().length
}

export default {
  getArchivedGuns,
  isArchived,
  archiveGun,
  restoreGun,
  removeArchivedGun,
  getArchivedCount,
}
