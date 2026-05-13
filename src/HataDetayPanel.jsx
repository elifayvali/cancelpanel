import { ErrorDetailStaticInfoBox } from './ErrorDetailStaticInfoBox'
import './HataDetayPanel.css'

/**
 * Ekran görüntüsüyle aynı sade “Hata Detayı” popup: başlık, sipariş alanları, hata mesajı, sabit bilgi kutusu.
 * @param {{
 *   dcid: string
 *   platformId: string
 *   kanal: string
 *   marka: string
 *   tarih: string
 *   hataMesaji: string
 *   onClose: () => void
 * }} props
 */
export function HataDetayPanel({ dcid, platformId, kanal, marka, tarih, hataMesaji, onClose }) {
  return (
    <div
      className="rkd-close-log-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="rkd-close-log-modal__panel rkd-hata-detay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rkd-hata-detay-title"
      >
        <header className="rkd-hata-detay__header">
          <div className="rkd-hata-detay__title-row">
            <span className="rkd-hata-detay__icon" aria-hidden>
              !
            </span>
            <h3 id="rkd-hata-detay-title" className="rkd-hata-detay__title">
              Hata Detayı
            </h3>
          </div>
          <button type="button" className="rkd-close-log-modal__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="rkd-hata-detay__scroll">
          <div className="rkd-hata-detay__grid">
            <div className="rkd-hata-detay__field">
              <div className="rkd-hata-detay__field-label">SİPARİŞ DCID</div>
              <div className="rkd-hata-detay__field-value rkd-hata-detay__field-value--pill">{dcid}</div>
            </div>
            <div className="rkd-hata-detay__field">
              <div className="rkd-hata-detay__field-label">PLATFORM ID</div>
              <div className="rkd-hata-detay__field-value rkd-hata-detay__field-value--pill">{platformId}</div>
            </div>
            <div className="rkd-hata-detay__field">
              <div className="rkd-hata-detay__field-label">KANAL</div>
              <div className="rkd-hata-detay__field-value rkd-hata-detay__field-value--plain">{kanal}</div>
            </div>
            <div className="rkd-hata-detay__field">
              <div className="rkd-hata-detay__field-label">MARKA</div>
              <div className="rkd-hata-detay__field-value rkd-hata-detay__field-value--plain">{marka}</div>
            </div>
            <div className="rkd-hata-detay__field rkd-hata-detay__field--full">
              <div className="rkd-hata-detay__field-label">SİPARİŞ TARİHİ</div>
              <div className="rkd-hata-detay__field-value rkd-hata-detay__field-value--plain">{tarih}</div>
            </div>
          </div>

          <div className="rkd-hata-detay__error-box">
            <h4 className="rkd-hata-detay__error-title">Hata Mesajı</h4>
            <p className="rkd-hata-detay__error-text">{hataMesaji}</p>
          </div>

          <ErrorDetailStaticInfoBox />
        </div>
      </section>
    </div>
  )
}
