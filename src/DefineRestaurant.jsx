import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { BRANDS, PriceSelect } from './priceComparisonUi'
import './PriceComparison.css'

const PRODUCT_GROUPS = [
  { id: '1001', label: '1001 bant inline' },
  { id: '2000', label: '2000 bant avm' },
  { id: '3000', label: '3000 bant avm 1' },
]

const PRICE_BANDS = [
  { id: '1002', groupId: '1001', label: '1002 paket 1', code: 'bktr100012002' },
  { id: '1003', groupId: '1001', label: '1003 paket 2', code: 'bktr100013002' },
  { id: '2002', groupId: '2000', label: '2002 paket 1', code: 'bktr200012002' },
  { id: '2003', groupId: '2000', label: '2003 paket 2', code: 'bktr200013002' },
  { id: '3002', groupId: '3000', label: '3002 paket 1', code: 'bktr300012002' },
  { id: '3003', groupId: '3000', label: '3003 paket 2', code: 'bktr300013002' },
]

const BAND_TYPES = [
  { id: 'restoranda', label: 'Restoranda' },
  { id: 'paket', label: 'Paket' },
]

const STORAGE_KEY = 'price-comparison-restaurant-matches'

/** Daha önce kaydedilmiş gibi görünen mock restoranlar */
const MOCK_SAVED_RESTAURANTS = [
  {
    channelId: '172002',
    brand: 'Burger King',
    productGroup: '1001',
    priceBand: '1002',
    bandType: 'restoranda',
    caption: '172002 · Burger King · Kadıköy',
  },
  {
    channelId: '172015',
    brand: 'Popeyes',
    productGroup: '2000',
    priceBand: '2002',
    bandType: 'paket',
    caption: '172015 · Popeyes · Ataşehir',
  },
  {
    channelId: '172020',
    brand: "Arby's",
    productGroup: '3000',
    priceBand: '3002',
    bandType: 'restoranda',
    caption: "172020 · Arby's · Beşiktaş",
  },
  {
    channelId: '172033',
    brand: 'Burger King',
    productGroup: '1001',
    priceBand: '1003',
    bandType: 'paket',
    caption: '172033 · Burger King · Bakırköy',
  },
  {
    channelId: '172048',
    brand: 'Popeyes',
    productGroup: '2000',
    priceBand: '2003',
    bandType: 'restoranda',
    caption: '172048 · Popeyes · Ümraniye',
  },
]

function loadSavedMatches() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMatch(entry) {
  const list = loadSavedMatches()
  list.unshift({ ...entry, savedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)))
}

function buildRestaurantPool(saved) {
  const byChannel = new Map()
  for (const item of MOCK_SAVED_RESTAURANTS) {
    byChannel.set(item.channelId, {
      ...item,
      caption: item.caption ?? `${item.channelId} · ${item.brand}`,
    })
  }
  for (const item of saved) {
    byChannel.set(item.channelId, {
      channelId: item.channelId,
      brand: item.brand,
      productGroup: item.productGroup,
      priceBand: item.priceBand,
      bandType: item.bandType,
      caption: `${item.channelId} · ${item.brand}${item.productGroupLabel ? ` · ${item.productGroupLabel}` : ''}`,
    })
  }
  return [...byChannel.values()]
}

