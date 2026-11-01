import { Plus, ShoppingCart, Heart, User, Layers } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useCart } from '../hooks/useCart'

function Header({ tab, onTab, onNavigateCreate }) {
  const { favorites } = useFavorites()
  const { itemCount: cartCount } = useCart()
  const favCount = favorites ? favorites.length : 0

  const navItems = [
    { id: 'Catalog', label: 'Catalog', icon: Layers },
    { id: 'Favorites', label: 'Favorites', icon: Heart, badge: favCount },
    { id: 'Cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { id: 'Profile', label: 'Profile', icon: User },
  ]

  return (
    <header className="header">
      <div
        className="header-brand-wrap"
        onClick={() => onTab('Catalog')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <div className="header-logo-badge">
          <img src="/logo.png" alt="Bore & Barrel" />
        </div>
        <span className="brand display">Bore &amp; Barrel</span>
      </div>

      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'nav-link active' : 'nav-link'}
              onClick={() => onTab(item.id)}
            >
              <Icon size={15} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          )
        })}
      </nav>

      {onNavigateCreate && (
        <button
          type="button"
          className="btn btn--primary btn--sm header-cta"
          onClick={onNavigateCreate}
          title="Register new hardware"
        >
          <Plus size={15} /> Add Hardware
        </button>
      )}
    </header>
  )
}

export default Header
