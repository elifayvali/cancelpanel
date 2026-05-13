import * as XLSX from 'xlsx'
import { CHANNEL_LABELS } from './channelLabels'

export function pickLatestPerFileName(files) {
  const byName = new Map()
  for (const f of files) {
    const prev = byName.get(f.name)
    if (!prev || f.lastModified > prev.lastModified) {
      byName.set(f.name, f)
    }
  }
  const picked = Array.from(byName.values())
  const skippedOlder = []
  for (const f of files) {
    const winner = byName.get(f.name)
    if (winner && f !== winner && f.lastModified < winner.lastModified) {
      skippedOlder.push({
        fileName: f.name,
        keptModified: winner.lastModified,
        skippedModified: f.lastModified,
      })
    }
  }
  return { picked, skippedOlder }
}

function normalizeHeader(h) {
  return String(h ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ı/g, 'i')
}

function getCell(raw, aliases) {
  const wanted = new Set(aliases.map((a) => normalizeHeader(a)))
  for (const k of Object.keys(raw)) {
    const nk = normalizeHeader(k)
    if (wanted.has(nk)) return raw[k]
  }
  return ''
}

function parseNumericCell(v) {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const s = String(v ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')
  const n = Number(s)
  return Number.isNaN(n) ? NaN : n
}

/** Örn. YemekSepeti → Yemek Sepeti (Excel başlıkları genelde boşluklu) */
function splitCamelCaseWords(s) {
  return s.replace(/([a-zğüşöçı])([A-ZĞÜŞİÖÇİ])/g, '$1 $2')
}

function getChannelCell(raw, index) {
  const keys = Object.keys(raw)
  const label = CHANNEL_LABELS[index - 1]
  const underscoreLabel = label.replace(/\s+/g, '_')
  const spacedLabel = splitCamelCaseWords(label)
  const shortPrefixes = [
    ['yemeksep', 'yemek sep', 'yemeksepeti st', 'yemeksepetis'],
    [
      'yemeksepexpress',
      'yemek sep express',
      'yemeksepetiexp',
      'yemeksepeti e',
      'yemeksepeti expr',
      'yemeksepeti express',
    ],
    ['trendyol', 'trendyol s', 'trendyol_s'],
    ['trendyolgo', 'trendyol g', 'trendyolg', 'trendyolgo stat', 'trendyolgo sta'],
    ['getir', 'getir stat', 'getir_sta'],
    ['migros', 'migros sta', 'migros_stat'],
    ['sanagelsin', 'sana gelsin', 'sanagelsir', 'sanagelsin stat', 'sanagelsin sta'],
    [
      'gelal_status',
      'gelal',
      'gelal stat',
      'gelal_sta',
      'gel al',
    ],
    ['aragelsin', 'ara gelsin', 'aragelsin', 'aragelsin statu', 'aragelsin stat', 'aragelsin sta'],
  ]
  const patterns = new Set([
    normalizeHeader(`kanal ${index}`),
    normalizeHeader(`kanal${index}`),
    normalizeHeader(`k ${index}`),
    normalizeHeader(`k${index}`),
    normalizeHeader(`channel ${index}`),
    normalizeHeader(`ch ${index}`),
    normalizeHeader(label),
    normalizeHeader(spacedLabel),
    normalizeHeader(underscoreLabel),
    normalizeHeader(`${label}_status`),
    normalizeHeader(`${spacedLabel}_status`),
    normalizeHeader(`${underscoreLabel}_status`),
  ])
  const shorts = shortPrefixes[index - 1] ?? []
  for (const p of shorts) {
    patterns.add(normalizeHeader(p))
    patterns.add(normalizeHeader(`${p} status`))
    patterns.add(normalizeHeader(`${p}_status`))
  }
  for (const k of keys) {
    if (patterns.has(normalizeHeader(k))) return raw[k]
  }
  return ''
}

export function normalizeChannelState(v) {
  const s = String(v ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
  if (!s || s === '-' || s === '—' || s === 'n/a' || s === 'na' || s === 'bos' || s === 'boş') {
    return 'na'
  }
  if (['açik', 'acik', 'open', 'evet', 'yes', '1', 'true', 'x', 'v'].includes(s)) {
    return 'open'
  }
  if (['kapali', 'kapalı', 'closed', 'hayir', 'hayır', 'no', '0', 'false'].includes(s)) {
    return 'closed'
  }
  if (
    s.includes('kanalda_tanimli_degil') ||
    s.includes('tanimli_degil') ||
    (s.includes('taniml') && (s.includes('degil') || s.includes('değil')))
  ) {
    return 'na'
  }
  /** Kanalda tanımlı (kesik: Kanalda_Taniml) = kanalda kayıtlı → açık */
  if (/^kanalda[_-]?taniml/i.test(s)) {
    return 'open'
  }
  /** Yalnızca Kanalda_T… ve tanım yok → tanımsız */
  if (s.startsWith('kanalda_t')) {
    return 'na'
  }
  return 'na'
}

const ROW_ID_SEP = '\u001f'

/**
 * @param {Record<string, string>} raw
 * @param {('open' | 'closed' | 'na')[] | null} [channelStatesOverride] tbs_home sonrası 9 kanal sütunu (çift başlık güvenli)
 * @param {number} [dataRowOrdinal] Aynı dosyada satır sırası (yalnızca birleşik anahtar boşsa)
 */
function mapExcelRow(raw, channelStatesOverride, dataRowOrdinal) {
  const restoranId = String(getCell(raw, ['restoran_id', 'restoran id'])).trim()
  const nameRaw = String(
    getCell(raw, [
      'name',
      'restoran adı',
      'restoran adi',
      'restoran_adi',
      'restoran',
      'restaurant name',
      'store name',
      'şube',
      'sube',
      'şube adı',
      'sube adi',
      'isletme adi',
      'işletme adı',
    ]),
  ).trim()
  const globalRaw = getCell(raw, [
    'global id',
    'globalid',
    'global_id',
    'tbs_global',
    'tbs global',
    'tbs_globalstore_id',
    'tbs_globalstoreid',
    'global store id',
    'magaza id',
    'mağaza id',
  ])
  let globalId = String(globalRaw ?? '').trim()
  if (/^null$/i.test(globalId)) globalId = ''
  /** Yalnızca "0" → birçok satırda tekrarlanır; benzersiz id için equipment kullanılır */
  const globalIdForMerge = globalId === '0' ? '' : globalId
  const globalIdDisplay = globalId === '' ? '—' : globalId
  const equipmentRaw = String(
    getCell(raw, ['equipment', 'equipment id', 'equipmentid', 'equipmentId', 'ekipman kodu']),
  ).trim()
  const equipment = equipmentRaw || restoranId
  const brand = String(getCell(raw, ['marka', 'marka_adi', 'marka adi', 'brand'])).trim()
  const city = String(
    getCell(raw, ['il', 'şehir', 'sehir', 'sehir_adi', 'şehir adı', 'sehir adi', 'city']),
  ).trim()
  /** Raporlarda "name" sütunu yoksa: marka · şehir veya global / equipment */
  const geoLabel =
    brand && brand !== '—' && city && city !== '—'
      ? `${brand} · ${city}`
      : brand && brand !== '—'
        ? brand
        : city && city !== '—'
          ? city
          : ''
  const name =
    nameRaw ||
    geoLabel ||
    (globalIdDisplay !== '—' ? globalIdDisplay : '') ||
    restoranId ||
    equipment

  let homeDelivery = String(
    getCell(raw, ['evlere servis', 'evlere servis ', 'home delivery']),
  ).trim()
  if (!homeDelivery || homeDelivery === '—') {
    const ho = String(
      getCell(raw, [
        'tbs_ho',
        'tbs_home',
        'tbs home',
        'tbs_homedelivery',
        'tbs_homedeliver',
        'tbs home delivery',
      ]) ?? '',
    ).trim()
    if (ho === '1') homeDelivery = 'Evet'
    else if (ho === '0') homeDelivery = 'Hayır'
  }

  const channels =
    channelStatesOverride && channelStatesOverride.length === CHANNEL_LABELS.length
      ? [...channelStatesOverride]
      : CHANNEL_LABELS.map((_, i) => normalizeChannelState(getChannelCell(raw, i + 1)))

  const auditUser = String(
    getCell(raw, ['değişiklik kullanıcı', 'degisiklik kullanici', 'kullanıcı', 'kullanici', 'user']),
  ).trim()
  const auditAt = String(
    getCell(raw, ['değişiklik tarihi', 'degisiklik tarihi', 'tarih', 'date']),
  ).trim()
  const hours = String(getCell(raw, ['çalışma saatleri', 'calisma saatleri', 'saat'])).trim()

  const closeReasons = {}
  for (let i = 1; i <= CHANNEL_LABELS.length; i += 1) {
    const lab = CHANNEL_LABELS[i - 1]
    const reason = String(
      getCell(raw, [
        `kanal ${i} nedeni`,
        `kanal${i} nedeni`,
        `k${i} nedeni`,
        `${lab} nedeni`,
      ]),
    ).trim()
    if (reason) closeReasons[i] = reason
  }

  /** mergeExcelFiles Map anahtarı: yalnızca restoran_id tekrarlıyorsa tek satıra düşmesin diye ayırt edici alanlar birleştirilir */
  const idSegments = [
    globalIdForMerge,
    equipment,
    restoranId,
    city && city !== '—' ? city : '',
    brand && brand !== '—' ? brand : '',
    name,
  ]
    .map((s) => String(s ?? '').trim())
    .filter((s) => s !== '')
  const id =
    idSegments.length > 0
      ? idSegments.join(ROW_ID_SEP)
      : typeof dataRowOrdinal === 'number'
        ? `excel-row-${dataRowOrdinal}`
        : `row-${Math.random().toString(36).slice(2, 9)}`

  const kapaliRaw = getCell(raw, [
    'kapali_kanal_sayisi',
    'Kapali_Kanal_Sayisi',
    'kapali kanal sayisi',
    'Kapali_Kanal_S',
    'kapali_kanal_s',
    'kapalı kanal sayısı',
    'kapali_kanal',
    'kapali_kan',
    'kapali kan',
    'toplam_kapali_kanal',
  ])
  let kapaliKanalSayisi = null
  if (kapaliRaw !== '' && kapaliRaw != null && String(kapaliRaw).trim() !== '') {
    const n = parseNumericCell(kapaliRaw)
    if (!Number.isNaN(n)) kapaliKanalSayisi = Math.max(0, n)
  }

  const satisAcikRaw = getCell(raw, [
    'Satis_Acik_Kanal_Sayisi',
    'satis_acik_kanal_sayisi',
    'satis acik kanal sayisi',
  ])
  let satisAcikKanalSayisi = null
  if (satisAcikRaw !== '' && satisAcikRaw != null && String(satisAcikRaw).trim() !== '') {
    const n = parseNumericCell(satisAcikRaw)
    if (!Number.isNaN(n)) satisAcikKanalSayisi = Math.max(0, n)
  }

  const satisYapRaw = getCell(raw, [
    'Satis_Yapilabilir_Kanal_Sayisi',
    'satis_yapilabilir_kanal_sayisi',
    'satis yapilabilir kanal sayisi',
  ])
  let satisYapilabilirKanalSayisi = null
  if (satisYapRaw !== '' && satisYapRaw != null && String(satisYapRaw).trim() !== '') {
    const n = parseNumericCell(satisYapRaw)
    if (!Number.isNaN(n)) satisYapilabilirKanalSayisi = Math.max(0, n)
  }

  return {
    id,
    name: name || id,
    globalId: globalIdDisplay,
    equipmentId: equipment || '—',
    brand: brand || '—',
    city: city || '—',
    homeDelivery: homeDelivery && homeDelivery !== '—' ? homeDelivery : '—',
    kapaliKanalSayisi,
    satisAcikKanalSayisi,
    satisYapilabilirKanalSayisi,
    channels,
    detail: {
      closeReasons,
      audit: {
        user: auditUser || '—',
        at: auditAt || '—',
      },
      hours: hours || '—',
    },
  }
}

function buildRawFromHeaderRow(headerCells, valueRow) {
  /** @type {Record<string, string>} */
  const raw = {}
  const count = new Map()
  headerCells.forEach((h, j) => {
    const base = String(h ?? '').trim() || `__col${j}`
    const n = count.get(base) ?? 0
    count.set(base, n + 1)
    const key = n === 0 ? base : `${base}__${n}`
    const v = valueRow[j]
    raw[key] = v !== undefined && v !== null ? String(v) : ''
  })
  return raw
}

/** SheetJS çoğu satırı “son dolu sütuna” kadar kısa dizi olarak verir; kanal sütunları kaybolmasın */
function padRowToLength(row, ncol) {
  const out = []
  for (let i = 0; i < ncol; i += 1) {
    const v = row?.[i]
    out.push(v !== undefined && v !== null ? v : '')
  }
  return out
}

function rowLooksEmptyArray(valueRow) {
  if (!valueRow || !Array.isArray(valueRow)) return true
  return !valueRow.some((v) => v !== '' && v != null && String(v).trim() !== '')
}

function findHomeDeliveryColumnIndex(headerCells) {
  const matches = new Set([
    normalizeHeader('tbs_home'),
    normalizeHeader('tbs_homedelivery'),
    normalizeHeader('tbs_homedeliver'),
    normalizeHeader('tbs home delivery'),
  ])
  const exact = headerCells.findIndex((h) => matches.has(normalizeHeader(h)))
  if (exact >= 0) return exact
  return headerCells.findIndex((h) => {
    const n = normalizeHeader(h)
    return (
      n.startsWith('tbs') &&
      n.includes('home') &&
      (n.includes('deliv') || n.includes('deliver'))
    )
  })
}

/**
 * tbs_homedelivery sonrası 9 kanal: YemekSepeti_status, YemekSepeti_Express, … gelal_status, AraGelsin_status.
 */
function extractChannelsNineColumnExport(headerCells, valueRow) {
  const ncol = valueRow.length
  const homeIdx = findHomeDeliveryColumnIndex(headerCells)
  if (homeIdx >= 0 && ncol >= homeIdx + 1 + CHANNEL_LABELS.length) {
    return CHANNEL_LABELS.map((_, i) => normalizeChannelState(valueRow[homeIdx + 1 + i]))
  }
  /** Eski şablon: name=A sütun 0, tbs_home≈F, kanallar G–O */
  const nameIdx = headerCells.findIndex((h) => normalizeHeader(h) === normalizeHeader('name'))
  if (nameIdx === 0 && ncol >= 6 + CHANNEL_LABELS.length) {
    return CHANNEL_LABELS.map((_, i) => normalizeChannelState(valueRow[6 + i]))
  }
  return null
}

/** Başlık araması: ilk N satırda skor (tek küçük okuma) */
const HEADER_PROBE_ROWS = 60
/** Tek seferde işlenecek en fazla veri satırı (bellek / donma önlemi) */
const MAX_DATA_ROWS = 50000

function scoreHeaderRow(cells) {
  if (!cells?.length) return 0
  let score = 0
  for (const cell of cells) {
    const n = normalizeHeader(String(cell ?? ''))
    if (!n) continue
    if (n === 'name' || n.includes('equipment')) score += 3
    if (n.includes('tbs') && (n.includes('global') || n.includes('home'))) score += 2
    if (n.includes('marka') || n.includes('sehir') || n.includes('city')) score += 1
    if (n.includes('yemek') || n.includes('trendyol') || n.includes('status') || n.includes('kanal'))
      score += 1
  }
  return score
}

function findBestHeaderRowIndex(sheet, decoded, lastRow) {
  const startR = decoded.s.r
  const probeEnd = Math.min(startR + HEADER_PROBE_ROWS - 1, lastRow)
  const probeRange = {
    s: { r: startR, c: decoded.s.c },
    e: { r: probeEnd, c: decoded.e.c },
  }
  const probe = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
    range: probeRange,
  })
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < probe.length; i += 1) {
    const sc = scoreHeaderRow(probe[i])
    if (sc > bestScore) {
      bestScore = sc
      bestIdx = i
    }
  }
  if (bestScore < 1) return startR
  return startR + bestIdx
}