export default function DefineRestaurant() {
  const [brand, setBrand] = useState('')
  const [channelId, setChannelId] = useState('')
  const [productGroup, setProductGroup] = useState('')
  const [priceBand, setPriceBand] = useState('')
  const [bandType, setBandType] = useState('')
  const [toast, setToast] = useState(null)
  const [formError, setFormError] = useState('')
  const [channelFocused, setChannelFocused] = useState(false)
  const [savedTick, setSavedTick] = useState(0)

  const restaurantPool = useMemo(() => buildRestaurantPool(loadSavedMatches()), [savedTick])

  const channelSuggestions = useMemo(() => {
    if (!channelFocused) return []
    const q = channelId.trim().toLowerCase()
    if (!q) return restaurantPool.slice(0, 5)
    return restaurantPool
      .filter(
        (r) =>
          r.channelId.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          (r.caption && r.caption.toLowerCase().includes(q)),
      )
      .slice(0, 6)
  }, [channelFocused, channelId, restaurantPool])

  const priceBandOptions = useMemo(() => {
    const bands = productGroup
      ? PRICE_BANDS.filter((b) => b.groupId === productGroup)
      : PRICE_BANDS
    return bands.map((b) => ({ value: b.id, label: b.label }))
  }, [productGroup])

  const selectedBand = PRICE_BANDS.find((b) => b.id === priceBand)

  useEffect(() => {
    if (priceBand && productGroup) {
      const band = PRICE_BANDS.find((b) => b.id === priceBand)
      if (band && band.groupId !== productGroup) setPriceBand('')
    }
  }, [productGroup, priceBand])

  const handleChannelIdChange = useCallback((e) => {
    const next = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
    setChannelId(next)
  }, [])

  const applyRestaurantSuggestion = useCallback((item) => {
    setChannelId(item.channelId)
    setBrand(item.brand)
    if (item.productGroup) setProductGroup(item.productGroup)
    if (item.priceBand) setPriceBand(item.priceBand)
    if (item.bandType) setBandType(item.bandType)
    setChannelFocused(false)
  }, [])

  const handleMatch = useCallback(() => {
    setFormError('')
    if (!brand) {
      setFormError('Marka seçiniz.')
      return
    }
    if (!channelId.trim()) {
      setFormError('Kanal ID giriniz.')
      return
    }
    if (!productGroup) {
      setFormError('Ürün grubu seçiniz.')
      return
    }
    if (!priceBand) {
      setFormError('Fiyat bandı seçiniz.')
      return
    }
    if (!bandType) {
      setFormError('Fiyat bandı tipi seçiniz.')
      return
    }

    const groupLabel = PRODUCT_GROUPS.find((g) => g.id === productGroup)?.label ?? productGroup
    const bandLabel = selectedBand?.label ?? priceBand
    const typeLabel = BAND_TYPES.find((t) => t.id === bandType)?.label ?? bandType

    saveMatch({
      brand,
      channelId: channelId.trim(),
      productGroup,
      productGroupLabel: groupLabel,
      priceBand,
      priceBandLabel: bandLabel,
      priceBandCode: selectedBand?.code ?? '',
      bandType,
      bandTypeLabel: typeLabel,
    })

    setSavedTick((n) => n + 1)
    setToast('Restoran eşleştirmesi kaydedildi.')
    setTimeout(() => setToast(null), 3200)
  }, [brand, channelId, productGroup, priceBand, bandType, selectedBand])

  return (
    <div className="pc-dash">
      <header className="pc-header">
        <div className="pc-header__inner">
          <div className="pc-header__meta">
            <h1 className="pc-header__title">Fiyat Karşılaştırma</h1>
            <p className="pc-header__crumb">
              <span>Dashboard</span>
              <span className="pc-header__crumbSep">/</span>
              <span className="pc-header__crumbActive">Restoran Tanımla</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main">
        <section className="pc-card">
          <h2 className="pc-card__title">Restoran Tanımla</h2>
          <p className="pc-card__desc">
            Marka, kanal ve fiyat bandı bilgilerini eşleştirerek restoran kaydı oluşturun.
          </p>

          <form
            className="pc-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleMatch()
            }}
          >
            <PriceSelect
              id="pc-brand"
              label="Marka"
              value={brand}
              onChange={setBrand}
              placeholder="Marka seçiniz"
              options={BRANDS.map((b) => ({ value: b, label: b }))}
            />

            <div className="pc-form__field pc-form__field--channel">
              <label className="pc-form__label" htmlFor="pc-channel-id">
                Kanal ID
              </label>
              <div className="pc-channel-search">
                <input
                  id="pc-channel-id"
                  type="text"
                  className="pc-input"
                  value={channelId}
                  onChange={handleChannelIdChange}
                  onFocus={() => setChannelFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setChannelFocused(false), 160)
                  }}
                  placeholder="Örn. 172002"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  aria-autocomplete="list"
                  aria-controls={channelSuggestions.length ? 'pc-channel-suggest' : undefined}
                  aria-expanded={channelFocused && channelSuggestions.length > 0}
                />
                {channelFocused && channelSuggestions.length > 0 ? (
                  <ul id="pc-channel-suggest" className="pc-channel-suggest" role="listbox">
                    {channelSuggestions.map((item) => (
                      <li key={item.channelId} role="option">
                        <button
                          type="button"
                          className="pc-channel-suggest__item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyRestaurantSuggestion(item)}
                        >
                          <span className="pc-channel-suggest__id">{item.channelId}</span>
                          <span className="pc-channel-suggest__meta">{item.caption}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <PriceSelect
              id="pc-product-group"
              label="Ürün Grubu"
              value={productGroup}
              onChange={setProductGroup}
              placeholder="Ürün grubu seçiniz"
              options={PRODUCT_GROUPS.map((g) => ({ value: g.id, label: g.label }))}
            />

            <div className="pc-form__field pc-form__field--band">
              <label className="pc-form__label" htmlFor="pc-price-band">
                Fiyat Bandı
              </label>
              <div className="pc-form__bandRow">
                <div className="pc-form__bandSelect">
                  <PriceSelect
                    id="pc-price-band"
                    label="Fiyat Bandı"
                    hideLabel
                    value={priceBand}
                    onChange={setPriceBand}
                    placeholder="Fiyat bandı seçiniz"
                    options={priceBandOptions}
                  />
                </div>
                {selectedBand ? (
                  <span className="pc-form__bandCode" title="Band kodu">
                    {selectedBand.code}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pc-form__field">
              <span className="pc-form__label">Fiyat Bandı Tipi</span>
              <div className="pc-toggle" role="group" aria-label="Fiyat bandı tipi">
                {BAND_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`pc-toggle__btn ${bandType === t.id ? 'pc-toggle__btn--active' : ''}`}
                    aria-pressed={bandType === t.id}
                    onClick={() => setBandType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {formError ? <p className="pc-form__error">{formError}</p> : null}

            <div className="pc-form__actions">
              <button type="submit" className="pc-btn pc-btn--primary">
                Eşleştir
              </button>
            </div>
          </form>
        </section>
      </main>

      {toast ? (
        <div className="pc-toast" role="status">
          <CheckCircle2 size={18} aria-hidden />
          <span>{toast}</span>
        </div>
      ) : null}
    </div>
  )
}
