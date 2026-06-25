import { Component, useState } from 'react'
import RestaurantChannelStatus from './RestaurantChannelStatus'
import ChannelOrderErrors from './ChannelOrderErrors'
import DefineRestaurant from './DefineRestaurant'
import PlatformPriceComparison from './PlatformPriceComparison'
import './App.css'

class RestaurantChannelErrorBoundary extends Component {
  /** @type {{ error: Error | null }} */
  state = { error: null }

  static getDerivedStateFromError(/** @type {Error} */ error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="restaurant-panel-fallback">
          <div className="content-panel-error">
            <h2 className="content-panel-error__title">Restoran Kanal Durumu yüklenemedi</h2>
            <p className="content-panel-error__msg">{this.state.error.message}</p>
            <p className="content-panel-error__hint">
              Tarayıcıda bu site için kayıtlı veriyi temizleyin veya gizli pencerede açın. Sorun sürerse
              geliştirici konsolundaki (F12) hata satırını kontrol edin.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function MenuIcon({ name }) {
  const common = { className: 'menu-icon-svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </svg>
    )
  }

  if (name === 'summary') {
    return (
      <svg {...common}>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M15 4v3h3" />
        <path d="M9 11h6M9 15h6" />
      </svg>
    )
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
      </svg>
    )
  }

  if (name === 'map') {
    return (
      <svg {...common}>
        <path d="m4 7 5-3 6 3 5-3v13l-5 3-6-3-5 3z" />
        <path d="M9 4v13M15 7v13" />
      </svg>
    )
  }

  if (name === 'restaurant') {
    return (
      <svg {...common}>
        <path d="M7 4v8M10 4v8M7 8h3M9 12v8" />
        <path d="M15 4v8c0 1.7 1.3 3 3 3h0V4zM18 15v5" />
      </svg>
    )
  }

  if (name === 'brand') {
    return (
      <svg {...common}>
        <path d="M4 6h16v12H4z" />
        <path d="M4 10h16M8 6v12M16 6v12" />
      </svg>
    )
  }

  if (name === 'error') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 17h.01" />
      </svg>
    )
  }

  if (name === 'cancel') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" />
      </svg>
    )
  }

  if (name === 'channels') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="5" height="5" rx="1" />
        <rect x="10" y="4" width="5" height="5" rx="1" />
        <rect x="16" y="4" width="5" height="5" rx="1" />
        <rect x="4" y="10" width="5" height="5" rx="1" />
        <rect x="10" y="10" width="5" height="5" rx="1" />
        <rect x="16" y="10" width="5" height="5" rx="1" />
        <rect x="4" y="16" width="5" height="5" rx="1" />
        <rect x="10" y="16" width="5" height="5" rx="1" />
        <rect x="16" y="16" width="5" height="5" rx="1" />
      </svg>
    )
  }

  if (name === 'channel-order-errors') {
    return (
      <svg {...common}>
        <path d="M6 4h9l2 2v14H6z" />
        <path d="M15 4v3h3" />
        <path d="M9 10h7M9 13h5M9 16h6" />
        <circle cx="17.5" cy="17" r="3.2" />
        <path d="M17.5 15.3v1.6M17.5 18.2h.01" strokeWidth="1.6" />
      </svg>
    )
  }

  if (name === 'price-compare') {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h10M4 17h6" />
        <path d="M16 10v8M13 13h6" />
      </svg>
    )
  }

  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    )
  }

  if (name === 'menu') {
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    )
  }

  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.5c1.8-3 4.1-4.5 6.5-4.5s4.7 1.5 6.5 4.5" />
      </svg>
    )
  }

  return null
}

