import { useCallback, useState } from 'react'
import { PlatformComparisonToolbar } from './PlatformComparisonToolbar'
import { PlatformMissingInfoBox, PlatformMissingInfoModal } from './PlatformMissingInfo'
import {
  filterDiffRows,
  getCatalogForBrand,
} from './platformPriceComparisonMock'
import './PriceComparison.css'

function PlatformDiffList({ rows }) {
  if (!rows.length) {
    return (
      <p className="pc-platform-empty">Fiyat farkı bulunan ürün yok — tüm eşleşen kayıtlar eşit.</p>
    )
  }

  return (
    <div className="pc-diff-list">
      <h3 className="pc-diff-list__title">Fiyat Farkı Bulunan Ürünler</h3>
      <ul className="pc-diff-list__items">
        {rows.map((row) => (
          <li key={row.name} className="pc-diff-list__row">
            <span className="pc-platform-cell pc-platform-cell--name">{row.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PlatformPriceComparison2() {
  const [channelId, setChannelId] = useState('')
  const [brand, setBrand] = useState('')
  const [rows, setRows] = useState(null)
  const [formError, setFormError] = useState('')
  const [checked, setChecked] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const handleChannelIdChange = useCallback((e) => {
    setChannelId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
    setChecked(false)
    setRows(null)
  }, [])

  const handleBrandChange = useCallback((v) => {
    setBrand(v)
    setChecked(false)
    setRows(null)
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
    const catalog = getCatalogForBrand(brand)
    const diffOnly = filterDiffRows(catalog)
    setRows(diffOnly)
    setChecked(true)
    setInfoModalOpen(true)
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
              <span className="pc-header__crumbActive">Platform Fiyat Karşılaştırma 2</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main pc-main--wide">
        <section className="pc-card pc-card--platform">
          <h2 className="pc-card__title">Platform Fiyat Karşılaştırma 2</h2>
          <p className="pc-card__desc">
            Yalnızca fiyat farkı olan ürünler listelenir. Eşleşmeyen ürünler için bilgi kutusunu inceleyin.
          </p>

          <PlatformComparisonToolbar
            idSuffix="-v2"
            channelId={channelId}
            brand={brand}
            formError={formError}
            onChannelIdChange={handleChannelIdChange}
            onBrandChange={handleBrandChange}
            onCheck={handleCheck}
          />

          {checked && rows ? (
            <>
              <PlatformMissingInfoBox onClick={() => setInfoModalOpen(true)} />
              <PlatformDiffList rows={rows} />
            </>
          ) : (
            <p className="pc-platform-hint">Kanal ID ve marka girip Kontrol Et ile karşılaştırmayı başlatın.</p>
          )}
        </section>
      </main>

      <PlatformMissingInfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </div>
  )
}
