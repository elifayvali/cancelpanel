import * as XLSX from 'xlsx'
import { CHANNEL_LABELS } from './channelLabels'
import { pickLatestPerFileName } from './excelImport'

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
    if (wanted.has(normalizeHeader(k))) return raw[k]
  }
  return ''
}

function formatYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 2 haneli yıl → 2000–2069 / 1970–1999 */
function expandTwoDigitYear(y) {
  if (y >= 100) return y
  return y < 70 ? 2000 + y : 1900 + y
}

/** @param {unknown} val */
export function parseExcelDateToYMD(val) {
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return formatYMD(val)
  }
  if (typeof val === 'number' && !Number.isNaN(val) && val > 20000 && val < 100000) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    if (!Number.isNaN(d.getTime())) return formatYMD(d)
  }
  const s = String(val ?? '').trim()
  if (!s) return null
  /** GG-AA-YY veya GG-AA-YYYY + isteğe bağlı saat: 21-03-26 21:03 (gün-ay-yıl) */
  const dmyTime = s.match(
    /^(\d{1,2})-(\d{1,2})-(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (dmyTime) {
    const part1 = Number(dmyTime[1])
    const part2 = Number(dmyTime[2])
    const yStr = dmyTime[3]
    const part3 = Number(yStr)
    let day
    let month
    let year
    if (yStr.length === 4) {
      day = part1
      month = part2
      year = part3
    } else {
      day = part1
      month = part2
      year = expandTwoDigitYear(part3)
    }
    const dt = new Date(year, month - 1, day)
    if (!Number.isNaN(dt.getTime())) return formatYMD(dt)
  }
  const dm = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/)
  if (dm) {
    const d = new Date(Number(dm[3]), Number(dm[2]) - 1, Number(dm[1]))
    if (!Number.isNaN(d.getTime())) return formatYMD(d)
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return formatYMD(d)
  return null
}

/** Excel’deki kanal adı → paneldeki sabit etiket */
const CHANNEL_SYNONYMS = [
  ['tikla gelsin', 'Sana Gelsin'],
  ['tiklagelsin', 'Sana Gelsin'],
  ['yemek sepeti', 'YemekSepeti'],
  ['yemeksepeti express', 'YemekSepeti Express'],
  ['yemek sepeti express', 'YemekSepeti Express'],
]

/**
 * @param {string} nameRaw
 * @returns {number | null}
 */
function channelNameToIndex(nameRaw) {
  const trimmed = String(nameRaw ?? '').trim()
  if (!trimmed) return null
  const target = normalizeHeader(trimmed)
  const syn = CHANNEL_SYNONYMS.find(([k]) => target === normalizeHeader(k))
  if (syn) {
    const idx = CHANNEL_LABELS.findIndex((lab) => lab === syn[1])
    if (idx >= 0) return idx + 1
  }
  const idx = CHANNEL_LABELS.findIndex((lab) => normalizeHeader(lab) === target)
  if (idx >= 0) return idx + 1
  const compact = target.replace(/\s+/g, '')
  const idxLoose = CHANNEL_LABELS.findIndex((lab) => {
    const nl = normalizeHeader(lab).replace(/\s+/g, '')
    return nl === compact || nl.includes(compact) || compact.includes(nl)
  })
  return idxLoose >= 0 ? idxLoose + 1 : null
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {number | null} 1..CHANNEL_LABELS.length
 */
function parseChannelIndex(raw) {
  const kanalVal = String(
    getCell(raw, [
      'kanal',
      'kanal adi',
      'kanal adı',
      'kanal no',
      'kanal_no',
      'kanal index',
      'kanal_index',
      'channel',
      'channel index',
      'entegrasyon kanali',
      'entegrasyon',
      'platform',
    ]),
  ).trim()
  if (kanalVal) {
    const byName = channelNameToIndex(kanalVal)
    if (byName != null) return byName
    const n = parseInt(kanalVal.replace(/\D/g, ''), 10)
    if (n >= 1 && n <= CHANNEL_LABELS.length) return n
    const onlyNum = parseInt(kanalVal, 10)
    if (!Number.isNaN(onlyNum) && onlyNum >= 1 && onlyNum <= CHANNEL_LABELS.length) return onlyNum
  }
  return null
}

/**
 * Yalnızca kapama satırları; Açma satırları sayılmaz.
 * @param {Record<string, unknown>} raw
 */
function rowIsKapamaAction(raw) {
  const aksiyon = String(
    getCell(raw, ['aksiyon', 'action', 'islem turu', 'işlem türü', 'islem', 'işlem']),
  ).trim()
  if (!aksiyon) return true
  const low = aksiyon.toLocaleLowerCase('tr-TR')
  if (/\ba[cç]ma\b|opening|open\b/.test(low)) return false
  if (/kapama|kapatma|kapan[iı][şs]|closing|close\b/.test(low)) return true
  return false
}

function isBlankReason(val) {
  const s = String(val ?? '').trim()
  if (!s) return true
  if (/^null$/i.test(s)) return true
  if (s === '—' || s === '-' || s === 'n/a' || s === 'na') return true
  return false
}

/**
 * @param {Record<string, unknown>} raw
 */
function rowToEvent(raw) {
  if (!rowIsKapamaAction(raw)) return null
  const dateRaw = getCell(raw, [
    'tarih',
    'date',
    'gun',
    'gün',
    'islem tarihi',
    'işlem tarihi',
    'olay tarihi',
    'kapanma tarihi',
  ])
  const date = parseExcelDateToYMD(dateRaw)
  const reasonRaw = getCell(raw, [
    'kapanma',
    'kapama',
    'neden',
    'sebep',
    'kapama nedeni',
    'kapatma nedeni',
    'aciklama',
    'açıklama',
    'reason',
    'mesaj',
  ])
  if (isBlankReason(reasonRaw)) return null
  const reason = String(reasonRaw).trim()
  const equipmentId = String(
    getCell(raw, [
      'equipment',
      'equipment id',
      'equipmentid',
      'equipmentId',
      'ekipman kodu',
      'restoran_id',
      'restoran id',
      'restoranid',
    ]),
  ).trim()
  const closedBy = String(
    getCell(raw, [
      'değişiklik kullanıcı',
      'degisiklik kullanici',
      'kullanıcı',
      'kullanici',
      'user',
      'kapatan',
      'kapatan kullanıcı',
      'kapatan kullanici',
    ]),
  ).trim()
  const closedAtRaw = String(
    getCell(raw, [
      'değişiklik tarihi',
      'degisiklik tarihi',
      'islem tarihi',
      'işlem tarihi',
      'kapanma tarihi',
      'tarih',
      'date',
    ]),
  ).trim()
  const channelIndex = parseChannelIndex(raw)
  if (!date || channelIndex == null || !equipmentId) return null
  return {
    date,
    channelIndex,
    reason,
    equipmentId,
    closedBy: closedBy || 'Bilinmiyor',
    closedAt: closedAtRaw || date,
  }
}

/**
 * @param {import('xlsx').WorkSheet} sheet
 */
function parseEventsFromSheet(sheet) {
  if (!sheet['!ref']) return []
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  /** @type {import('./closeReasonMockStorage').CloseReasonEvent[]} */
  const out = []
  for (const row of rows) {
    const ev = rowToEvent(/** @type {Record<string, unknown>} */ (row))
    if (ev) out.push(ev)
  }
  return out
}

function sanitizeEventLike(input) {
  if (!input || typeof input !== 'object') return null
  const date = String(input.date ?? '').trim()
  const channelIndex = Number(input.channelIndex)
  const reason = String(input.reason ?? '').trim()
  const equipmentId = String(input.equipmentId ?? '').trim()
  const closedBy = String(input.closedBy ?? '').trim()
  const closedAt = String(input.closedAt ?? '').trim()
  if (!date) return null
  if (!Number.isFinite(channelIndex) || channelIndex < 1 || channelIndex > CHANNEL_LABELS.length) return null
  if (!reason || !equipmentId) return null
  return {
    date,
    channelIndex,
    reason,
    equipmentId,
    closedBy: closedBy || 'Bilinmiyor',
    closedAt: closedAt || date,
  }
}

function parseEventsFromJsonText(text, fileName) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error(
      `JSON okunamadı: ${fileName}. (${e instanceof Error ? e.message : String(e)})`,
    )
  }

  /** @type {unknown[]} */
  let rows
  if (Array.isArray(parsed)) {
    rows = parsed
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rows)) {
    // compact storage format: { v: 2, rows: [[date, ch, reason, equipmentId, closedBy, closedAt], ...] }
    rows = parsed.rows.map((r) => ({
      date: r?.[0],
      channelIndex: r?.[1],
      reason: r?.[2],
      equipmentId: r?.[3],
      closedBy: r?.[4],
      closedAt: r?.[5],
    }))
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.events)) {
    rows = parsed.events
  } else {
    throw new Error(`JSON formatı desteklenmiyor: ${fileName}`)
  }

  const out = []
  for (const row of rows) {
    const ev = sanitizeEventLike(row)
    if (ev) out.push(ev)
  }
  return out
}

