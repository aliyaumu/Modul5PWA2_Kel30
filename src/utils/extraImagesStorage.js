// ---------------------------------------------------------------------------
// extraImagesStorage.js — Store & manage 1 additional image for each catalog item
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bore_barrel_extra_images'

export const getAllExtraImages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const getExtraImage = (gunId) => {
  if (!gunId) return null
  const all = getAllExtraImages()
  return all[String(gunId)] || null
}

export const setExtraImage = (gunId, imageUrl) => {
  if (!gunId || !imageUrl) return false
  try {
    const all = getAllExtraImages()
    all[String(gunId)] = imageUrl
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('extra_images_updated'))
    return true
  } catch {
    return false
  }
}

export const removeExtraImage = (gunId) => {
  if (!gunId) return false
  try {
    const all = getAllExtraImages()
    delete all[String(gunId)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('extra_images_updated'))
    return true
  } catch {
    return false
  }
}

export default {
  getAllExtraImages,
  getExtraImage,
  setExtraImage,
  removeExtraImage,
}
