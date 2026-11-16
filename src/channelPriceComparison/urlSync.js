import { BANDS, BRANDS, GROUPS } from './catalog'

export const CHANNEL_QUERY = { TY: 'TRENDYOL_GO', MG: 'MIGROS' }
export const QUERY_CHANNEL = { TRENDYOL_GO: 'TY', MIGROS: 'MG' }

const STORAGE_KEY = 'fk-price-comparison-last-run'
const TTL_MS = 30 * 60 * 1000

export function sameFilters(a, b) {
  if (!a || !b) return false
  return a.brand === b.brand && a.groupId === b.groupId && a.bandId === b.bandId && a.channel === b.channel
}

export function buildQueryString(filters) {
  const params = []
  if (filters.brand) params.push(`ccsId=${encodeURIComponent(filters.brand)}`)
  if (filters.groupId) params.push(`productGroupId=${encodeURIComponent(filters.groupId)}`)
  if (filters.groupId && filters.bandId) params.push(`priceGroupId=${encodeURIComponent(filters.bandId)}`)
  if (filters.channel) params.push(`channel=${CHANNEL_QUERY[filters.channel] || filters.channel}`)
  return params.length ? `?${params.join('&')}` : ''
}

export function replaceUrl(filters) {
  const qs = buildQueryString(filters)
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${qs}${window.location.hash}`)
  } catch {
    /* ignore */
  }
}

const PARAM_KEYS = new Set(['ccsId', 'productGroupId', 'priceGroupId', 'channel'])

export function hasPriceComparisonQuery(search = window.location.search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return [...params.keys()].some((key) => PARAM_KEYS.has(key))
}

/**
 * @returns {{ filters: { brand: string, groupId: string, bandId: string, channel: string }, fromLink: boolean, linkInvalid: boolean }}
 */
export function parseLinkSearch(search = window.location.search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (![...params.keys()].some((key) => PARAM_KEYS.has(key))) {
    return { filters: null, fromLink: false, linkInvalid: false }
  }

  let linkInvalid = false
  const brandRaw = params.get('ccsId') || ''
  const groupRaw = params.get('productGroupId') || ''
  const bandRaw = params.get('priceGroupId') || ''
  const channelRaw = params.get('channel') || ''

  const okBrand = BRANDS.some((b) => String(b.ccsId) === brandRaw)
  if (brandRaw && !okBrand) linkInvalid = true
  const brand = okBrand ? brandRaw : ''

  const okGroup = brand && GROUPS.some((g) => g.id === groupRaw)
  if (groupRaw && !okGroup) linkInvalid = true
  const groupId = okGroup ? groupRaw : ''

  const okBand = groupId && (BANDS[groupId] || []).some((b) => b.id === bandRaw)
  if (bandRaw && !okBand) linkInvalid = true
  const bandId = okBand ? bandRaw : ''

  const okChannel = !!QUERY_CHANNEL[channelRaw]
  if (channelRaw && !okChannel) linkInvalid = true
  if (!channelRaw) linkInvalid = true
  if (!brand) linkInvalid = true

  const channel = okChannel ? QUERY_CHANNEL[channelRaw] : ''

  const filters = { brand, groupId, bandId, channel }
  replaceUrl(filters)
  return { filters, fromLink: true, linkInvalid }
}

export function loadSavedRun() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.savedAt || Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function saveSavedRun(filters, comparedAt) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        filters,
        comparedAt,
        savedAt: Date.now(),
      }),
    )
  } catch {
    /* ignore */
  }
}