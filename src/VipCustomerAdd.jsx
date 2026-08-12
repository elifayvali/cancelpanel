import { useCallback, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { VipPhoneInput } from './VipPhoneInput'
import { isCompleteVipPhone, saveVipPhone } from './vipPhone'
import './PriceComparison.css'

export default function VipCustomerAdd() {
  const [digits, setDigits] = useState('')
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState(null)

  const handlePhoneChange = useCallback((fullDigits) => {
    setDigits(fullDigits)
    setFormError('')
  }, [])

  const handleSave = useCallback(() => {
    setFormError('')
    if (!isCompleteVipPhone(digits)) {
      setFormError('Telefon numarasını +90 (5__) ___ __ __ veya +90 (2__) ___ __ __ formatında eksiksiz giriniz.')
      return
    }

    const result = saveVipPhone(digits)
    if (!result.ok) {
      setFormError(result.error)
      return
    }

    setDigits('')
    setToast('Telefon Numarası Kaydedildi.')
    window.setTimeout(() => setToast(null), 3200)
  }, [digits])

  return (
    <div className="pc-dash">
      <header className="pc-header">
        <div className="pc-header__inner">
          <div className="pc-header__meta">
            <h1 className="pc-header__title">Vip Müşteri Yönetimi</h1>
            <p className="pc-header__crumb">
              <span>Dashboard</span>
              <span className="pc-header__crumbSep">/</span>
              <span className="pc-header__crumbActive">Yeni Vip Müşteri Ekle</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main">
        <section className="pc-card">
          <h2 className="pc-card__title">Yeni Vip Müşteri Ekle</h2>
          <p className="pc-card__desc">Yeni vip müşteri telefon numarası kaydı oluşturun.</p>

          <form
            className="pc-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div className="pc-form__field">
              <label className="pc-form__label" htmlFor="vip-add-phone">
                Telefon Numarası
              </label>
              <VipPhoneInput
                id="vip-add-phone"
                value={digits}
                onChange={handlePhoneChange}
              />
            </div>

            {formError ? <p className="pc-form__error">{formError}</p> : null}

            <div className="pc-form__actions">
              <button type="submit" className="pc-btn pc-btn--primary">
                Kaydet
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
