import { useState, useEffect, useCallback } from 'react'
import {
  getCartItems,
  addToCart as addToCartUtil,
  updateCartQuantity as updateCartQuantityUtil,
  removeFromCart as removeFromCartUtil,
  clearCart as clearCartUtil,
  getCartTotal,
  getCartItemCount,
  checkoutWhatsApp,
} from '../utils/cartStorage'

export function useCart() {
  const [items, setItems] = useState(getCartItems)

  const syncCart = useCallback(() => {
    setItems(getCartItems())
  }, [])

  useEffect(() => {
    const handleStorage = () => syncCart()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('cart_updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('cart_updated', handleStorage)
    }
  }, [syncCart])

  const addItem = useCallback((gun, quantity = 1) => {
    const updated = addToCartUtil(gun, quantity)
    setItems(updated)
    return updated
  }, [])

  const updateQuantity = useCallback((gunId, quantity) => {
    const updated = updateCartQuantityUtil(gunId, quantity)
    setItems(updated)
    return updated
  }, [])

  const removeItem = useCallback((gunId) => {
    const updated = removeFromCartUtil(gunId)
    setItems(updated)
    return updated
  }, [])

  const clear = useCallback(() => {
    clearCartUtil()
    setItems([])
  }, [])

  return {
    items,
    totalPrice: getCartTotal(items),
    itemCount: getCartItemCount(items),
    addItem,
    updateQuantity,
    removeItem,
    clear,
    checkoutWhatsApp,
  }
}

export default useCart
