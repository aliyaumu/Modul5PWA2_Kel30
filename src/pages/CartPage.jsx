import { useState } from 'react'
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import userService from '../services/userService'
import { formatPrice } from '../utils/helpers'

export default function CartPage({ onBack, onNavigateCatalog }) {
  const { items, totalPrice, itemCount, updateQuantity, removeItem, clear, checkoutWhatsApp } = useCart()

  const [customerName, setCustomerName] = useState(() => {
    const profile = userService.getUserProfile()
    return profile.username || 'Operator'
  })
  const [phone, setPhone] = useState(() => localStorage.getItem('bore_barrel_wa_phone') || '081234567890')
  const [notes, setNotes] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheckout = (e) => {
    e.preventDefault()
    if (!items || items.length === 0) {
      setErrorMsg('Keranjang belanja kosong.')
      return
    }

    if (!customerName.trim()) {
      setErrorMsg('Silakan isi nama pemesan.')
      return
    }

    // Save phone for future convenience
    localStorage.setItem('bore_barrel_wa_phone', phone)

    const success = checkoutWhatsApp({
      phone,
      customerName: customerName.trim(),
      notes: notes.trim(),
      items,
    })

    if (success) {
      setStatusMsg('Membuka WhatsApp untuk menyelesaikan pesanan...')
      setTimeout(() => {
        clear()
      }, 1000)
    }
  }

  return (
    <div className="cart-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={clear}
            title="Kosongkan keranjang"
          >
            <Trash2 size={14} /> Kosongkan Keranjang
          </button>
        )}
      </div>

      <div className="form-title-group">
        <h1 className="display">Armory Procurement Cart</h1>
        <p className="lede">
          Kelola pesanan perlengkapan dan checkout langsung melalui WhatsApp resmi.
        </p>
      </div>

      {statusMsg && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {items.length === 0 ? (
        <div className="state-box">
          <ShoppingBag size={42} stroke="var(--steel)" />
          <h3>Keranjang Belanja Masih Kosong</h3>
          <p className="lede">
            Silakan pilih senjata atau perlengkapan dari katalog untuk dimasukkan ke keranjang.
          </p>
          {onNavigateCatalog && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onNavigateCatalog}
              style={{ marginTop: '14px' }}
            >
              Jelajahi Katalog
            </button>
          )}
        </div>
      ) : (
        <div className="cart-layout">
          {/* Item List */}
          <div className="cart-items-wrap">
            <h2 className="section-title">Daftar Item ({itemCount})</h2>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="cart-item-img"
                    loading="lazy"
                  />
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-spec">
                      {item.type} {item.caliber ? `· ${item.caliber}` : ''}
                    </span>
                    <span className="cart-item-price">
                      {formatPrice(item.price)} each
                    </span>
                  </div>

                  <div className="cart-qty-ctrl">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="cart-item-subtotal">
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>

                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => removeItem(item.id)}
                    title="Hapus dari keranjang"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout Form */}
          <div className="cart-summary-box">
            <h2 className="section-title">Ringkasan &amp; Checkout</h2>

            <div className="summary-row">
              <span>Total Item</span>
              <span>{itemCount} unit</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>Total Harga</span>
              <span className="summary-total-val">{formatPrice(totalPrice)}</span>
            </div>

            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <label htmlFor="cust-name" className="form-label">
                  Nama Pemesan / Callsign <span className="req">*</span>
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama atau Alias Operator"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="wa-phone" className="form-label">
                  Nomor WhatsApp Tujuan <span className="req">*</span>
                </label>
                <input
                  id="wa-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="form-input"
                  required
                />
                <span className="field-hint">
                  Bisa menggunakan nomor WhatsApp pribadi kamu.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="order-notes" className="form-label">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="order-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pengiriman via ekspedisi aman, packaging khusus..."
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--checkout"
                title="Pesan via WhatsApp"
              >
                <MessageCircle size={18} />
                <span>Checkout via WhatsApp</span>
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
