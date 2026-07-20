/** VIP müşteri telefon numarası — format ve storage */

export const VIP_PHONE_STORAGE_KEY = 'vip-customer-phones'

/** Sabit önek — kullanıcı yalnızca 5'ten sonraki haneleri girer */
export const VIP_PHONE_FIXED_PREFIX = '+90 (5'

export const VIP_PHONE_REST_PLACEHOLDER = '__) ___ __ __'

/** 5'ten sonraki en fazla 9 rakam */
export function normalizeVipRestDigits(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')

  if (digits.startsWith('90') && digits.length >= 3) {
    digits = digits.slice(2)
  }
  if (digits.startsWith('5')) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 9)
}

export function toFullVipDigits(restDigits) {
  const rest = normalizeVipRestDigits(restDigits)
  return rest.length ? `5${rest}` : ''
}

export function restDigitsFromFull(fullDigitsOrRaw) {
  let digits = String(fullDigitsOrRaw ?? '').replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2)
  if (digits.startsWith('5')) return digits.slice(1, 10)
  return digits.slice(0, 9)
}

/** 5'ten sonraki kısım: XX) XXX XX XX */
export function formatVipRest(restDigitsOrRaw) {
  const d = normalizeVipRestDigits(restDigitsOrRaw)
  if (!d.length) return ''

  let out = d.slice(0, Math.min(2, d.length))
  if (d.length < 2) return out

  out += ')'
  if (d.length === 2) return out

  out += ` ${d.slice(2, Math.min(5, d.length))}`
  if (d.length <= 5) return out

  out += ` ${d.slice(5, Math.min(7, d.length))}`
  if (d.length <= 7) return out

  out += ` ${d.slice(7, 9)}`
  return out
}

/** Tam görünen numara: +90 (5XX) XXX XX XX */
export function formatVipPhone(digitsOrRaw) {
  const rest = restDigitsFromFull(digitsOrRaw)
  const formattedRest = formatVipRest(rest)
  if (!formattedRest) return VIP_PHONE_FIXED_PREFIX
  return `${VIP_PHONE_FIXED_PREFIX}${formattedRest}`
}

export function normalizeVipDigits(raw) {
  const rest = normalizeVipRestDigits(raw)
  return rest.length ? toFullVipDigits(rest) : ''
}

export function isCompleteVipPhone(digitsOrRaw) {
  const digits = normalizeVipDigits(digitsOrRaw)
  return digits.length === 10 && digits.startsWith('5')
}

export function loadVipPhones() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VIP_PHONE_STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persistVipPhones(list) {
  localStorage.setItem(VIP_PHONE_STORAGE_KEY, JSON.stringify(list))
}

export function saveVipPhone(digitsOrRaw) {
  const digits = normalizeVipDigits(digitsOrRaw)
  if (!isCompleteVipPhone(digits)) {
    return { ok: false, error: 'Geçerli bir telefon numarası giriniz.' }
  }

  const list = loadVipPhones()
  if (list.some((item) => item.digits === digits)) {
    return { ok: false, error: 'Bu telefon numarası zaten kayıtlı.' }
  }

  list.unshift({
    digits,
    display: formatVipPhone(digits),
    savedAt: new Date().toISOString(),
  })
  persistVipPhones(list)
  return { ok: true, phone: list[0] }
}

export function updateVipPhone(oldDigits, newDigitsOrRaw) {
  const from = normalizeVipDigits(oldDigits)
  const to = normalizeVipDigits(newDigitsOrRaw)

  if (!isCompleteVipPhone(from)) {
    return { ok: false, error: 'Güncellenecek numarayı seçiniz.' }
  }
  if (!isCompleteVipPhone(to)) {
    return { ok: false, error: 'Geçerli bir telefon numarası giriniz.' }
  }

  const list = loadVipPhones()
  const index = list.findIndex((item) => item.digits === from)
  if (index < 0) {
    return { ok: false, error: 'Seçilen numara bulunamadı.' }
  }

  if (from !== to && list.some((item) => item.digits === to)) {
    return { ok: false, error: 'Yeni numara zaten kayıtlı.' }
  }

  list[index] = {
    digits: to,
    display: formatVipPhone(to),
    savedAt: new Date().toISOString(),
  }
  persistVipPhones(list)
  return { ok: true, phone: list[index] }
}

export function searchVipPhones(query) {
  const list = loadVipPhones()
  const q = String(query ?? '').trim()
  if (!q) return list.slice(0, 8)

  const qDigits = q.replace(/\D/g, '')
  const qLower = q.toLowerCase()

  return list
    .filter((item) => {
      if (qDigits && item.digits.includes(qDigits)) return true
      if (item.display.toLowerCase().includes(qLower)) return true
      return false
    })
    .slice(0, 8)
}
