import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Edit3,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  Info,
  Archive,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import {
  getAllDraftIds,
  loadDraft,
  getDraftTimestamp,
  formatDraftTime,
  deleteDraft,
} from '../utils/draftStorage'
import { getArchivedCount } from '../utils/archiveStorage'

export default function ProfilePage({
  onReplaySplash,
  onNavigateEditProfile,
  onResumeDraft,
}) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState([])
  const [archivedCount, setArchivedCount] = useState(getArchivedCount)

  const loadDraftsList = useCallback(() => {
    const ids = getAllDraftIds()
    const list = ids
      .map((id) => {
        const data = loadDraft(id)
        const ts = getDraftTimestamp(id)
        return {
          id,
          data,
          timestamp: ts,
        }
      })
      .filter((item) => item.data !== null)
    setDrafts(list)
    setArchivedCount(getArchivedCount())
  }, [])

  useEffect(() => {
    loadDraftsList()
  }, [loadDraftsList])

  // Sync profile if updated elsewhere
  useEffect(() => {
    setProfile(userService.getUserProfile())
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (draftId) => {
    deleteDraft(draftId)
    loadDraftsList()
  }

  return (
    <div className="profile-page">
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Identitas armorer, ringkasan inventaris, draft offline, serta informasi armory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onReplaySplash && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={onReplaySplash}
              title="Putar ulang animasi intro"
            >
              <Play size={14} /> Replay Intro
            </button>
          )}
          {onNavigateEditProfile && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onNavigateEditProfile}
              title="Buka halaman edit profil"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Salin ID Operator"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
            {profile.bio && <p className="profile-bio-text">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Favorit Disimpan</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Draft Katalog</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archivedCount}</div>
            <div className="stat-label">Katalog Diarsipkan</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Draft Management (List Katalog yang di-draft-kan) */}
      <section className="profile-section card-box">
        <div className="fieldset-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="section-title">Draft Katalog ({drafts.length})</h2>
            <p className="card-box-desc" style={{ marginBottom: 0 }}>
              Daftar form registrasi atau edit hardware yang tersimpan di perangkat offline.
            </p>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="state-box" style={{ padding: '24px', margin: '8px 0' }}>
            <FileText size={28} stroke="var(--steel)" />
            <p>Belum ada draft katalog yang tersimpan.</p>
          </div>
        ) : (
          <ul className="draft-list">
            {drafts.map((draft) => {
              const formData = draft.data.formData || {}
              const draftTitle =
                formData.name ||
                (draft.id === 'create'
                  ? 'Registrasi Hardware Baru'
                  : `Draft Edit (${draft.id.substring(0, 8)})`)
              const previewImg =
                draft.data.uploadedImageUrl ||
                draft.data.imagePreview ||
                '/guns/pistol.svg'

              return (
                <li key={draft.id} className="draft-item">
                  <img
                    src={previewImg}
                    alt={draftTitle}
                    className="draft-item-thumb"
                  />
                  <div className="draft-item-info">
                    <span className="draft-item-title">{draftTitle}</span>
                    <span className="draft-item-meta">
                      {formData.type || 'Platform'} · {formData.caliber || 'Caliber'} · $
                      {formData.price || 0}
                    </span>
                    <span className="draft-item-time">
                      Tersimpan: {formatDraftTime(draft.timestamp)}
                    </span>
                  </div>

                  <div className="draft-item-actions">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => onResumeDraft && onResumeDraft(draft.id, draft.data)}
                      title="Lanjutkan edit draft ini"
                    >
                      <ExternalLink size={14} /> Lanjutkan
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm"
                      onClick={() => handleDeleteDraft(draft.id)}
                      title="Hapus draft"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* SECTION 2: About Armory (Dipindahkan dari About.jsx) */}
      <section className="profile-section card-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Info size={20} stroke="var(--brass)" />
          <h2 className="section-title" style={{ margin: 0 }}>Tentang Bore &amp; Barrel</h2>
        </div>
        <h3 className="display" style={{ fontSize: '1.4rem', margin: '8px 0 6px' }}>
          A one-room armory.
        </h3>
        <p className="lede" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
          from the bench — no markup theatre, no filler. Didirikan untuk menghadirkan
          katalog perlengkapan taktis terstandarisasi dengan spesifikasi mekanis presisi.
        </p>
      </section>

      {/* SECTION 3: Contact & Location (Dipindahkan dari Contact.jsx) */}
      <section className="profile-section card-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <MapPin size={20} stroke="var(--brass)" />
          <h2 className="section-title" style={{ margin: 0 }}>Kontak &amp; Markas Armory</h2>
        </div>
        <p className="lede" style={{ fontSize: '0.95rem', marginBottom: '16px' }}>
          Kunjungi workshop fisik atau hubungi radio operasional kami:
        </p>

        <div className="contact-grid">
          <div className="contact-card">
            <MapPin size={18} stroke="var(--steel)" />
            <div>
              <strong>Alamat:</strong>
              <div>123 Range Road, Armory District</div>
            </div>
          </div>

          <div className="contact-card">
            <Clock size={18} stroke="var(--steel)" />
            <div>
              <strong>Jam Operasional:</strong>
              <div>Selasa – Sabtu, 10:00 – 18:00 WIB</div>
            </div>
          </div>

          <div className="contact-card">
            <Phone size={18} stroke="var(--steel)" />
            <div>
              <strong>Telepon / Radio:</strong>
              <div>(555) 010-0100 / Call Sign: Delta-1</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
