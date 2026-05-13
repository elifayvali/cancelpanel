/**
 * Bilinen markalar için logo URL’leri (Wikimedia veya `public/brand-logos/`).
 * Eşleşme yoksa veya görsel yüklenemezse carousel bileşeni baş harf gösterir.
 *
 * Subway / Arby’s: Commons resmi vektör türevleri (yerel PNG’ler karışıyordu).
 * — https://commons.wikimedia.org/wiki/File:Subway_2016_logo.svg
 * — https://commons.wikimedia.org/wiki/File:Arby%27s_logo.svg
 */
const LOGO_SUBWAY_WM =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/120px-Subway_2016_logo.svg.png'
const LOGO_ARBYS_WM =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Arby%27s_logo.svg/120px-Arby%27s_logo.svg.png'

const ENTRIES = [
  ['BURGER KING', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/120px-Burger_King_2020.svg.png'],
  ['POPEYES', '/brand-logos/popeyes.png'],
  ['SUBWAY', LOGO_SUBWAY_WM],
  ["ARBY'S", LOGO_ARBYS_WM],
  ['SBARRO', '/brand-logos/sbarro.png'],
  ['KFC', 'https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/120px-KFC_logo.svg.png'],
  ['STARBUCKS', 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/120px-Starbucks_Corporation_Logo_2011.svg.png'],
  ['MCDONALDS', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/120px-McDonald%27s_Golden_Arches.svg.png'],
  ['BURGER CITY', '/brand-logos/burger-city.png'],
  ['DÖNER STOP', '/brand-logos/doner-stop.png'],
]

/** @type {Map<string, string>} */
const MAP = new Map(ENTRIES)

function normalizeBrandKey(brand) {
  return String(brand ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('tr-TR')
}

/**
 * @param {string} brand
 * @returns {string | null}
 */
export function getBrandLogoUrl(brand) {
  const k = normalizeBrandKey(brand)
  if (MAP.has(k)) return MAP.get(k) ?? null

  if (k.startsWith('BURGER KING')) return MAP.get('BURGER KING') ?? null
  if (k.startsWith('POPEYES')) return MAP.get('POPEYES') ?? null
  if (k.startsWith('SUBWAY')) return MAP.get('SUBWAY') ?? null
  if (k.startsWith('SBARRO')) return MAP.get('SBARRO') ?? null

  /* Yerel görseller — tabloda kısaltılmış / farklı yazımlar */
  if (k.includes('PİDEC') || k.includes('PIDEC')) return '/brand-logos/usta-pideci.png'
  if (k.includes('DÖNERC') || k.includes('DONERC')) return '/brand-logos/usta-donerci.png'
  if (k.includes('SUBWAY')) return LOGO_SUBWAY_WM
  if (k.includes('SBARRO')) return '/brand-logos/sbarro.png'
  if (k.includes('ARBY')) return LOGO_ARBYS_WM
  if (k.includes('AMASYA')) return '/brand-logos/amasya-et.png'
  if (k.includes('MİLGO') || k.includes('MILGO')) return '/brand-logos/milgo.png'
  if (k.includes('BURGER CITY')) return '/brand-logos/burger-city.png'
  if (k.includes('DÖNER STOP') || k.includes('DONER STOP')) return '/brand-logos/doner-stop.png'

  if (k.startsWith('KFC')) return MAP.get('KFC') ?? null
  if (k.startsWith('STARBUCKS')) return MAP.get('STARBUCKS') ?? null
  if (k.startsWith('MCDONALD')) return MAP.get('MCDONALDS') ?? null
  return null
}
