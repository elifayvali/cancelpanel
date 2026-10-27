const tlFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 })

const numFmt = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatPrice(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '–'
  return tlFmt.format(Number(value))
}

export function formatDiff(diff) {
  if (diff == null || diff === '' || Number.isNaN(Number(diff))) return '–'
  const n = Number(diff)
  if (n === 0) return '–'
  const abs = numFmt.format(Math.abs(n))
  return n > 0 ? `+${abs}` : `−${abs}`
}

export function formatComparedAt(iso) {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STORE_STATUS_ORDER = { PRICE_DIFF: 0, MISSING: 1, OK: 2 }

export function sortStores(stores) {
  return [...stores].sort((a, b) => {
    const oa = STORE_STATUS_ORDER[a.storeStatus] ?? 9
    const ob = STORE_STATUS_ORDER[b.storeStatus] ?? 9
    if (oa !== ob) return oa - ob
    return (b.priceDiffCount ?? 0) - (a.priceDiffCount ?? 0)
  })
}

const PRODUCT_STATUS_ORDER = {
  PRICE_DIFF: 0,
  NOT_IN_CHANNEL: 1,
  NOT_IN_CCS: 2,
  GROUP_NOT_MATCHED: 3,
  CHANNEL_PASSIVE: 4,
  OK: 5,
}

export function sortProducts(rows) {
  return [...rows].sort((a, b) => {
    const oa = PRODUCT_STATUS_ORDER[a.status] ?? 9
    const ob = PRODUCT_STATUS_ORDER[b.status] ?? 9
    if (oa !== ob) return oa - ob
    return String(a.channelName || a.ccsName || '').localeCompare(String(b.channelName || b.ccsName || ''), 'tr')
  })
}

export function productDisplayName(row) {
  if (row.channelName && String(row.channelName).trim()) return row.channelName
  return row.ccsName || '–'
}

export function isProductNameMuted(row) {
  return !row.channelName || !String(row.channelName).trim()
}

export function isExpandableProductRow(row) {
  if (!row.optionGroups?.length) return false
  if (row.status === 'CHANNEL_PASSIVE' || row.status === 'NOT_IN_CHANNEL' || row.status === 'NOT_IN_CCS') {
    return false
  }
  return row.status === 'OK' || row.status === 'PRICE_DIFF'
}

export function statusLabel(status) {
  switch (status) {
    case 'OK':
      return 'Farksız'
    case 'PRICE_DIFF':
      return 'Fiyat farkı'
    case 'NOT_IN_CHANNEL':
      return 'Kanalda yok'
    case 'NOT_IN_CCS':
      return "CCS'te yok"
    case 'GROUP_NOT_MATCHED':
      return 'Karşılaştırılamadı'
    case 'CHANNEL_PASSIVE':
      return 'Kanalda pasif'
    case 'MISSING':
      return 'Eksik kayıt var'
    default:
      return status || '–'
  }
}

export function storeStatusLabel(status) {
  switch (status) {
    case 'OK':
      return 'Farksız'
    case 'PRICE_DIFF':
      return 'Fiyat farkı var'
    case 'MISSING':
      return 'Eksik kayıt var'
    default:
      return status || '–'
  }
}

export function groupStatusLabel(groupStatus) {
  switch (groupStatus) {
    case 'MATCHED':
      return 'Tür eşleşti'
    case 'NOT_MATCHED':
      return 'Karşılaştırılamadı · eşleşen opsiyon türü yok'
    case 'NOT_IN_CHANNEL':
      return 'Kanalda yok · opsiyon türü'
    default:
      return groupStatus || '–'
  }
}

export function productStatusTags(row) {
  const tags = []
  if (row.status === 'PRICE_DIFF') tags.push({ key: 'self-diff', label: 'Fiyat farkı', tone: 'orange' })
  else if (row.status === 'OK') {
    /* may add farksız below */
  } else if (row.status) {
    tags.push({ key: 'self', label: statusLabel(row.status), tone: toneForStatus(row.status) })
  }

  const os = row.optionSummary
  if (os?.priceDiff > 0) {
    tags.push({ key: 'opt-diff', label: `${os.priceDiff} opsiyon fiyat farkı`, tone: 'orange' })
  }
  if (os?.missing > 0) {
    tags.push({ key: 'opt-miss', label: `${os.missing} opsiyon eksik`, tone: 'blue' })
  }

  if (tags.length === 0 && row.status === 'OK') {
    tags.push({ key: 'ok', label: 'Farksız', tone: 'green' })
  }
  return tags
}

function toneForStatus(status) {
  switch (status) {
    case 'OK':
      return 'green'
    case 'PRICE_DIFF':
      return 'orange'
    case 'NOT_IN_CHANNEL':
    case 'GROUP_NOT_MATCHED':
      return 'blue'
    case 'NOT_IN_CCS':
      return 'red'
    case 'CHANNEL_PASSIVE':
      return 'gray'
    default:
      return 'gray'
  }
}

export function tagToneClass(tone) {
  return `cpc-tag cpc-tag--${tone}`
}

/** Durum filtresi chip değerleri */
export const DETAIL_FILTER_CHIPS = [
  { id: 'all', label: 'Tümü' },
  { id: 'PRICE_DIFF', label: 'Fiyat farkı' },
  { id: 'MISSING', label: 'Eksik kayıt' },
  { id: 'CHANNEL_PASSIVE', label: 'Kanalda pasif' },
  { id: 'OK', label: 'Farksız' },
]

function optionMatchesMissingFilter(opt, group) {
  if (
    opt.status === 'NOT_IN_CHANNEL' ||
    opt.status === 'NOT_IN_CCS' ||
    opt.status === 'GROUP_NOT_MATCHED'
  ) {
    return true
  }
  if (group?.groupStatus === 'NOT_IN_CHANNEL') return true
  return false
}

function rowMatchesFilter(row, filterId) {
  if (filterId === 'all') return true
  if (filterId === 'MISSING') {
    if (row.status === 'NOT_IN_CHANNEL' || row.status === 'NOT_IN_CCS' || row.status === 'GROUP_NOT_MATCHED') {
      return true
    }
    return false
  }
  if (filterId === 'PRICE_DIFF') {
    if (row.status === 'PRICE_DIFF') return true
    if (row.optionSummary?.priceDiff > 0) return true
    return false
  }
  if (filterId === 'CHANNEL_PASSIVE') return row.status === 'CHANNEL_PASSIVE'
  if (filterId === 'OK') {
    return row.status === 'OK' && !(row.optionSummary?.priceDiff > 0) && !(row.optionSummary?.missing > 0)
  }
  return false
}

function optionMatchesFilter(opt, group, filterId) {
  if (filterId === 'all') return true
  if (filterId === 'MISSING') return optionMatchesMissingFilter(opt, group)
  if (filterId === 'PRICE_DIFF') return opt.status === 'PRICE_DIFF'
  if (filterId === 'CHANNEL_PASSIVE') return opt.status === 'CHANNEL_PASSIVE'
  if (filterId === 'OK') return opt.status === 'OK'
  return false
}

/**
 * E8: filtre + arama; bağlam satırları için isContextRow
 * @returns {Array<{ row: object, isContextRow: boolean, forceOpen: boolean, visibleGroups: object[] }>}
 */
export function filterDetailProducts(rows, filterId, searchQuery) {
  const q = String(searchQuery ?? '')
    .trim()
    .toLocaleLowerCase('tr')
  const forceOpen = filterId !== 'all'

  return rows
    .map((row) => {
      const name = productDisplayName(row).toLocaleLowerCase('tr')
      const matchesSearch = !q || name.includes(q) || String(row.trendyolProductId ?? '').includes(q)

      const selfMatch = rowMatchesFilter(row, filterId)
      const visibleGroups = (row.optionGroups ?? [])
        .map((g) => {
          const opts = (g.options ?? []).filter((o) => optionMatchesFilter(o, g, filterId))
          if (filterId === 'all') return { ...g, options: g.options ?? [] }
          if (opts.length === 0) return null
          return { ...g, options: opts }
        })
        .filter(Boolean)

      const optionContext =
        filterId !== 'all' &&
        !selfMatch &&
        visibleGroups.some((g) => (g.options?.length ?? 0) > 0)

      const showRow = filterId === 'all' ? matchesSearch : matchesSearch && (selfMatch || optionContext)

      if (!showRow) return null

      return {
        row,
        isContextRow: optionContext,
        forceOpen,
        visibleGroups: filterId === 'all' ? row.optionGroups ?? [] : visibleGroups,
      }
    })
    .filter(Boolean)
}

export function optionRowMatchesProductFilter(row, filterId) {
  return rowMatchesFilter(row, filterId)
}
