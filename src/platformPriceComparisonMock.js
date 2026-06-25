/** Mock kanal / CCS fiyatları — Kontrol Et sonrası gösterilir */
export const MOCK_CATALOG = {
  default: [
    { name: 'SU', channelPrice: 45, ccsPrice: 45 },
    { name: 'AYRAN', channelPrice: 65, ccsPrice: 50 },
    { name: 'COLA', channelPrice: 75, ccsPrice: 70 },
    { name: 'PATATES', channelPrice: 89, ccsPrice: 89 },
  ],
  'Burger King': [
    { name: 'SU', channelPrice: 45, ccsPrice: 45 },
    { name: 'AYRAN', channelPrice: 65, ccsPrice: 50 },
    { name: 'WHOPPER', channelPrice: 289, ccsPrice: 275 },
  ],
  Popeyes: [
    { name: 'SU', channelPrice: 42, ccsPrice: 42 },
    { name: 'AYRAN', channelPrice: 62, ccsPrice: 55 },
    { name: 'CHICKEN', channelPrice: 199, ccsPrice: 189 },
  ],
  "Arby's": [
    { name: 'SU', channelPrice: 48, ccsPrice: 48 },
    { name: 'AYRAN', channelPrice: 68, ccsPrice: 60 },
    { name: 'ROAST BEEF', channelPrice: 249, ccsPrice: 239 },
  ],
}

export const MOCK_MISSING_NOTICES = [
  "Double Cheeseburger CCS'te bulunamadı",
  'Texas Burger platformda bulunamadı',
]

export function formatTl(amount) {
  return `${amount} TL`
}

export function diffLabel(channelPrice, ccsPrice) {
  const diff = channelPrice - ccsPrice
  if (diff === 0) return { text: '—', tone: 'match' }
  return { text: `${Math.abs(diff)} TL`, tone: 'high' }
}

export function filterDiffRows(rows) {
  return rows.filter((row) => row.channelPrice !== row.ccsPrice)
}

export function getCatalogForBrand(brand) {
  return MOCK_CATALOG[brand] ?? MOCK_CATALOG.default
}