function parseRowsFromSheet(sheet) {
  if (!sheet['!ref']) return []
  const decoded = XLSX.utils.decode_range(sheet['!ref'])
  const lastRow = decoded.e.r
  const ncol = decoded.e.c - decoded.s.c + 1

  const headerRowAbs = findBestHeaderRowIndex(sheet, decoded, lastRow)
  const range = {
    s: { r: headerRowAbs, c: decoded.s.c },
    e: decoded.e,
  }
  const aoa = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
    range,
  })
  if (aoa.length < 2) return []

  const headerCells = padRowToLength(
    aoa[0].map((c) => String(c ?? '').trim()),
    ncol,
  )
  /** @type {ReturnType<typeof mapExcelRow>[]} */
  const mapped = []
  const maxR = Math.min(aoa.length - 1, MAX_DATA_ROWS)
  for (let r = 1; r <= maxR; r += 1) {
    const valueRow = padRowToLength(aoa[r], ncol)
    if (rowLooksEmptyArray(valueRow)) continue
    const raw = buildRawFromHeaderRow(headerCells, valueRow)
    const chOv = extractChannelsNineColumnExport(headerCells, valueRow)
    const row = mapExcelRow(raw, chOv ?? undefined, r)
    if (row.name && String(row.name).trim() !== '') mapped.push(row)
  }
  return mapped
}

