import { useState } from 'react'
import {
  ArrowLeft,
  Shield,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar avatar maksimal 2MB.')
      setTimeout(() => setErrorMsg(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      setErrorMsg('')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setErrorMsg('Callsign / Nama operator tidak boleh kosong.')
      return
    }

    const updated = {
      ...profile,
      username: username.trim(),
      bio: bio.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setFeedback('Profil berhasil diperbarui!')
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data)
        else if (onBack) onBack()
      }, 1000)
    } else {
      setErrorMsg(result.message || 'Gagal menyimpan profil.')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Profil
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit Operator Profile</h1>
        <p className="lede">
          Perbarui identitas operator, callsign militer, dan catatan station armory.
        </p>
      </div>

      {feedback && (
        <div className="toast toast--success">
          <CheckCircle size={18} /> {feedback}
        </div>
      )}

      {errorMsg && (
        <div className="toast toast--error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      <div className="card-box">
        <form onSubmit={handleSaveProfile} className="profile-edit-form">
          {/* Avatar edit section */}
          <div className="profile-edit-avatar-section">
            <div className="avatar-wrap avatar-wrap--large">
              {avatar ? (
                <img src={avatar} alt={username} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <Shield size={44} stroke="var(--brass)" />
                </div>
              )}
              <label
                htmlFor="edit-avatar-file-input"
                className="avatar-upload-btn"
                title="Unggah Foto Avatar Baru"
              >
                <Camera size={16} />
                <input
                  id="edit-avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden-file-input"
                />
              </label>
            </div>
            <div className="avatar-edit-info">
              <span className="thumb-title">Foto Operator</span>
              <span className="thumb-sub">Format JPG, PNG, atau WebP (Maks 2MB)</span>
              {avatar && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setAvatar(null)}
                  style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                >
                  Hapus Avatar
                </button>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label htmlFor="edit-prof-name" className="form-label">
              Callsign / Operator Alias <span className="req">*</span>
            </label>
            <input
              id="edit-prof-name"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Operator Delta, Master Gunsmith"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-prof-bio" className="form-label">
              Armory Notes / Station Bio
            </label>
            <textarea
              id="edit-prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Spesifikasi keahlian, kaliber favorit, unit tugas..."
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-actions-bar">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onBack}
            >
              Batal
            </button>
            <button type="submit" className="btn btn--primary">
              <Save size={16} /> Simpan Perubahan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