function App() {
  const [activeMenu, setActiveMenu] = useState('search')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const isErrorGroupActive =
    activeMenu === 'errors' ||
    activeMenu === 'errors-total' ||
    activeMenu === 'errors-channel' ||
    activeMenu === 'errors-order'

  const isPriceCompareGroupActive =
    activeMenu === 'price-compare' ||
    activeMenu === 'price-compare-define-restaurant' ||
    activeMenu === 'price-compare-platform'

  return (
    <div className="page">
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-wrap">
          <div className="brand">
            <img src="/atp-zenia-logo.png" alt="ATP Zenia" className="brand-logo" />
          </div>
          <span className="brand-mini" aria-hidden>
            <span className="brand-mini-mark" />
            ATP
          </span>
          <button
            type="button"
            className="hamburger"
            aria-label={isSidebarCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          >
            <MenuIcon name="menu" />
          </button>
        </div>

        <nav className="menu">
          <button
            type="button"
            className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
            aria-label="Dashboard"
          >
            <span className="menu-icon"><MenuIcon name="dashboard" /></span>
            <span className="menu-label">Dashboard</span>
          </button>
          <button
            type="button"
            className={`menu-item ${activeMenu === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveMenu('summary')}
            aria-label="Sipariş Özeti"
          >
            <span className="menu-icon"><MenuIcon name="summary" /></span>
            <span className="menu-label">Sipariş Özeti</span>
          </button>
          <button
            type="button"
            className={`menu-item ${activeMenu === 'search' ? 'active' : ''}`}
            onClick={() => setActiveMenu('search')}
            aria-label="Sipariş Arama"
          >
            <span className="menu-icon"><MenuIcon name="search" /></span>
            <span className="menu-label">Sipariş Arama</span>
          </button>
          <button
            type="button"
            className={`menu-item ${activeMenu === 'map' ? 'active' : ''}`}
            onClick={() => setActiveMenu('map')}
            aria-label="Genel Satış Haritası"
          >
            <span className="menu-icon"><MenuIcon name="map" /></span>
            <span className="menu-label">Genel Satış Haritası</span>
          </button>
          <button
            type="button"
            className={`menu-item ${activeMenu === 'restaurant' ? 'active' : ''}`}
            onClick={() => setActiveMenu('restaurant')}
            aria-label="Restoran Bazlı Satış"
          >
            <span className="menu-icon"><MenuIcon name="restaurant" /></span>
            <span className="menu-label">Restoran Bazlı Satış</span>
          </button>
          <button
            type="button"
            className={`menu-item ${activeMenu === 'brand' ? 'active' : ''}`}
            onClick={() => setActiveMenu('brand')}
            aria-label="Marka Bazlı Satış"
          >
            <span className="menu-icon"><MenuIcon name="brand" /></span>
            <span className="menu-label">Marka Bazlı Satış</span>
          </button>

          <div className="menu-group">
            <button
              type="button"
              className={`menu-item group-open ${isErrorGroupActive ? 'active' : ''}`}
              onClick={() => setActiveMenu('errors')}
              aria-label="Sipariş Hataları"
            >
              <span className="menu-icon"><MenuIcon name="error" /></span>
              <span className="menu-label">Sipariş Hataları</span>
              <span className="chevron"><MenuIcon name="chevron" /></span>
            </button>
            <button
              type="button"
              className={`sub-menu-item ${activeMenu === 'errors-total' ? 'active' : ''}`}
              onClick={() => setActiveMenu('errors-total')}
            >
              Toplam Hata Özeti Sayfası
            </button>
            <button
              type="button"
              className={`sub-menu-item ${activeMenu === 'errors-channel' ? 'active' : ''}`}
              onClick={() => setActiveMenu('errors-channel')}
            >
              Kanal Marka Bazlı Hatalar
            </button>
            <button
              type="button"
              className={`sub-menu-item ${activeMenu === 'errors-order' ? 'active' : ''}`}
              onClick={() => setActiveMenu('errors-order')}
            >
              Sipariş Bazlı Hatalar
            </button>
          </div>

          <button
            type="button"
            className={`menu-item cancel-summary ${activeMenu === 'cancel-summary' ? 'active' : ''}`}
            onClick={() => setActiveMenu('cancel-summary')}
            aria-label="Sipariş İptal Özeti"
          >
            <span className="menu-icon"><MenuIcon name="cancel" /></span>
            <span className="menu-label">Sipariş İptal Özeti</span>
          </button>
          <button
            type="button"
            className={`menu-item restaurant-channel ${activeMenu === 'restaurant-channel' ? 'active' : ''}`}
            onClick={() => setActiveMenu('restaurant-channel')}
            aria-label="Restoran Kanal Durumu"
          >
            <span className="menu-icon"><MenuIcon name="channels" /></span>
            <span className="menu-label">Restoran Kanal Durumu</span>
          </button>
          <button
            type="button"
            className={`menu-item restaurant-channel ${activeMenu === 'channel-order-errors' ? 'active' : ''}`}
            onClick={() => setActiveMenu('channel-order-errors')}
            aria-label="Kanal Sipariş Hataları"
          >
            <span className="menu-icon"><MenuIcon name="channel-order-errors" /></span>
            <span className="menu-label">Kanal Sipariş Hataları</span>
          </button>

          <div className="menu-group">
            <button
              type="button"
              className={`menu-item group-open ${isPriceCompareGroupActive ? 'active' : ''}`}
              onClick={() => setActiveMenu('price-compare-define-restaurant')}
              aria-label="Fiyat Karşılaştırma"
            >
              <span className="menu-icon"><MenuIcon name="price-compare" /></span>
              <span className="menu-label">Fiyat Karşılaştırma</span>
              <span className="chevron"><MenuIcon name="chevron" /></span>
            </button>
            <button
              type="button"
              className={`sub-menu-item ${activeMenu === 'price-compare-define-restaurant' ? 'active' : ''}`}
              onClick={() => setActiveMenu('price-compare-define-restaurant')}
            >
              Restoran Tanımla
            </button>
            <button
              type="button"
              className={`sub-menu-item ${activeMenu === 'price-compare-platform' ? 'active' : ''}`}
              onClick={() => setActiveMenu('price-compare-platform')}
            >
              Platform Fiyat Karşılaştırma
            </button>
          </div>
        </nav>
        <div className="sidebar-footer" />
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="top-actions">
            <div className="user-wrap">
              <span className="user-mail">ece.aydin@atptech.com</span>
              <span className="user-name">eceaydin</span>
            </div>
            <span className="avatar-icon" aria-hidden>
              <MenuIcon name="user" />
            </span>
          </div>
        </header>

        <section
          className={
            activeMenu === 'restaurant-channel' ||
            activeMenu === 'channel-order-errors' ||
            activeMenu === 'price-compare-define-restaurant' ||
            activeMenu === 'price-compare-platform'
              ? 'content-panel'
              : 'blank-panel'
          }
        >
          {activeMenu === 'restaurant-channel' ? (
            <RestaurantChannelErrorBoundary>
              <RestaurantChannelStatus />
            </RestaurantChannelErrorBoundary>
          ) : null}
          {activeMenu === 'channel-order-errors' ? <ChannelOrderErrors /> : null}
          {activeMenu === 'price-compare-define-restaurant' ? <DefineRestaurant /> : null}
          {activeMenu === 'price-compare-platform' ? <PlatformPriceComparison /> : null}
        </section>
      </main>
    </div>
  )
}

export default App
