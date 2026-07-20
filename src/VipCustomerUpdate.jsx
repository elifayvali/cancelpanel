import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { VipPhoneInput } from './VipPhoneInput'
import {
  formatVipPhone,
  isCompleteVipPhone,
  restDigitsFromFull,
  searchVipPhones,
  updateVipPhone,
} from './vipPhone'
import './PriceComparison.css'

export default function VipCustomerUpdate() {
  const [searchDigits, setSearchDigits] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newDigits, setNewDigits] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState(null)
  const [listTick, setListTick] = useState(0)

  const updateEnabled = Boolean(selected)

  const suggestions = useMemo(() => {
    if (!searchFocused) return []
    return searchVipPhones(searchDigits || restDigitsFromFull(searchDigits))
  }, [searchFocused, searchDigits, listTick])

  useEffect(() => {
    if (!selected) return
    const stillThere = searchVipPhones('').some((item) => item.digits === selected.digits)
    if (!stillThere) {
      setSelected(null)
      setNewDigits('')
    }
  }, [listTick, selected])

  const handleSearchChange = useCallback((fullDigits) => {
    setSearchDigits(fullDigits)
    setFormError('')
    if (selected && selected.digits !== fullDigits) {
      setSelected(null)
      setNewDigits('')
    }
  }, [selected])

  const handleSelectPhone = useCallback((item) => {
    setSelected(item)
    setSearchDigits(item.digits)
    setNewDigits('')
    setSearchFocused(false)
    setFormError('')
  }, [])

  const handleNewPhoneChange = useCallback((fullDigits) => {
    setNewDigits(fullDigits)
    setFormError('')
  }, [])

  const handleUpdate = useCallback(() => {
    setFormError('')
    if (!selected) {
      setFormError('Güncellenecek telefon numarasını seçiniz.')
      return
    }
    if (!isCompleteVipPhone(newDigits)) {
      setFormError('Güncel numarada 5’ten sonraki haneleri eksiksiz giriniz.')
      return
    }

    const result = updateVipPhone(selected.digits, newDigits)
    if (!result.ok) {
      setFormError(result.error)
      return
    }

    setSelected(null)
    setSearchDigits('')
    setNewDigits('')
    setListTick((n) => n + 1)
    setToast('Telefon Numarası Güncellendi.')
    window.setTimeout(() => setToast(null), 3200)
  }, [selected, newDigits])

  return (
    <div className="pc-dash">
      <header className="pc-header">
        <div className="pc-header__inner">
          <div className="pc-header__meta">
            <h1 className="pc-header__title">Vip Müşteri Yönetimi</h1>
            <p className="pc-header__crumb">
              <span>Dashboard</span>
              <span className="pc-header__crumbSep">/</span>
              <span className="pc-header__crumbActive">Vip Müşteri Güncelle</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main">
        <section className="pc-card">
          <h2 className="pc-card__title">Vip Müşteri Güncelle</h2>
          <p className="pc-card__desc">Kayıtlı vip müşteri telefon numarasını arayıp güncelleyin.</p>

          <form
            className="pc-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleUpdate()
            }}
          >
            <div className="pc-form__field pc-form__field--channel">
              <label className="pc-form__label" htmlFor="vip-search-phone">
                Telefon Numarası
              </label>
              <div className="pc-channel-search">
                <VipPhoneInput
                  id="vip-search-phone"
                  value={searchDigits}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setSearchFocused(false), 160)
                  }}
                />
                {searchFocused && suggestions.length > 0 ? (
                  <ul id="vip-phone-suggest" className="pc-channel-suggest" role="listbox">
                    {suggestions.map((item) => (
                      <li key={item.digits} role="option">
                        <button
                          type="button"
                          className="pc-channel-suggest__item"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectPhone(item)}
                        >
                          <span className="pc-channel-suggest__id">{item.display || formatVipPhone(item.digits)}</span>
                          <span className="pc-channel-suggest__meta">Kayıtlı vip numarası</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {searchFocused && suggestions.length === 0 ? (
                  <ul className="pc-channel-suggest" role="listbox">
                    <li>
                      <span className="pc-vip-suggest-empty">Kayıtlı numara bulunamadı</span>
                    </li>
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="pc-form__field">
              <label className="pc-form__label" htmlFor="vip-new-phone">
                Güncel Numara
              </label>
              <VipPhoneInput
                id="vip-new-phone"
                value={newDigits}
                onChange={handleNewPhoneChange}
                disabled={!updateEnabled}
              />
            </div>

            {formError ? <p className="pc-form__error">{formError}</p> : null}

            <div className="pc-form__actions">
              <button
                type="submit"
                className="pc-btn pc-btn--primary"
                disabled={!updateEnabled}
              >
                Güncelle
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
