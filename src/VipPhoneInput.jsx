import {
  VIP_PHONE_FIXED_PREFIX,
  VIP_PHONE_REST_PLACEHOLDER,
  formatVipRest,
  normalizeVipDigits,
} from './vipPhone'

/**
 * Sabit önek +90 ( — kullanıcı (___) ___ __ __ kısmını girer.
 * @param {{
 *   id: string
 *   value: string  // 10 haneli ulusal digits veya boş
 *   onChange: (fullDigits: string) => void
 *   disabled?: boolean
 *   onFocus?: () => void
 *   onBlur?: () => void
 * }} props
 */
export function VipPhoneInput({ id, value, onChange, disabled = false, onFocus, onBlur }) {
  const digits = normalizeVipDigits(value)
  const restDisplay = formatVipRest(digits)

  return (
    <div className={`pc-phone-field ${disabled ? 'pc-phone-field--disabled' : ''}`}>
      <span className="pc-phone-field__prefix" aria-hidden>
        {VIP_PHONE_FIXED_PREFIX}
      </span>
      <input
        id={id}
        type="tel"
        className="pc-input pc-input--phone pc-phone-field__input"
        value={restDisplay}
        disabled={disabled}
        onChange={(e) => {
          onChange(normalizeVipDigits(e.target.value))
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={VIP_PHONE_REST_PLACEHOLDER}
        inputMode="numeric"
        autoComplete="tel"
        spellCheck={false}
        aria-label="Telefon numarası, +90 sabit"
      />
    </div>
  )
}
