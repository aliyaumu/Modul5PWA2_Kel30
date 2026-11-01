import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  ImagePlus,
  Camera,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'
import {
  getReviewReaction,
  toggleReviewReaction,
} from '../../utils/reactionStorage'
import {
  getExtraImage,
  setExtraImage,
  removeExtraImage,
} from '../../utils/extraImagesStorage'

/**
 * Full-screen product detail view with Share, Cart, extra image management, and full Review CRUD with Reactions.
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Extra image state (each catalog item can have 1 additional image)
  const [extraImage, setExtraImageState] = useState(() => getExtraImage(gun.id))
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [imageFeedback, setImageFeedback] = useState('')

  // Cart integration
  const { addItem } = useCart()
  const [cartQty, setCartQty] = useState(1)
  const [cartFeedback, setCartFeedback] = useState('')

  // Share state
  const [shareFeedback, setShareFeedback] = useState('')

  // Reviews
  const {
    reviews,
    loading: reviewsLoading,
    refetch: refetchReviews,
  } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Edit review state
  const [editingRevId, setEditingRevId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [updatingRev, setUpdatingRev] = useState(false)

  // Reactions state (triggers re-render on toggle)
  const [_reactionTick, setReactionTick] = useState(0)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(gun.id)}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gun.name} — Bore & Barrel Armory`,
          text: `Cek ${gun.name} (${category} ${caliber ? `· ${caliber}` : ''}) di katalog Bore & Barrel!`,
          url: shareUrl,
        })
        setShareFeedback('Tautan berhasil dibagikan!')
        setTimeout(() => setShareFeedback(''), 3000)
        return
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback('Tautan unik disalin ke clipboard!')
      setTimeout(() => setShareFeedback(''), 3000)
    } catch {
      setShareFeedback('Gagal menyalin tautan.')
      setTimeout(() => setShareFeedback(''), 3000)
    }
  }

  const handleAddToCart = () => {
    addItem(gun, cartQty)
    setCartFeedback(`Ditambahkan ${cartQty} item ke keranjang!`)
    setTimeout(() => setCartFeedback(''), 2500)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating harus antara 1 sampai 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Ulasan berhasil dikirim!')
      setComment('')
      setRating(5)
      refetchReviews()
      setTimeout(() => setReviewSuccess(''), 3500)
    } else {
      setReviewError('Gagal mengirim ulasan. Cek koneksi Anda.')
    }
  }

  const handleStartEditReview = (rev) => {
    setEditingRevId(rev.id)
    setEditRating(rev.rating || 5)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (revId) => {
    try {
      setUpdatingRev(true)
      await reviewService.updateReview(revId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingRevId(null)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui ulasan.')
    } finally {
      setUpdatingRev(false)
    }
  }

  const handleDeleteReview = async (revId) => {
    if (!window.confirm('Hapus ulasan ini?')) return
    try {
      await reviewService.deleteReview(revId)
      refetchReviews()
    } catch (err) {
      alert(err.message || 'Gagal menghapus ulasan.')
    }
  }

  const handleToggleReaction = (revId, type) => {
    toggleReviewReaction(revId, type)
    setReactionTick((t) => t + 1)
  }

  const handleUploadExtraImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target.result
      setExtraImage(gun.id, dataUrl)
      setExtraImageState(dataUrl)
      setActiveImgIndex(1)
      setImageFeedback('Gambar kedua berhasil ditambahkan ke katalog!')
      setTimeout(() => setImageFeedback(''), 3500)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveExtraImage = () => {
    removeExtraImage(gun.id)
    setExtraImageState(null)
    setActiveImgIndex(0)
    setImageFeedback('Gambar tambahan telah dihapus.')
    setTimeout(() => setImageFeedback(''), 3000)
  }

  const currentDisplayImg = activeImgIndex === 1 && extraImage ? extraImage : imgSrc

  return (
    <div className="detail">
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Katalog
        </button>

        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleShare}
          title="Bagikan tautan unik senjata ini"
        >
          <Share2 size={15} /> Bagikan Link
        </button>
      </div>

      {shareFeedback && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {shareFeedback}
        </div>
      )}

      {cartFeedback && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {cartFeedback}
        </div>
      )}

      {imageFeedback && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {imageFeedback}
        </div>
      )}

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-img-col">
          <img
            className="detail-img"
            src={currentDisplayImg}
            alt={gun.name}
            loading="lazy"
            decoding="async"
          />

          {/* Gallery Switcher & Add 1 Image Section */}
          <div className="detail-gallery-strip">
            <button
              type="button"
              className={`gallery-thumb-btn ${activeImgIndex === 0 ? 'gallery-thumb-btn--active' : ''}`}
              onClick={() => setActiveImgIndex(0)}
              title="Lihat Gambar Utama"
            >
              <img src={imgSrc} alt="Foto Utama" />
              <span>Foto 1 (Utama)</span>
            </button>

            {extraImage ? (
              <div className="gallery-extra-item">
                <button
                  type="button"
                  className={`gallery-thumb-btn ${activeImgIndex === 1 ? 'gallery-thumb-btn--active' : ''}`}
                  onClick={() => setActiveImgIndex(1)}
                  title="Lihat Gambar Tambahan"
                >
                  <img src={extraImage} alt="Foto Tambahan" />
                  <span>Foto 2 (Tambahan)</span>
                </button>
                <button
                  type="button"
                  className="gallery-remove-btn"
                  onClick={handleRemoveExtraImage}
                  title="Hapus foto tambahan"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <label className="gallery-add-btn" title="Tambah 1 gambar untuk katalog senjata ini">
                <ImagePlus size={16} />
                <span>+ Tambah 1 Gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden-file-input"
                  onChange={handleUploadExtraImage}
                />
              </label>
            )}
          </div>
        </div>

        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>

          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} ulasan)
            </p>
          )}

          {/* Add to Cart Controls */}
          <div className="detail-cart-box">
            <div className="detail-qty-wrap">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCartQty((q) => Math.max(1, q - 1))}
                aria-label="Kurangi"
              >
                <Minus size={14} />
              </button>
              <span className="qty-value">{cartQty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCartQty((q) => q + 1)}
                aria-label="Tambah"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAddToCart}
              title="Masukkan ke keranjang belanja"
            >
              <ShoppingCart size={16} /> Masukkan ke Keranjang
            </button>
          </div>

          <div className="detail-actions" style={{ marginTop: '16px' }}>
            <FavoriteButton gunId={gun.id || gun.name} />

            {onEdit && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => onEdit(gun)}
              >
                Edit Hardware
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(gun)}
              >
                Hapus / Arsipkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Deskripsi</h2>
        <p>{gun.description || 'Tidak ada deskripsi tersedia.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Spesifikasi &amp; Komponen</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Maintenance steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Protokol Perakitan &amp; Pemeliharaan</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Ulasan Produk ({reviews.length})</h2>

        {/* Submit Review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <label className="form-label">Tulis Ulasan Anda:</label>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} bintang`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Tulis ulasan pengalaman produk ini (maks 500 karakter)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <>
                <Loader size={16} className="spin" /> Mengirimkan…
              </>
            ) : (
              <>
                <Send size={16} /> Kirim Ulasan
              </>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Fitur ulasan membutuhkan ID produk yang terdaftar di database.
            </p>
          )}
        </form>

        {/* Existing reviews list */}
        {reviewsLoading ? (
          <p className="detail-loading">Memuat ulasan…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isEditing = editingRevId === rev.id
              const reaction = getReviewReaction(rev.id)

              return (
                <li key={rev.id} className="review-item">
                  <div className="review-head">
                    <span className="review-user">
                      {rev.user_identifier || 'Anonymous Operator'}
                    </span>
                    <span className="review-stars-display">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < rev.rating ? 'var(--brass)' : 'none'}
                          stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                        />
                      ))}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="review-edit-box">
                      <div className="review-stars" style={{ marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEditReview(rev.id)}
                          disabled={updatingRev}
                        >
                          <Check size={14} /> Simpan
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingRevId(null)}
                        >
                          <X size={14} /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Review Actions & Reactions */}
                      <div className="review-footer-bar">
                        {/* Thumbs up / down buttons */}
                        <div className="review-reactions">
                          <button
                            type="button"
                            className={`reaction-btn ${reaction.userVote === 'up' ? 'reaction-btn--active-up' : ''}`}
                            onClick={() => handleToggleReaction(rev.id, 'up')}
                            title="Suka ulasan ini"
                          >
                            <ThumbsUp size={14} />
                            <span>{reaction.likes}</span>
                          </button>

                          <button
                            type="button"
                            className={`reaction-btn ${reaction.userVote === 'down' ? 'reaction-btn--active-down' : ''}`}
                            onClick={() => handleToggleReaction(rev.id, 'down')}
                            title="Tidak suka ulasan ini"
                          >
                            <ThumbsDown size={14} />
                            <span>{reaction.dislikes}</span>
                          </button>
                        </div>

                        {/* Edit & Delete review actions */}
                        <div className="review-manage-actions">
                          <button
                            type="button"
                            className="btn btn--outline btn--sm icon-btn-text"
                            onClick={() => handleStartEditReview(rev)}
                            title="Edit ulasan"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn--danger-ghost btn--sm icon-btn-text"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Hapus ulasan"
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">Belum ada ulasan. Jadilah yang pertama mereview!</p>
        )}
      </section>
    </div>
  )
}
