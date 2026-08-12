import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { getBrandLogoUrl } from './brandLogos'
import './CarryingBag.css'

/** @typedef {{ id: string; name: string; live: number }} BrandThreshold */

/** @type {BrandThreshold[]} */
const BRAND_DEFAULTS = [
  {
    id: 'pe',
    name: 'Popeyes',
    live: 150,
  },
  {
    id: 'bk',
    name: 'Burger King',
    live: 200,
  },
]

function BrandLogo({ name }) {
  const url = getBrandLogoUrl(name)
  const [failed, setFailed] = useState(false)
  const initial = String(name ?? '').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'

  if (!url || failed) {
    return (
      <span className="tc-brand__fallback" aria-hidden>
        {initial}
      </span>
    )
  }

  return (
    <img
      className="tc-brand__logo"
      src={url}
      alt=""
      onError={() => setFailed(true)}
    />
  )
}

function draftsFromLive(brands) {
  /** @type {Record<string, string>} */
  const next = {}
  for (const b of brands) next[b.id] = String(b.live)
  return next
}

export default function CarryingBag() {
  const [brands, setBrands] = useState(() => BRAND_DEFAULTS.map((b) => ({ ...b })))
  const [drafts, setDrafts] = useState(() => draftsFromLive(BRAND_DEFAULTS))
  const [toast, setToast] = useState(/** @type {string | null} */ (null))

  const dirty = useMemo(
    () => brands.some((b) => Number(drafts[b.id]) !== b.live),
    [brands, drafts],
  )

  const handleDraftChange = useCallback((id, raw) => {
    const cleaned = String(raw).replace(/[^\d]/g, '')
    setDrafts((prev) => ({ ...prev, [id]: cleaned }))
  }, [])

  const handleReset = useCallback(() => {
    setDrafts(draftsFromLive(brands))
  }, [brands])

  const handleSave = useCallback(() => {
    const next = brands.map((b) => {
      const n = Number.parseInt(drafts[b.id], 10)
      const value = Number.isFinite(n) && n >= 0 ? n : b.live
      return { ...b, live: value }
    })
    setBrands(next)
    setDrafts(draftsFromLive(next))
    setToast('Marka eşikleri kaydedildi. Değişiklikler gece reload sonrası canlıya yansır.')
    window.setTimeout(() => setToast(null), 3600)
  }, [brands, drafts])

  return (
    <div className="tc-dash">
      <header className="tc-header">
        <div className="tc-header__inner">
          <div className="tc-header__meta">
            <p className="tc-header__crumb">
              <span>Yapılandırma</span>
              <span className="tc-header__crumbSep">/</span>
              <span className="tc-header__crumbActive">Taşıma çantası</span>
            </p>
            <div className="tc-header__titleRow">
              <div>
                <h1 className="tc-header__title">Minimum sepet tutarı</h1>
              </div>
              <span className="tc-env" title="Ortam">
                PROD · CONFIG-DC
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="tc-main">
        <div className="tc-alert" role="status">
          <span className="tc-alert__icon" aria-hidden>
            !
          </span>
          <p className="tc-alert__text">
            Belirlenen minimum sepet tutarına göre bir ücretsiz termal çanta verilir. Değerler marka bazlıdır.
            Sepet tutarında yapılan değişiklikler ertesi gün işleme alınır.
          </p>
        </div>

        <section className="tc-card">
          <div className="tc-card__head">
            <h2 className="tc-card__title">Marka eşikleri</h2>
          </div>

          <ul className="tc-rows">
            {brands.map((b) => (
                <li key={b.id} className="tc-row">
                  <div className="tc-brand">
                    <span className="tc-brand__mark">
                      <BrandLogo name={b.name} />
                    </span>
                    <div className="tc-brand__text">
                      <span className="tc-brand__name">{b.name}</span>
                    </div>
                  </div>

                  <div className="tc-field">
                    <label className="tc-field__label" htmlFor={`tc-min-${b.id}`}>
                      Minimum sepet tutarı
                    </label>
                    <div className="tc-inputWrap">
                      <input
                        id={`tc-min-${b.id}`}
                        className="tc-input"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={drafts[b.id]}
                        onChange={(e) => handleDraftChange(b.id, e.target.value)}
                      />
                      <span className="tc-inputSuffix">TL</span>
                    </div>
                  </div>

                  <div className="tc-live">
                    <span className="tc-live__label">Canlıdaki değer</span>
                    <strong className="tc-live__value">{b.live} TL</strong>
                  </div>
                </li>
              ))}
          </ul>

          <div className="tc-card__foot">
            <div className="tc-actions">
              <button type="button" className="tc-btn tc-btn--ghost" onClick={handleReset} disabled={!dirty}>
                Sıfırla
              </button>
              <button type="button" className="tc-btn tc-btn--primary" onClick={handleSave} disabled={!dirty}>
                Kaydet
              </button>
            </div>
          </div>
        </section>
      </main>

      {toast ? (
        <div className="tc-toast" role="status">
          <CheckCircle2 size={18} aria-hidden />
          <span>{toast}</span>
        </div>
      ) : null}
    </div>
  )
}
