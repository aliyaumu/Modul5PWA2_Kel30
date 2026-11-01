import { useState, useMemo, useEffect } from 'react'
import {
  RefreshCw,
  Plus,
  Loader,
  AlertCircle,
  PackageOpen,
  Archive,
  Layers,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import gunService from '../services/gunService'
import queryCache from '../utils/queryCache'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'
import {
  getArchivedGuns,
  isArchived,
  archiveGun,
  restoreGun,
  removeArchivedGun,
} from '../utils/archiveStorage'

const ITEMS_PER_PAGE = 6

/**
 * Catalog page with Pagination, Soft Delete / Archive, and Restore functionality.
 */
export default function Catalog({ onNavigate }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 100 })
  const [useLocal, setUseLocal] = useState(false)

  // Catalog tab: 'active' or 'archived'
  const [catalogTab, setCatalogTab] = useState('active')
  const [archivedGuns, setArchivedGuns] = useState(getArchivedGuns)

  const syncArchived = () => {
    setArchivedGuns(getArchivedGuns())
  }

  // Query Cache reactive indicator
  const [cacheStatus, setCacheStatus] = useState(() => (queryCache.lastHit ? 'HIT' : 'LIVE'))

  useEffect(() => {
    const handleCacheEvent = (e) => {
      if (e.detail?.type === 'HIT') setCacheStatus('HIT')
      else if (e.detail?.type === 'SET') setCacheStatus('STORED')
      else if (e.detail?.type === 'INVALIDATE') setCacheStatus('INVALIDATED')
      else if (e.detail?.type === 'MISS') setCacheStatus('MISS')
    }
    window.addEventListener('query_cache_event', handleCacheEvent)
    return () => window.removeEventListener('query_cache_event', handleCacheEvent)
  }, [])

  // Active raw guns excluding archived ones
  const activeRawGuns = useMemo(() => {
    let source = apiGuns
    if (useLocal || (error && apiGuns.length === 0)) {
      source = GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
    }
    // Filter out items in archived storage
    return source.filter((g) => !isArchived(g.id))
  }, [apiGuns, error, useLocal, archivedGuns])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeCategory, sortKey, sortOrder, catalogTab])

  const currentDataset = catalogTab === 'active' ? activeRawGuns : archivedGuns
  const categories = useMemo(() => extractCategories(activeRawGuns), [activeRawGuns])

  const filteredGuns = useMemo(() => {
    let result = currentDataset.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [currentDataset, search, activeCategory, sortKey, sortOrder])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredGuns.length / ITEMS_PER_PAGE))
  const paginatedGuns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredGuns.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredGuns, currentPage])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- delete / archive action state ----
  const [actionTarget, setActionTarget] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toastSuccess, setToastSuccess] = useState('')

  // Handle Soft Delete (Arsipkan)
  const handleArchive = (gun) => {
    archiveGun(gun)
    syncArchived()
    setShowActionModal(false)
    setActionTarget(null)
    setToastSuccess(`"${gun.name}" berhasil diarsipkan (soft delete).`)
    setTimeout(() => setToastSuccess(''), 3000)
  }

  // Handle Restore
  const handleRestore = (gun) => {
    restoreGun(gun.id)
    syncArchived()
    setToastSuccess(`"${gun.name}" berhasil dipulihkan ke katalog aktif!`)
    setTimeout(() => setToastSuccess(''), 3000)
  }

  // Handle Permanent Delete
  const handlePermanentDelete = async (gun) => {
    try {
      setActionLoading(true)
      setActionError('')
      removeArchivedGun(gun.id)
      await gunService.deleteGun(gun.id)
      syncArchived()
      setShowActionModal(false)
      setActionTarget(null)
      refetch()
      setToastSuccess(`"${gun.name}" berhasil dihapus permanen.`)
      setTimeout(() => setToastSuccess(''), 3000)
    } catch (err) {
      setActionError(err.message || 'Gagal menghapus secara permanen.')
    } finally {
      setActionLoading(false)
    }
  }

  // If viewing a single product detail
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onDelete={(g) => {
          setSelectedGun(null)
          setActionTarget(g)
          setShowActionModal(true)
        }}
      />
    )
  }

  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          Katalog senjata dan perlengkapan taktis Bore &amp; Barrel. Didukung fitur paginasi,
          arsip (soft delete), pencarian cepat, dan pemesanan WhatsApp.
        </p>
      </section>

      {toastSuccess && (
        <div className="toast toast--success" style={{ marginTop: '16px' }}>
          {toastSuccess}
        </div>
      )}

      {actionError && (
        <div className="toast toast--error" style={{ marginTop: '16px' }}>
          {actionError}
        </div>
      )}

      <section>
        {/* Tab switcher: Active Catalog vs Archived */}
        <div className="catalog-tabs-bar">
          <button
            type="button"
            className={`catalog-tab-btn ${catalogTab === 'active' ? 'catalog-tab-btn--active' : ''}`}
            onClick={() => setCatalogTab('active')}
          >
            <Layers size={16} />
            <span>Katalog Aktif ({activeRawGuns.length})</span>
          </button>
          <button
            type="button"
            className={`catalog-tab-btn ${catalogTab === 'archived' ? 'catalog-tab-btn--active' : ''}`}
            onClick={() => setCatalogTab('archived')}
          >
            <Archive size={16} />
            <span>Arsip / Soft Delete ({archivedGuns.length})</span>
          </button>
        </div>

        <div className="list-head">
          <h2>
            {catalogTab === 'active' ? 'Stok Aktif' : 'Barang Diarsipkan'}
          </h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} produk ditemukan
            </span>
            {onNavigate && catalogTab === 'active' && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Tambah Hardware
              </button>
            )}
          </div>
        </div>

        {/* Query Cache Indicator Strip */}
        <div className="cache-status-strip">
          <div className="cache-pill">
            <Zap size={14} color="#f39c12" />
            <span>
              Query Cache:{' '}
              <strong className={cacheStatus === 'HIT' ? 'cache-pill--hit' : 'cache-pill--live'}>
                {cacheStatus === 'HIT' ? '🟢 HIT (Memori Cache Cepat)' : '🌐 LIVE / Fresh Server'}
              </strong>
            </span>
          </div>

          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              queryCache.invalidate('guns')
              refetch()
            }}
            title="Bersihkan cache dan paksa ambil data fresh dari server"
          >
            <RefreshCw size={13} /> Refresh Cache
          </button>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => {
            setSortKey(key)
            setSortOrder(order)
          }}
        />

        {/* States */}
        {loading && catalogTab === 'active' && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Memuat produk dari server…</p>
          </div>
        )}

        {!loading && error && !useLocal && catalogTab === 'active' && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Coba Lagi
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                Gunakan Katalog Lokal
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>
              {catalogTab === 'active'
                ? 'Tidak ada produk yang cocok dengan pencarian.'
                : 'Tidak ada produk dalam arsip.'}
            </p>
          </div>
        )}

        {/* Paginated Product Grid */}
        {paginatedGuns.length > 0 && (
          <ul className="stock">
            {paginatedGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                isArchivedView={catalogTab === 'archived'}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onDelete={(g) => {
                  setActionTarget(g)
                  setShowActionModal(true)
                }}
                onRestore={handleRestore}
              />
            ))}
          </ul>
        )}

        {/* Pagination Controls */}
        {filteredGuns.length > ITEMS_PER_PAGE && (
          <div className="pagination-bar">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-num ${currentPage === pageNum ? 'pagination-num--active' : ''}`}
                  onClick={() => {
                    setCurrentPage(pageNum)
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Halaman Berikutnya"
            >
              Next <ChevronRight size={16} />
            </button>

            <span className="pagination-info">
              Hal {currentPage} dari {totalPages}
            </span>
          </div>
        )}

        {useLocal && (
          <p className="local-notice">
            Menampilkan data lokal (server offline).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setUseLocal(false)
                refetch()
              }}
            >
              Hubungkan kembali ke server
            </button>
          </p>
        )}
      </section>

      {/* Delete / Archive Choice Modal */}
      {showActionModal && actionTarget && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowActionModal(false)
            setActionTarget(null)
          }}
        >
          <div
            className="modal-box"
            role="alertdialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">
              <AlertCircle size={28} stroke="var(--brass)" />
            </div>

            <h3 className="modal-title display">
              {catalogTab === 'active'
                ? 'Kelola / Hapus Hardware'
                : 'Hapus Hardware Permanen'}
            </h3>

            <p className="modal-msg">
              Pilih tindakan untuk produk <strong>"{actionTarget.name}"</strong>:
            </p>

            <div
              className="modal-actions"
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {catalogTab === 'active' && (
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => handleArchive(actionTarget)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Archive size={16} /> Arsipkan (Soft Delete - Bisa Dipulihkan)
                </button>
              )}

              <button
                type="button"
                className="btn btn--danger"
                onClick={() => handlePermanentDelete(actionTarget)}
                disabled={actionLoading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={16} />
                {actionLoading ? 'Menghapus…' : 'Hapus Permanen Dari Database'}
              </button>

              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => {
                  setShowActionModal(false)
                  setActionTarget(null)
                }}
                style={{ width: '100%', marginTop: '4px', justifyContent: 'center' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
