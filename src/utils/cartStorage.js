// ---------------------------------------------------------------------------
// cartStorage.js — Persistent Cart Storage and WhatsApp Checkout
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'
const DEFAULT_WA_PHONE = '6281234567890' // Default fallback phone number

export const getCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const saveCartItems = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('cart_updated'))
  } catch {
    // ignore
  }
}

export const addToCart = (gun, quantity = 1) => {
  if (!gun) return []
  const items = getCartItems()
  const existingIdx = items.findIndex((i) => String(i.id) === String(gun.id))

  if (existingIdx > -1) {
    items[existingIdx].quantity += quantity
  } else {
    items.push({
      id: gun.id,
      name: gun.name,
      type: gun.type || gun.category || 'Hardware',
      caliber: gun.caliber || '',
      price: Number(gun.price ?? gun.cook_time ?? 0),
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      quantity: Math.max(1, quantity),
    })
  }

  saveCartItems(items)
  return items
}

export const updateCartQuantity = (gunId, quantity) => {
  let items = getCartItems()
  if (quantity <= 0) {
    items = items.filter((i) => String(i.id) !== String(gunId))
  } else {
    items = items.map((i) =>
      String(i.id) === String(gunId) ? { ...i, quantity } : i,
    )
  }
  saveCartItems(items)
  return items
}

export const removeFromCart = (gunId) => {
  const items = getCartItems().filter((i) => String(i.id) !== String(gunId))
  saveCartItems(items)
  return items
}

export const clearCart = () => {
  saveCartItems([])
}

export const getCartTotal = (items = getCartItems()) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export const getCartItemCount = (items = getCartItems()) => {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Format and redirect to WhatsApp with order details
 */
export const checkoutWhatsApp = ({
  phone = DEFAULT_WA_PHONE,
  customerName = 'Operator',
  notes = '',
  items = getCartItems(),
} = {}) => {
  if (!items || items.length === 0) return false

  // Normalize phone number (e.g. 0812 -> 62812, remove spaces / dashes)
  let cleanPhone = String(phone).replace(/[^0-9]/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1)
  }
  if (!cleanPhone) {
    cleanPhone = DEFAULT_WA_PHONE
  }

  // Format message lines
  const total = getCartTotal(items)
  const itemLines = items
    .map(
      (item) =>
        `• ${item.name} (${item.type}${item.caliber ? ` · ${item.caliber}` : ''}) x${item.quantity} = $${(item.price * item.quantity).toLocaleString()}`,
    )
    .join('\n')

  const message = [
    `Hi aku mau pesan barang dari Bore & Barrel Armory:`,
    ``,
    itemLines,
    ``,
    `💰 Total: $${total.toLocaleString()}`,
    `👤 Pemesan: ${customerName}`,
    notes ? `📝 Catatan: ${notes}` : null,
    ``,
    `Mohon info ketersediaan stok & proses selanjutnya. Terima kasih!`,
  ]
    .filter(Boolean)
    .join('\n')

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  window.open(waUrl, '_blank')
  return true
}