/**
 * @param {File[]} files
 */
export async function mergeCloseReasonExcelFiles(files) {
  const { picked } = pickLatestPerFileName(Array.from(files))
  const sorted = [...picked].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  /** @type {import('./closeReasonMockStorage').CloseReasonEvent[]} */
  const all = []

  for (const file of sorted) {
    const lowerName = String(file.name ?? '').toLocaleLowerCase('tr-TR')
    if (lowerName.endsWith('.json')) {
      let text
      try {
        text = await file.text()
      } catch (e) {
        throw new Error(
          `Dosya okunamadı: ${file.name} (${e instanceof Error ? e.message : String(e)})`,
        )
      }
      all.push(...parseEventsFromJsonText(text, file.name))
      continue
    }
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
      wb = XLSX.read(buf, { type: 'array', cellDates: true })
    } catch (e) {
      throw new Error(
        `Excel açılamadı: ${file.name}. (${e instanceof Error ? e.message : String(e)})`,
      )
    }
    if (!wb.SheetNames?.length) continue
    const sheet = wb.Sheets[wb.SheetNames[0]]
    if (!sheet) continue
    all.push(...parseEventsFromSheet(sheet))
  }

  return {
    events: all,
    usedFiles: sorted.map((f) => ({ name: f.name, lastModified: f.lastModified })),
  }
}
