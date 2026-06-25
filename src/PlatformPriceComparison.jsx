import { useCallback, useState } from 'react'
import { PlatformComparisonToolbar } from './PlatformComparisonToolbar'
import { diffLabel, formatTl, getCatalogForBrand } from './platformPriceComparisonMock'
import './PriceComparison.css'

export default function PlatformPriceComparison() {
  const [channelId, setChannelId] = useState('')
  const [brand, setBrand] = useState('')
  const [rows, setRows] = useState(null)
  const [formError, setFormError] = useState('')
  const [checked, setChecked] = useState(false)

  const handleChannelIdChange = useCallback((e) => {
    setChannelId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
    setChecked(false)
  }, [])

  const handleBrandChange = useCallback((v) => {
    setBrand(v)
    setChecked(false)
  }, [])

  const handleCheck = useCallback(() => {
    setFormError('')
    if (!channelId.trim()) {
      setFormError('Restoran kanal ID giriniz.')
      return
    }
    if (!brand) {
      setFormError('Marka seçiniz.')
      return
    }
    setRows(getCatalogForBrand(brand))
    setChecked(true)
  }, [channelId, brand])

  return (
    <div className="pc-dash">
      <header className="pc-header">
        <div className="pc-header__inner pc-header__inner--wide">
          <div className="pc-header__meta">
            <h1 className="pc-header__title">Fiyat Karşılaştırma</h1>
            <p className="pc-header__crumb">
              <span>Dashboard</span>
              <span className="pc-header__crumbSep">/</span>
              <span className="pc-header__crumbActive">Platform Fiyat Karşılaştırma</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main pc-main--wide">
        <section className="pc-card pc-card--platform">
          <h2 className="pc-card__title">Platform Fiyat Karşılaştırma</h2>
          <p className="pc-card__desc">
            Kanal ve CCS ürün fiyatlarını restoran kanal ID ve marka ile karşılaştırın.
          </p>

          <PlatformComparisonToolbar
            channelId={channelId}
            brand={brand}
            formError={formError}
            onChannelIdChange={handleChannelIdChange}
            onBrandChange={handleBrandChange}
            onCheck={handleCheck}
          />

          {checked && rows ? (
            <div className="pc-platform-grid">
              <div className="pc-platform-col">
                <h3 className="pc-platform-col__title">Kanal Ürünleri</h3>
                <ul className="pc-platform-list">
                  {rows.map((row) => (
                    <li key={`ch-${row.name}`} className="pc-platform-row">
                      <span className="pc-platform-cell pc-platform-cell--name">{row.name}</span>
                      <span className="pc-platform-cell pc-platform-cell--price">{formatTl(row.channelPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pc-platform-col">
                <h3 className="pc-platform-col__title">CCS Ürünleri</h3>
                <ul className="pc-platform-list">
                  {rows.map((row) => (
                    <li key={`ccs-${row.name}`} className="pc-platform-row">
                      <span className="pc-platform-cell pc-platform-cell--name">{row.name}</span>
                      <span className="pc-platform-cell pc-platform-cell--price">{formatTl(row.ccsPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pc-platform-col pc-platform-col--result">
                <h3 className="pc-platform-col__title">Karşılaştırma Sonucu</h3>
                <ul className="pc-platform-list">
                  {rows.map((row) => {
                    const { text, tone } = diffLabel(row.channelPrice, row.ccsPrice)
                    return (
                      <li key={`res-${row.name}`} className="pc-platform-row pc-platform-row--result">
                        <span
                          className={`pc-platform-cell pc-platform-cell--diff pc-platform-cell--diff-${tone}`}
                          title={
                            tone === 'match'
                              ? 'Fiyatlar eşit'
                              : `Kanal − CCS: ${row.channelPrice - row.ccsPrice} TL`
                          }
                        >
                          {text}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <p className="pc-platform-hint">Kanal ID ve marka girip Kontrol Et ile karşılaştırmayı başlatın.</p>
          )}
        </section>
      </main>
    </div>
  )
}
