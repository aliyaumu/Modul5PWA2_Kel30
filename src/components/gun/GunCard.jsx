import { useState, useEffect } from 'react'
import { Share2, ShoppingCart, Check, ImagePlus } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'
import { getExtraImage, setExtraImage } from '../../utils/extraImagesStorage'

/**
 * Product card used in the catalog grid with Share, Add-to-Cart, and Extra Image support.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Delete is clicked (admin)
 * @param {Function} [props.onRestore] - called when restoring archived item
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onRestore, isArchivedView }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { addItem } = useCart()
  const [copied, setCopied] = useState(false)
  const [added, setAdded] = useState(false)

  // Extra image management (each catalog item can have 1 additional image)
  const [extraImg, setExtraImg] = useState(() => getExtraImage(gun.id))
  const [showingExtra, setShowingExtra] = useState(false)

  useEffect(() => {
    const handleExtraSync = () => {
      setExtraImg(getExtraImage(gun.id))
    }
    window.addEventListener('extra_images_updated', handleExtraSync)
    return () => window.removeEventListener('extra_images_updated', handleExtraSync)
  }, [gun.id])

  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(gun.id)}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gun.name} — Bore & Barrel`,
          text: `Cek ${gun.name} di Bore & Barrel Armory!`,
          url: shareUrl,
        })
        return
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addItem(gun, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleQuickUpload = (e) => {
    e.stopPropagation()
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target.result
      setExtraImage(gun.id, dataUrl)
      setExtraImg(dataUrl)
      setShowingExtra(true)
    }
    reader.readAsDataURL(file)
  }

  const displayImg = showingExtra && extraImg ? extraImg : imgSrc

  return (
    <li className={`card ${isArchivedView ? 'card--archived' : ''}`}>
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <div className="card-img-wrap">
          <img
            className="card-img"
            src={displayImg}
            alt={gun.name}
            width="240"
            height="180"
            loading="lazy"
            decoding="async"
          />

          {extraImg && (
            <span
              className="card-multi-badge"
              onClick={(e) => {
                e.stopPropagation()
                setShowingExtra((s) => !s)
              }}
              title="Klik untuk beralih foto 1 dan 2"
            >
              📷 {showingExtra ? '2/2' : '1/2'}
            </span>
          )}
        </div>

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>

        {isArchivedView && (
          <span className="archived-tag">Arsip / Terhapus</span>
        )}
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        {!isArchivedView && (
          <>
            {/* Quick Add 1 Extra Image */}
            {!extraImg && (
              <label
                className="card-act-btn"
                title="Tambah 1 gambar untuk senjata ini"
                onClick={(e) => e.stopPropagation()}
              >
                <ImagePlus size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleQuickUpload}
                />
              </label>
            )}

            <button
              type="button"
              className={`card-act-btn ${added ? 'card-act-btn--success' : ''}`}
              onClick={handleAddToCart}
              title={added ? 'Ditambahkan ke keranjang' : 'Tambah ke keranjang'}
              aria-label="Add to cart"
            >
              {added ? <Check size={14} color="#27ae60" /> : <ShoppingCart size={14} />}
            </button>

            <button
              type="button"
              className={`card-act-btn ${copied ? 'card-act-btn--success' : ''}`}
              onClick={handleShare}
              title={copied ? 'Tautan disalin!' : 'Bagikan tautan'}
              aria-label="Share gun link"
            >
              {copied ? <Check size={14} color="var(--brass)" /> : <Share2 size={14} />}
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button
                type="button"
                className="card-act-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(gun)
                }}
                aria-label={`Edit ${gun.name}`}
                title="Edit"
              >
                ✏️
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="card-act-btn card-act-btn--danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(gun)
                }}
                aria-label={`Hapus atau Arsipkan ${gun.name}`}
                title="Hapus / Arsipkan"
              >
                🗑️
              </button>
            )}
          </>
        )}

        {isArchivedView && (
          <>
            {onRestore && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore(gun)
                }}
                title="Pulihkan ke katalog aktif"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                Pulihkan
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="card-act-btn card-act-btn--danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(gun)
                }}
                aria-label={`Hapus permanen ${gun.name}`}
                title="Hapus Permanen"
              >
                🗑️
              </button>
            )}
          </>
        )}
      </div>
    </li>
  )
}
