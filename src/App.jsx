import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PWABadge from './components/PWABadge.jsx'
import gunService from './services/gunService.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy Loaded Components (Requirement 3: Lazy Loading)
// ---------------------------------------------------------------------------
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const SplashScreen = lazy(() => import('./components/common/SplashScreen.jsx'))
const ConfirmModal = lazy(() => import('./components/modals/ConfirmModal.jsx'))

function LoadingFallback() {
  return (
    <div className="state-box" style={{ margin: '48px auto', maxWidth: '300px' }}>
      <Loader size={30} className="spin" />
      <p>Memuat modul armory…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog') // 'Catalog' | 'Favorites' | 'Cart' | 'Profile'
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'edit_profile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ---------------------------------------------------------------------------
  // Check URL query on mount for shared gun link (Requirement 2: Share Link)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedGunId = params.get('gun')
    if (sharedGunId) {
      // Look in local preset first
      const localMatch = GUNS_LOCAL.find((g, i) => String(g.id || `local-${i}`) === String(sharedGunId))
      if (localMatch) {
        setSelectedGun(localMatch)
        setMode('detail')
      } else {
        // Fetch from API
        gunService
          .getGunById(sharedGunId)
          .then((res) => {
            if (res.success && res.data) {
              setSelectedGun(res.data)
              setMode('detail')
            }
          })
          .catch(() => {
            // ignore if not found
          })
      }
    }
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      if (payload?.id) {
        window.history.pushState(null, '', `?gun=${encodeURIComponent(payload.id)}`)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('edit_profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change (Catalog, Favorites, Cart, Profile)
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.history.pushState(null, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
    window.history.pushState(null, '', window.location.pathname)
  }

  // Resume editing saved draft from ProfilePage
  const handleResumeDraft = (draftId, draftData) => {
    if (draftId === 'create') {
      setMode('create')
    } else {
      setEditingGun({ id: draftId, ...(draftData?.formData || {}) })
      setMode('edit')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shell">
      {showSplash && (
        <Suspense fallback={null}>
          <SplashScreen onFinish={() => setShowSplash(false)} />
        </Suspense>
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<LoadingFallback />}>
          {/* Sub-page view: Create */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {/* Sub-page view: Edit Gun */}
          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Catalog')
              }}
            />
          )}

          {/* Sub-page view: Edit Profile (Requirement 5) */}
          {mode === 'edit_profile' && (
            <EditProfilePage
              onBack={handleBackToList}
              onSuccess={() => {
                handleBackToList()
                setTab('Profile')
              }}
            />
          )}

          {/* Sub-page view: Detail */}
          {mode === 'detail' && selectedGun && (
            <GunDetail
              gun={selectedGun}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) =>
                    handleNavigate(destination, payload)
                  }
                />
              )}

              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}

              {tab === 'Cart' && (
                <CartPage
                  onBack={() => setTab('Catalog')}
                  onNavigateCatalog={() => setTab('Catalog')}
                />
              )}

              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onNavigateEditProfile={() => handleNavigate('EditProfile')}
                  onResumeDraft={handleResumeDraft}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Delete Confirmation */}
      <Suspense fallback={null}>
        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete Hardware Record"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={async () => {
            if (!deleteTarget) return
            try {
              setDeleting(true)
              await gunService.deleteGun(deleteTarget.id)
              setDeleteTarget(null)
              handleBackToList()
              setTab('Catalog')
            } catch (err) {
              alert(err.message || 'Failed to delete record.')
            } finally {
              setDeleting(false)
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      </Suspense>

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
