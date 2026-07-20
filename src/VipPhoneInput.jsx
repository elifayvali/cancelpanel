import {
  VIP_PHONE_FIXED_PREFIX,
  VIP_PHONE_REST_PLACEHOLDER,
  formatVipRest,
  normalizeVipRestDigits,
  restDigitsFromFull,
  toFullVipDigits,
} from './vipPhone'

/**
 * Sabit önek +90 (5 — kullanıcı yalnızca sonrasını girer.
 * @param {{
 *   id: string
 *   value: string  // tam digits (5XXXXXXXXX) veya boş
 *   onChange: (fullDigits: string) => void
 *   disabled?: boolean
 *   onFocus?: () => void
 *   onBlur?: () => void
 * }} props
 */
export function VipPhoneInput({ id, value, onChange, disabled = false, onFocus, onBlur }) {
  const rest = restDigitsFromFull(value)
  const restDisplay = formatVipRest(rest)

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
          const nextRest = normalizeVipRestDigits(e.target.value)
          onChange(nextRest.length ? toFullVipDigits(nextRest) : '')
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={VIP_PHONE_REST_PLACEHOLDER}
        inputMode="numeric"
        autoComplete="tel"
        spellCheck={false}
        aria-label="Telefon numarası, +90 5 sabit"
      />
    </div>
  )
}
