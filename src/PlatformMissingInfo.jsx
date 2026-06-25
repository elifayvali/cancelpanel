import { useEffect } from 'react'
import { Info } from 'lucide-react'
import { MOCK_MISSING_NOTICES } from './platformPriceComparisonMock'

export function PlatformMissingInfoBox({ onClick }) {
  return (
    <button type="button" className="pc-platform-info" onClick={onClick}>
      <span className="pc-platform-info__icon" aria-hidden>
        <Info size={18} />
      </span>
      <div className="pc-platform-info__body">
        <p className="pc-platform-info__title">Eşleşmeyen ürün bilgisi</p>
        <ul className="pc-platform-info__list">
          {MOCK_MISSING_NOTICES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <span className="pc-platform-info__hint">Tüm listeyi göster</span>
      </div>
    </button>
  )
}

export function PlatformMissingInfoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="pc-platform-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="pc-platform-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-platform-missing-title"
      >
        <header className="pc-platform-modal__header">
          <div className="pc-platform-modal__titleRow">
            <span className="pc-platform-modal__icon" aria-hidden>
              <Info size={20} />
            </span>
            <h3 id="pc-platform-missing-title" className="pc-platform-modal__title">
              Eşleşmeyen Ürün Bilgisi
            </h3>
          </div>
          <button type="button" className="pc-platform-modal__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="pc-platform-modal__content">
          <ul className="pc-platform-modal__list">
            {MOCK_MISSING_NOTICES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
