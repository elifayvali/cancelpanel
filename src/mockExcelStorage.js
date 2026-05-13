import { CHANNEL_LABELS } from './channelLabels'

const STORAGE_KEY_ROWS = 'cancelpanel-rkd-mock-rows'
const STORAGE_KEY_META = 'cancelpanel-rkd-mock-meta'
const STORAGE_KEY_DASHBOARD = 'cancelpanel-rkd-mock-dashboard-json'

/**
 * Bozuk / eski kayıtlar ekranda patlamasın (ör. name yok → toLowerCase hatası).
 * @param {unknown} r
 */
function sanitizeRestaurantRow(r) {
  if (!r || typeof r !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (r)
  const channels = Array.isArray(o.channels) ? o.channels : []
  const id = String(o.id ?? '').trim() || `row-${Math.random().toString(36).slice(2, 9)}`
  const name = String(o.name ?? id).trim() || id
  return {
    ...o,
    id,
    name,
    globalId: o.globalId != null && String(o.globalId).trim() !== '' ? String(o.globalId) : '—',
    brand: String(o.brand ?? '—'),
    city: String(o.city ?? '—'),
    homeDelivery: String(o.homeDelivery ?? '—'),
    channels,
  }
}

/**
 * Önce ham satırlar; yoksa Excel→JSON snapshot içindeki restoran listesi (widget mock tek kaynak).
 * @returns {unknown[]}
 */
export function loadMockRowsOrDashboardRestaurants() {
  let list = []
  const loaded = loadMockRowsFromStorage()
  if (Array.isArray(loaded) && loaded.length > 0) {
    list = loaded
    clearMockDashboardSnapshot()
  } else {
    const dash = loadMockDashboardSnapshot()
    const rows = dash?.kanalEntegrasyonDurumlari?.restoranlar
    if (Array.isArray(rows)) list = rows
  }
  return list.map(sanitizeRestaurantRow).filter(Boolean)
}

function isQuotaExceededError(e) {
  return (
    e instanceof DOMException &&
    (e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError')
  )
}

/**
 * Yeni Excel yüklendiğinde eski mock + (eski sürümdeki) ağır dashboard JSON anahtarını siler,
 * yalnızca satır listesi ve dosya adı meta kaydedilir (localStorage kotası için tekrar yok).
 * @param {unknown[]} rows
 * @param {{ names: string[] }} meta
 */
export function replaceMockExcelDataset(rows, meta) {
  const rowsJson = JSON.stringify(rows)
  const metaJson = JSON.stringify(meta)
  localStorage.removeItem(STORAGE_KEY_DASHBOARD)
  try {
    localStorage.setItem(STORAGE_KEY_ROWS, rowsJson)
    localStorage.setItem(STORAGE_KEY_META, metaJson)
  } catch (e) {
    if (!isQuotaExceededError(e)) throw e
    localStorage.removeItem(STORAGE_KEY_ROWS)
    localStorage.removeItem(STORAGE_KEY_META)
    localStorage.setItem(STORAGE_KEY_ROWS, rowsJson)
    localStorage.setItem(STORAGE_KEY_META, metaJson)
  }
}

/** Eski sürüm: yalnızca dashboard anahtarı kaldıysa restoran listesini buradan okur. */
export function loadMockDashboardSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DASHBOARD)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (
      o &&
      o.kanalEntegrasyonDurumlari &&
      Array.isArray(o.kanalEntegrasyonDurumlari.restoranlar)
    ) {
      if (o.kanal?.etiketler?.length === CHANNEL_LABELS.length) {
        o.kanal.etiketler = [...CHANNEL_LABELS]
      }
      if (o.meta?.kanalEtiketleri?.length === CHANNEL_LABELS.length) {
        o.meta.kanalEtiketleri = [...CHANNEL_LABELS]
      }
      return o
    }
    return null
  } catch {
    return null
  }
}

export function clearMockDashboardSnapshot() {
  localStorage.removeItem(STORAGE_KEY_DASHBOARD)
}

export function loadMockRowsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROWS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveMockRowsToStorage(rows) {
  localStorage.setItem(STORAGE_KEY_ROWS, JSON.stringify(rows))
}

export function clearMockRowsStorage() {
  localStorage.removeItem(STORAGE_KEY_ROWS)
  localStorage.removeItem(STORAGE_KEY_META)
  clearMockDashboardSnapshot()
}

export function loadMockMetaFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (o && Array.isArray(o.names)) return { names: o.names }
    return null
  } catch {
    return null
  }
}

export function saveMockMetaToStorage(meta) {
  localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta))
}