function parseWorkbookFirstSheetFromWorkbook(wb) {
  if (!wb.SheetNames?.length) return []
  let best = []
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue
    const mapped = parseRowsFromSheet(sheet)
    if (mapped.length > best.length) best = mapped
  }
  return best
}

export async function mergeExcelFiles(files) {
  const { picked, skippedOlder } = pickLatestPerFileName(Array.from(files))
  const sorted = [...picked].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  const byGlobal = new Map()
  for (const file of sorted) {
    let buf
    try {
      buf = await file.arrayBuffer()
    } catch (e) {
      throw new Error(
        `Dosya okunamadı: ${file.name} (${e instanceof Error ? e.message : String(e)})`,
      )
    }
    let wb
    try {
      wb = XLSX.read(buf, {
        type: 'array',
        cellDates: true,
      })
    } catch (e) {
      throw new Error(
        `Excel açılamadı: ${file.name}. Geçerli .xlsx/.xls dosyası olduğundan emin olun. (${e instanceof Error ? e.message : String(e)})`,
      )
    }
    const rows = parseWorkbookFirstSheetFromWorkbook(wb)
    for (const row of rows) {
      const key = String(row.id)
      byGlobal.set(key, { ...row, id: key })
    }
  }

  return {
    rows: Array.from(byGlobal.values()),
    usedFiles: sorted.map((f) => ({
      name: f.name,
      lastModified: f.lastModified,
    })),
    skippedOlder,
  }
}
