/** VIP müşteri telefon numarası — format ve storage */

export const VIP_PHONE_STORAGE_KEY = 'vip-customer-phones'

/** Sabit önek — kullanıcı parantez içinden itibaren girer */
export const VIP_PHONE_FIXED_PREFIX = '+90 ('

export const VIP_PHONE_REST_PLACEHOLDER = '___) ___ __ __'

/** İlk hane yalnızca 5 veya 2 olabilir */
const VIP_FIRST_DIGITS = new Set(['2', '5'])

/** En fazla 10 ulusal hane (+90 sonrası); ilk hane 2 veya 5 */
export function normalizeVipDigits(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length > 10) {
    digits = digits.slice(2)
  }
  digits = digits.slice(0, 10)

  if (!digits.length) return ''
  while (digits.length && !VIP_FIRST_DIGITS.has(digits[0])) {
    digits = digits.slice(1)
  }

  return digits.slice(0, 10)
}

/**
 * Kullanıcı girişi kısmı: XXX) XXX XX XX
 */
export function formatVipRest(digitsOrRaw) {
  const d = normalizeVipDigits(digitsOrRaw)
  if (!d.length) return ''

  let out = d.slice(0, Math.min(3, d.length))
  if (d.length < 3) return out

  out += ')'
  if (d.length === 3) return out

  out += ` ${d.slice(3, Math.min(6, d.length))}`
  if (d.length <= 6) return out

  out += ` ${d.slice(6, Math.min(8, d.length))}`
  if (d.length <= 8) return out

  out += ` ${d.slice(8, 10)}`
  return out
}

/** Tam görünen numara: +90 (XXX) XXX XX XX */
export function formatVipPhone(digitsOrRaw) {
  const d = normalizeVipDigits(digitsOrRaw)
  const formattedRest = formatVipRest(d)
  if (!formattedRest) return VIP_PHONE_FIXED_PREFIX
  return `${VIP_PHONE_FIXED_PREFIX}${formattedRest}`
}

export function isCompleteVipPhone(digitsOrRaw) {
  const digits = normalizeVipDigits(digitsOrRaw)
  return digits.length === 10 && VIP_FIRST_DIGITS.has(digits[0])
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
