/** Mock kanal / CCS fiyatları — Kontrol Et sonrası gösterilir */
import { WHOPPER_MENU_OPTIONS } from './whopperMenuOptionsData'

export const FILTER_MIN_CHARS = 3

const NCR_IDS = ['NCR-10021', 'NCR-10035', 'NCR-10048', 'NCR-10052']

const MOCK_PRODUCT_NAMES = [
  'AYRAN',
  'WHOPPER',
  'WHOPPER MENÜ',
  'WHOPPER MENÜ BÜYÜK',
  'WHOPPER MENÜ ÇİFT',
  'WHOPPER MENÜ KİNG',
  'WHOPPER MENÜ JR',
  'DOUBLE KING',
  'CHICKEN ROYALE',
  'BIG KING',
  'KING CHICKEN',
  'PATATES KIZARTMASI',
  'SOĞAN HALKASI',
  'COLA',
  'COLA ZERO',
  'FANTA',
  'SPRITE',
  'MILKSHAKE ÇİKOLATA',
  'MILKSHAKE VANİLYA',
  'CHEESEBURGER',
  'DOUBLE CHEESEBURGER',
  'TEXAS BURGER',
  'CRISPY CHICKEN',
  'SPICY CHICKEN',
  'TENDERS 6LI',
  'TENDERS 9LU',
  'KING NUGGETS 6',
  'KING NUGGETS 9',
  'SUNDAE ÇİKOLATA',
  'SUNDAE KARAMEL',
  'MINI DONUT 6LI',
  'APPLE PIE',
]

function buildMockCatalog() {
  return MOCK_PRODUCT_NAMES.map((name, index) => {
    const base = 45 + (index % 12) * 18
    const channelPrice = base + 8 + (index % 4) * 3
    let ccsPrice = base + (index % 5)
    if (ccsPrice === channelPrice) ccsPrice -= 5
    return {
      name,
      channelPrice,
      ccsPrice,
      ncrId: NCR_IDS[index % NCR_IDS.length],
    }
  })
}

const SHARED_CATALOG = buildMockCatalog()

export const MOCK_CATALOG = {
  default: SHARED_CATALOG,
  'Burger King': SHARED_CATALOG,
  Popeyes: SHARED_CATALOG,
  "Arby's": SHARED_CATALOG,
}

export const MOCK_MISSING_NOTICES = ["Double Cheeseburger CCS'te bulunamadı"]

export { diffLabel } from './priceDiff'

/** WHOPPER MENÜ içeren tüm ürünler genişletilebilir */
export function isExpandableProduct(name) {
  return name.toUpperCase().includes('WHOPPER MENÜ')
}

export function getProductDetailContent(name) {
  if (!isExpandableProduct(name)) return null
  return { options: WHOPPER_MENU_OPTIONS }
}

export function formatTl(amount) {
  return `${amount} TL`
}

export function filterDiffRows(rows) {
  return rows.filter((row) => row.channelPrice !== row.ccsPrice)
}

export function filterProductRows(rows, { productName = '', ncrId = '' } = {}) {
  const nameQ = productName.trim()
  const ncrQ = ncrId.trim()
  const nameActive = nameQ.length >= FILTER_MIN_CHARS
  const ncrActive = ncrQ.length >= FILTER_MIN_CHARS
  const nameLower = nameQ.toLowerCase()
  const ncrLower = ncrQ.toLowerCase()

  return rows.filter((row) => {
    if (ncrActive && !row.ncrId.toLowerCase().includes(ncrLower)) return false
    if (nameActive && !row.name.toLowerCase().includes(nameLower)) return false
    return true
  })
}

export function getCatalogForBrand(brand) {
  return MOCK_CATALOG[brand] ?? MOCK_CATALOG.default
}
