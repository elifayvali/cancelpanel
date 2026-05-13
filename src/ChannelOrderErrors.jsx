import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import './ChannelOrderErrors.css'

/**
 * Kanal Sipariş Hataları — görünüm ve davranış referansı:
 * `atx-mail-dashboard/MailLogsDashboard.jsx` (Tailwind → scoped .coe-* CSS).
 */

function buildErrorMessage(typeId, row) {
  if (row.errorMessage) return row.errorMessage
  switch (typeId) {
    case 'order-inject-error':
      return `"${row.productName ?? '—'}" — KDS Ürün hatası. Kanal ve/veya CRM tanımları kontrol edilmelidir.`
    case 'main-product-not-found':
      return `"${row.channelProductName ?? row.productName ?? '—'}" ürünü CRM sisteminde tanımlı değil. productId: ${row.channelProductCode ?? row.productCode ?? '—'}.`
    case 'sub-product-not-found':
      return `"${row.mainProductName ?? '—'}" ürününe bağlı subProductOptionId: ${row.subProductCode ?? '—'} ${row.subProductName ?? ''} bulunamamıştır.`
    case 'remote-code-null':
      return `"${row.productName ?? '—'}" ürünü kanal ile CRM eşleşmiyor. RemoteCode kanaldan null geldi (productId: ${row.productCode ?? '—'}).`
    default:
      return '—'
  }
}

function buildErrorSource(typeId, row) {
  if (row?.errorSource) return row.errorSource
  if (typeId === 'order-inject-error') return 'Platform / CRM'

  const msg = (row?.errorMessage || buildErrorMessage(typeId, row) || '').toLowerCase()
  if (msg.includes('crm sisteminde tanımlı değil') || msg.includes('bulunamamıştır')) return 'CRM'
  if (msg.includes('crm eşleşmiyor') || msg.includes('remotecode') || msg.includes('null geldi')) return 'Platform'

  switch (typeId) {
    case 'main-product-not-found':
    case 'sub-product-not-found':
      return 'CRM'
    case 'remote-code-null':
      return 'Platform'
    default:
      return '—'
  }
}

const PAGE_SIZE_OPTIONS = [25, 50, 100]

const MAIL_TYPES = [
  {
    id: 'order-inject-error',
    title: 'OrderInject Error',
    subtitle: 'Mutfağa Gönderilememe',
    endpoint: '/api/mail-logs/order-inject-errors',
    dateField: 'failedAt',
    accent: 'rose',
  },
  {
    id: 'main-product-not-found',
    title: 'Main Product not found',
    subtitle: 'Ana ürün eşleşmedi',
    endpoint: '/api/mail-logs/main-product-not-found',
    dateField: 'occurredAt',
    accent: 'amber',
  },
  {
    id: 'sub-product-not-found',
    title: 'SubProduct not found',
    subtitle: 'Alt ürün / opsiyon eşleşmedi',
    endpoint: '/api/mail-logs/sub-product-not-found',
    dateField: 'occurredAt',
    accent: 'orange',
  },
  {
    id: 'remote-code-null',
    title: 'Remote Code null',
    subtitle: 'Master data eksik mapping',
    endpoint: '/api/mail-logs/remote-code-null',
    dateField: 'detectedAt',
    accent: 'sky',
  },
]

function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Tablo için: tarih ve saat ayrı satırlarda (sütun dar kalsın). */
function fmtDateParts(v) {
  if (!v) return { date: '—', time: '' }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return { date: String(v), time: '' }
  return {
    date: d.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
}

function todayISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function getQueryParam(name) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

async function fetchMailLogs({ apiBase, endpoint, params, authHeader, signal }) {
  const url = new URL((apiBase || '') + endpoint, window.location.origin)
  Object.entries(params).forEach(([k, val]) => {
    if (val !== undefined && val !== null && val !== '') url.searchParams.set(k, val)
  })
  const res = await fetch(url.toString(), {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json', ...(authHeader || {}) },
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      msg = j?.error?.message || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json()
}

const MOCK = generateMockData()

function generateMockData() {
  const channels = ['Yemek Sepeti', 'Getir', 'Trendyol', 'Migros Yemek', 'Fuudy']
  const brands = [
    'BurgerKingTR',
    'BurgerKingIstanbul',
    'BurgerKingAnkara',
    'BurgerKingIzmir',
    'BurgerKingBursa',
    'BurgerKingAdana',
    'BurgerKingCyprus',
  ]
  const stores = [
    { code: 'BK001', name: 'BK Levent' },
    { code: 'BK117', name: 'BK Maslak' },
    { code: 'BK222', name: 'BK Bağdat Cd.' },
    { code: 'BK305', name: 'BK Bostancı' },
    { code: 'BK428', name: 'BK Akmerkez' },
    { code: 'BK533', name: 'BK Cevahir' },
  ]
  const mainProducts = [
    { code: '33087', name: 'King Chicken®' },
    { code: '44198', name: 'Double Whopper®' },
    { code: '55309', name: 'Chili Cheese Burger' },
    { code: '11023', name: 'Texas Smokehouse Burger®' },
    { code: '22115', name: 'Whopper®' },
    { code: '36677', name: 'BK Fusion®' },
    { code: '47821', name: 'Crispy Chicken®' },
  ]
  const subProducts = [
    { code: '114006', name: 'Turşulu' },
    { code: '220115', name: 'Marul' },
    { code: '339224', name: 'Ketçap' },
    { code: '450335', name: 'Mayonez' },
    { code: '561446', name: 'Soğan Halkası' },
  ]
  const errorCodes = ['KITCHEN_TIMEOUT', 'KDS_REJECT', 'POS_OFFLINE', 'INJECT_FAILED', 'INVALID_PAYLOAD']

  const pick = (a) => a[Math.floor(Math.random() * a.length)]
  const pad = (n, w = 4) => String(n).padStart(w, '0')
  const dt = (i) => new Date(Date.now() - i * 3600000).toISOString()
  const uuid = (i) => `${pad(i, 8)}-0a${pad(i, 2)}-46b2-8b1c-${pad(1000000000000 + i, 12)}`
  const platformId = (i) => {
    const a = 'abcdefghijklmnopqrstuvwxyz'
    const r = (n) => Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join('')
    return `${r(4)}-${pad(2611 + i, 4)}-${r(4)}`
  }

  const mk = (i, t) => {
    const ch = pick(channels)
    const br = pick(brands)
    const st = pick(stores)
    const base = {
      id: uuid(i),
      orderDcid: uuid(i),
      platformId: platformId(i),
      mailId: `mail-${t}-${i}`,
      mailedAt: dt(i),
      mailedTo: ['support@tabgida.com.tr', 'ops@tabgida.com.tr'],
      subject: `[${t}] ${br}`,
      channel: ch,
      brand: br,
      storeCode: st.code,
      storeName: st.name,
    }
    if (t === 'order-inject-error') {
      const mp = pick(mainProducts)
      return {
        ...base,
        failedAt: dt(i),
        errorCode: pick(errorCodes),
        errorDetail: 'KDS yanıt vermedi (timeout 30s).',
        attemptCount: 1 + (i % 4),
        productCode: mp.code,
        productName: mp.name,
        requestPayload: JSON.stringify({ orderDcid: base.orderDcid, items: [{ code: mp.code, qty: 1 }] }, null, 2),
        responsePayload: 'null (timeout)',
      }
    }
    if (t === 'main-product-not-found') {
      const mp = pick(mainProducts)
      return {
        ...base,
        occurredAt: dt(i),
        channelProductCode: mp.code,
        channelProductName: mp.name,
        productName: mp.name,
        expectedPosCode: null,
        rawItemPayload: JSON.stringify({ code: mp.code, qty: 1, modifiers: [] }, null, 2),
      }
    }
    if (t === 'sub-product-not-found') {
      const mp = pick(mainProducts)
      const sp = pick(subProducts)
      return {
        ...base,
        occurredAt: dt(i),
        mainProductCode: mp.code,
        mainProductName: mp.name,
        subProductCode: sp.code,
        subProductName: sp.name,
        productName: mp.name,
        rawItemPayload: JSON.stringify({ main: mp.code, sub: sp.code }, null, 2),
      }
    }
    const mp = pick(mainProducts)
    return {
      ...base,
      detectedAt: dt(i),
      productCode: mp.code,
      productName: mp.name,
      storeCode: i % 3 === 0 ? null : st.code,
      storeName: i % 3 === 0 ? null : st.name,
      context: 'product-master-sync',
    }
  }

  const out = {}
  for (const t of MAIL_TYPES) {
    out[t.id] = Array.from({ length: 73 }, (_, j) => mk(j + 1, t.id))
  }
  return out
}

/** @param {'brand' | 'channel'} field */
function collectMockDistinct(field) {
  const s = new Set()
  for (const t of MAIL_TYPES) {
    for (const row of MOCK[t.id] || []) {
      const v = row[field]
      if (v != null && String(v).trim() !== '') s.add(String(v))
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b, 'tr'))
}

const MOCK_BRAND_OPTIONS = collectMockDistinct('brand')
const MOCK_CHANNEL_OPTIONS = collectMockDistinct('channel')

/**
 * Hata tipine göre ürün kodu: order-inject + remote-code → productCode;
 * main-product-not-found → channelProductCode; sub-product-not-found → subProductCode.
 * @param {Record<string, unknown>} row
 * @param {string} typeId
 */
function getProductIdForRow(row, typeId) {
  switch (typeId) {
    case 'order-inject-error':
    case 'remote-code-null':
      return row.productCode
    case 'main-product-not-found':
      return row.channelProductCode
    case 'sub-product-not-found':
      return row.subProductCode
    default:
      return row.productCode
  }
}

/** @param {Record<string, unknown>} row @param {string[] | undefined} brands @param {string[] | undefined} channels */
function passesBrandChannel(row, brands, channels) {
  const bs = brands && brands.length > 0
  const cs = channels && channels.length > 0
  if (bs && !brands.includes(/** @type {string} */ (row.brand))) return false
  if (cs && !channels.includes(/** @type {string} */ (row.channel))) return false
  return true
}

/**
 * Hata tipine göre tabloda kullanılan ürün kodunda metin araması (büyük/küçük harf yok sayılır).
 * @param {Record<string, unknown>} row
 * @param {string} typeId
 * @param {string | undefined} rawQuery
 */
function passesProductCodeQuery(row, typeId, rawQuery) {
  const q = String(rawQuery ?? '').trim().toLocaleLowerCase('tr-TR')
  if (!q) return true
  const idVal = getProductIdForRow(row, typeId)
  if (idVal == null || String(idVal).trim() === '') return false
  return String(idVal).toLocaleLowerCase('tr-TR').includes(q)
}

/** @param {string} typeId */
function getDateFieldForType(typeId) {
  return MAIL_TYPES.find((t) => t.id === typeId)?.dateField ?? 'mailedAt'
}

/** @param {Record<string, unknown>} row @param {string} typeId */
function rowTimestampMs(row, typeId) {
  const f = getDateFieldForType(typeId)
  const v = row[f] ?? row.mailedAt
  if (!v) return 0
  const t = new Date(String(v)).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * Genel arama: yalnızca tablodaki hata tipi, hata kaynağı, ürün kodu ve hata mesajı detayı alanlarında (büyük/küçük harf yok sayılır).
 * @param {Record<string, unknown>} row
 * @param {string} typeId
 */
function buildChannelOrderErrorSearchBlob(row, typeId) {
  const typeMeta = MAIL_TYPES.find((t) => t.id === typeId)
  const hataTipiParts = [typeMeta?.title, typeMeta?.subtitle].filter(Boolean)
  const idVal = getProductIdForRow(row, typeId)
  const urunKodu =
    idVal != null && String(idVal).trim() !== '' ? String(idVal).trim() : '—'
  const parts = [
    ...hataTipiParts,
    buildErrorSource(typeId, row),
    urunKodu,
    buildErrorMessage(typeId, row),
  ]
  return parts.join(' ').toLocaleLowerCase('tr-TR')
}

/**
 * Boşlukla ayrılmış kelimelerin tümü blob içinde geçmeli (tr büyük/küçük harf).
 * @param {Record<string, unknown>} row
 * @param {string} typeId
 * @param {string} rawQuery
 */
function rowMatchesChannelOrderSearch(row, typeId, rawQuery) {
  const q = String(rawQuery ?? '').trim().toLocaleLowerCase('tr-TR')
  if (!q) return true
  const tokens = q.split(/\s+/).filter(Boolean)
  const blob = buildChannelOrderErrorSearchBlob(row, typeId)
  return tokens.every((t) => blob.includes(t.toLocaleLowerCase('tr-TR')))
}

/**
 * @param {string} typeId
 * @param {{ from?: string; to?: string; q?: string; brands?: string[]; channels?: string[]; productCodeQuery?: string }} params
 */
function filterMockItemsByParams(typeId, params) {
  const dateField = getDateFieldForType(typeId)
  let items = MOCK[typeId] ? [...MOCK[typeId]] : []
  if (params.from) items = items.filter((x) => x[dateField] >= params.from)
  if (params.to) items = items.filter((x) => x[dateField] <= `${params.to}T23:59:59.999Z`)
  if (params.q && String(params.q).trim()) {
    items = items.filter((x) => rowMatchesChannelOrderSearch(x, typeId, params.q))
  }
  items = items.filter((row) => passesBrandChannel(row, params.brands, params.channels))
  items = items.filter((row) => passesProductCodeQuery(row, typeId, params.productCodeQuery))
  return items.map((row) => ({ ...row, _typeId: typeId }))
}

/**
 * @param {string[]} selectedTypeIds
 * @param {{ from?: string; to?: string; q?: string; brands?: string[]; channels?: string[]; productCodeQuery?: string }} params
 */
function mergeMockFilteredRows(selectedTypeIds, params) {
  let merged = []
  for (const typeId of selectedTypeIds) {
    merged = merged.concat(filterMockItemsByParams(typeId, params))
  }
  merged.sort((a, b) => rowTimestampMs(b, b._typeId) - rowTimestampMs(a, a._typeId))
  return merged
}

/**
 * Mock: sayfalama olmadan tüm satırlar (Excel export).
 * @param {string[]} selectedTypeIds
 * @param {{ from?: string; to?: string; q?: string; brands?: string[]; channels?: string[]; productCodeQuery?: string }} params
 */
async function fetchMockMergedMailLogsAll(selectedTypeIds, params) {
  await new Promise((r) => setTimeout(r, 150))
  return mergeMockFilteredRows(selectedTypeIds, params)
}

/**
 * API: tüm sayfaları çekip birleştirir (export veya istemci tarafı sayfalama için).
 * @param {string[]} selectedTypeIds
 * @param {{ from?: string; to?: string; q?: string; brands?: string[]; channels?: string[]; productCodeQuery?: string }} params
 */
async function fetchApiMergedMailLogsAllRows(selectedTypeIds, params, apiBase, authHeader, signal) {
  const pageSize = 500
  const types = MAIL_TYPES.filter((t) => selectedTypeIds.includes(t.id))
  /** Metin araması sunucuda bu dört alanı kapsamaz; istemci tarafında hata tipi / kaynağı / ürün kodu / mesajda filtrelenir. */
  const base = {
    from: params.from,
    to: params.to,
  }
  const chunks = []
  for (const type of types) {
    const typeRows = []
    let page = 1
    while (page <= 400) {
      const data = await fetchMailLogs({
        apiBase,
        endpoint: type.endpoint,
        params: { ...base, page, size: pageSize, sort: `${type.dateField}:desc` },
        authHeader,
        signal,
      })
      const items = Array.isArray(data?.items) ? data.items : []
      typeRows.push(...items.map((row) => ({ ...row, _typeId: type.id })))
      if (items.length < pageSize) break
      page += 1
    }
    chunks.push(typeRows)
  }
  let merged = chunks.flat()
  merged = merged.filter((r) => passesBrandChannel(r, params.brands, params.channels))
  merged = merged.filter((r) => passesProductCodeQuery(r, r._typeId, params.productCodeQuery))
  if (params.q && String(params.q).trim()) {
    merged = merged.filter((r) =>
      rowMatchesChannelOrderSearch(r, r._typeId ?? MAIL_TYPES[0].id, params.q),
    )
  }
  merged.sort((a, b) => rowTimestampMs(b, b._typeId) - rowTimestampMs(a, a._typeId))
  return merged
}

/**
 * @param {Array<Record<string, unknown> & { _typeId?: string }>} rows
 */
function exportChannelErrorsToExcel(rows) {
  if (!rows.length) return
  const sheetData = rows.map((row) => {
    const typeId = row._typeId ?? MAIL_TYPES[0].id
    const typeMeta = MAIL_TYPES.find((t) => t.id === typeId)
    const dateVal = row.failedAt || row.occurredAt || row.detectedAt || row.mailedAt
    return {
      Marka: row.brand ?? '',
      Kanal: row.channel ?? '',
      'Hata tipi': typeMeta?.subtitle ?? typeMeta?.title ?? '',
      'Hata Kaynağı': buildErrorSource(typeId, row),
      'Ürün Kodu': String(getProductIdForRow(row, row._typeId ?? MAIL_TYPES[0].id) ?? ''),
      'Hata Mesajı Detayı': buildErrorMessage(typeId, row),
      'Sipariş Tarihi': dateVal ? fmtDate(dateVal) : '',
      'Sipariş Dcid': row.orderDcid ?? row.id ?? '',
      'Platform Id': row.platformId ?? '',
    }
  })
  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kanal Sipariş Hataları')
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  XLSX.writeFile(wb, `kanal-siparis-hatalari-${stamp}.xlsx`)
}

function IconButton({ onClick, title, children, disabled }) {
  return (
    <button type="button" className="coe-iconBtn" onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  )
}

function Mono({ children }) {
  return <code className="coe-mono">{children}</code>
}

function sourceClass(source) {
  if (source === 'CRM') return 'coe-source coe-source--crm'
  if (source === 'Platform') return 'coe-source coe-source--platform'
  if (source === 'Platform / CRM') return 'coe-source coe-source--mixed'
  return 'coe-source coe-source--default'
}

function SourceBadge({ source }) {
  return <span className={sourceClass(source)}>{source}</span>
}

function HeaderBar({ brandLabel, systemName, activeTitle }) {
  return (
    <header className="coe-header">
      <div className="coe-header__inner">
        <div className="coe-header__logo">{brandLabel}</div>
        <div className="coe-header__meta">
          <div className="coe-header__title">{systemName}</div>
          <div className="coe-header__crumb">
            <span>Kanal Sipariş Hataları</span>
            <span className="coe-header__crumbSep">/</span>
            <span className="coe-header__crumbActive">{activeTitle}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

/** @param {{ value: string[]; onChange: (next: string[]) => void }} props */
function ReasonTypeMultiDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(/** @type {Node} */ (e.target))) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  const selectedTitles = value.map((id) => MAIL_TYPES.find((t) => t.id === id)?.title ?? id)
  const summary =
    value.length === 0
      ? 'Hata sebebi seçin…'
      : value.length === MAIL_TYPES.length
        ? `Tüm hata sebepleri (${MAIL_TYPES.length})`
        : selectedTitles.join(' · ')

  return (
    <div className="coe-dd coe-dd--filter" ref={wrapRef}>
      <div className="coe-field">
        <span className="coe-field__label">Hata sebebi</span>
        <button
          type="button"
          className="coe-dd__trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="coe-dd__triggerText">{summary}</span>
          <ChevronDown size={18} className={`coe-dd__chev${open ? ' coe-dd__chev--open' : ''}`} aria-hidden />
        </button>
      </div>
      {open ? (
        <div className="coe-dd__panel" role="listbox" aria-label="Hata sebebi seçenekleri">
          {MAIL_TYPES.map((t) => (
            <label key={t.id} className="coe-dd__row coe-dd__row--titleOnly" title={`${t.title} — ${t.subtitle}`}>
              <input type="checkbox" checked={value.includes(t.id)} onChange={() => toggle(t.id)} />
              <span className={`coe-tab__dot coe-dot--${t.accent}`} aria-hidden />
              <span className="coe-dd__title coe-dd__title--plain">{t.title}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * @param {{
 *   label: string
 *   options: string[]
 *   value: string[]
 *   onChange: (next: string[]) => void
 *   nounMany: string
 *   nounOne: string
 * }} props
 */
function StringMultiCheckDropdown({ label, options, value, onChange, nounMany, nounOne }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(/** @type {Node} */ (e.target))) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  const summary =
    value.length === 0
      ? `Tüm ${nounMany}`
      : value.length === options.length
        ? `Tüm ${nounMany} (${options.length})`
        : `${value.length} ${nounOne} seçili`

  return (
    <div className="coe-dd coe-dd--filter" ref={wrapRef}>
      <div className="coe-field">
        <span className="coe-field__label">{label}</span>
        <button
          type="button"
          className="coe-dd__trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="coe-dd__triggerText">{summary}</span>
          <ChevronDown size={18} className={`coe-dd__chev${open ? ' coe-dd__chev--open' : ''}`} aria-hidden />
        </button>
      </div>
      {open ? (
        <div className="coe-dd__panel coe-dd__panel--scroll" role="listbox" aria-label={label}>
          {options.map((opt) => (
            <label key={opt} className="coe-dd__row coe-dd__row--simple" title={opt}>
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              <span className="coe-dd__title coe-dd__title--plain">{opt}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * @param {{
 *   from: string
 *   to: string
 *   q: string
 *   selectedTypeIds: string[]
 *   selectedBrands: string[]
 *   selectedChannels: string[]
 *   productCodeQuery: string
 *   onPendingChange: (patch: Record<string, unknown>) => void
 *   onSearch: () => void
 *   onRefresh: () => void
 *   loading: boolean
 *   searchDisabled?: boolean
 * }} props
 */
function FiltersBar({
  from,
  to,
  q,
  selectedTypeIds,
  selectedBrands,
  selectedChannels,
  productCodeQuery,
  onPendingChange,
  onSearch,
  onRefresh,
  loading,
  searchDisabled,
}) {
  return (
    <div className="coe-filters coe-filters--stack coe-filters--left">
      <div className="coe-filters__top coe-filters__top--row">
        <ReasonTypeMultiDropdown
          value={selectedTypeIds}
          onChange={(next) => onPendingChange({ typeIds: next })}
        />
        <StringMultiCheckDropdown
          label="Marka"
          options={MOCK_BRAND_OPTIONS}
          value={selectedBrands}
          onChange={(next) => onPendingChange({ brands: next })}
          nounMany="markalar"
          nounOne="marka"
        />
        <StringMultiCheckDropdown
          label="Kanal"
          options={MOCK_CHANNEL_OPTIONS}
          value={selectedChannels}
          onChange={(next) => onPendingChange({ channels: next })}
          nounMany="kanallar"
          nounOne="kanal"
        />
        <div className="coe-field coe-field--productCode">
          <label className="coe-field__label" htmlFor="coe-product-code-filter">
            Ürün kodu
          </label>
          <input
            id="coe-product-code-filter"
            type="text"
            className="coe-input"
            value={productCodeQuery}
            placeholder="Örn. 33087, 114006…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => onPendingChange({ productCodeQuery: e.target.value })}
          />
        </div>
        <div className="coe-field coe-field--searchInline">
          <label className="coe-field__label" htmlFor="coe-error-detail-search">
            <Search size={12} /> Hata detaylarında ara
          </label>
          <div className="coe-inputSearchWrap">
            <Search size={14} aria-hidden />
            <input
              id="coe-error-detail-search"
              type="text"
              className="coe-inputSearch"
              value={q}
              placeholder="Hata tipi, hata kaynağı, ürün kodu, hata mesajı detayı"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => onPendingChange({ q: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="coe-filters__row">
        <div className="coe-field">
          <label className="coe-field__label">
            <Calendar size={12} /> Başlangıç
          </label>
          <input
            type="date"
            className="coe-input"
            value={from}
            onChange={(e) => onPendingChange({ from: e.target.value })}
          />
        </div>
        <div className="coe-field">
          <label className="coe-field__label">
            <Calendar size={12} /> Bitiş
          </label>
          <input
            type="date"
            className="coe-input"
            value={to}
            onChange={(e) => onPendingChange({ to: e.target.value })}
          />
        </div>
        <div className="coe-field coe-field--actions">
          <span className="coe-field__label coe-field__label--placeholder" aria-hidden>
            {'\u00a0'}
          </span>
          <div className="coe-filterActions">
            <button type="button" className="coe-btnAra" onClick={onSearch} disabled={loading || searchDisabled}>
              Ara
            </button>
            <IconButton onClick={onRefresh} title="Seçili filtrelere göre yenile" disabled={loading}>
              {loading ? <Loader2 size={16} className="coe-spin" /> : <RefreshCw size={16} />}
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @param {{
 *   items: Array<Record<string, unknown> & { _typeId?: string }>
 *   loading: boolean
 *   error: string | null
 *   onView: (row: Record<string, unknown> & { _typeId?: string }) => void
 *   emptyHint?: string
 * }} props
 */
function ErrorTable({ items, loading, error, onView, emptyHint }) {
  if (error) {
    return (
      <div className="coe-alertRow" role="alert">
        <AlertCircle size={18} /> {error}
      </div>
    )
  }
  const colSpan = 10
  return (
    <div className="coe-tableWrap">
      <table className="coe-table">
        <colgroup>
          <col className="coe-col coe-col--brand" />
          <col className="coe-col coe-col--channel" />
          <col className="coe-col coe-col--type" />
          <col className="coe-col coe-col--source" />
          <col className="coe-col coe-col--sku" />
          <col className="coe-col coe-col--msg" />
          <col className="coe-col coe-col--date" />
          <col className="coe-col coe-col--dcid" />
          <col className="coe-col coe-col--pid" />
          <col className="coe-col coe-col--detail" />
        </colgroup>
        <thead>
          <tr className="coe-theadRow">
            <th className="coe-th">Marka</th>
            <th className="coe-th">Kanal</th>
            <th className="coe-th">Hata tipi</th>
            <th className="coe-th">Hata Kaynağı</th>
            <th className="coe-th">Ürün Kodu</th>
            <th className="coe-th">Hata Mesajı Detayı</th>
            <th className="coe-th coe-th--dateHead">
              Sipariş
              <br />
              tarihi
            </th>
            <th className="coe-th">Sipariş Dcid</th>
            <th className="coe-th">Platform Id</th>
            <th className="coe-th coe-th--detail">Detay</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colSpan} className="coe-empty">
                <Loader2 size={20} className="coe-spin" /> Yükleniyor...
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="coe-empty">
                <Mail size={20} /> {emptyHint ?? 'Kayıt bulunamadı.'}
              </td>
            </tr>
          )}
          {!loading &&
            items.map((row, i) => {
              const typeId = row._typeId ?? MAIL_TYPES[0].id
              const typeMeta = MAIL_TYPES.find((t) => t.id === typeId)
              const dateVal = row.failedAt || row.occurredAt || row.detectedAt || row.mailedAt
              const productCodeVal = getProductIdForRow(row, typeId)
              const productCodeDisp =
                productCodeVal != null && String(productCodeVal).trim() !== '' ? String(productCodeVal) : '—'
              const errMsg = buildErrorMessage(typeId, row)
              const dateParts = fmtDateParts(dateVal)
              return (
                <tr key={`${typeId}-${String(row.orderDcid ?? row.id ?? i)}`} className="coe-tbodyRow">
                  <td className="coe-td coe-td--muted">{row.brand ?? '—'}</td>
                  <td className="coe-td coe-td--muted">{row.channel ?? '—'}</td>
                  <td className="coe-td coe-td--muted coe-td--tip">
                    <span
                      className="coe-typeHint"
                      title={typeMeta ? `${typeMeta.title} — ${typeMeta.subtitle}` : ''}
                    >
                      {typeMeta?.title ?? '—'}
                    </span>
                  </td>
                  <td className="coe-td">
                    <SourceBadge source={buildErrorSource(typeId, row)} />
                  </td>
                  <td className="coe-td coe-td--muted">
                    <Mono>{productCodeDisp}</Mono>
                  </td>
                  <td className="coe-td coe-td--msg">
                    <span className="coe-msgClamp" title={String(errMsg ?? '')}>
                      {errMsg}
                    </span>
                  </td>
                  <td className="coe-td coe-td--muted coe-td--dateSplit">
                    <span className="coe-dateLine">{dateParts.date}</span>
                    {dateParts.time ? <span className="coe-timeLine">{dateParts.time}</span> : null}
                  </td>
                  <td className="coe-td">
                    <Mono>{row.orderDcid ?? row.id}</Mono>
                  </td>
                  <td className="coe-td">
                    <Mono>{row.platformId ?? '—'}</Mono>
                  </td>
                  <td className="coe-td coe-td--detail">
                    <button type="button" className="coe-tableDetailBtn" onClick={() => onView(row)}>
                      <Eye size={14} aria-hidden />
                      <span>Detayı görüntüle</span>
                    </button>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * @param {{
 *   totalAll: number
 *   rangeStart: number
 *   rangeEnd: number
 *   page: number
 *   maxPage: number
 *   pageSize: number
 *   onPageSizeChange: (n: number) => void
 *   onPagePrev: () => void
 *   onPageNext: () => void
 *   loading: boolean
 *   onExportExcel: () => void
 *   exportDisabled: boolean
 * }} props
 */
function ResultsFooterBar({
  totalAll,
  rangeStart,
  rangeEnd,
  page,
  maxPage,
  pageSize,
  onPageSizeChange,
  onPagePrev,
  onPageNext,
  loading,
  onExportExcel,
  exportDisabled,
}) {
  const atFirst = page <= 1
  const atLast = page >= maxPage
  return (
    <div className="coe-tableFooter">
      <p className="coe-tableFooter__count" role="status">
        {loading ? (
          'Yükleniyor…'
        ) : totalAll === 0 ? (
          'Kayıt yok'
        ) : (
          <>
            <strong>
              {rangeStart.toLocaleString('tr-TR')}–{rangeEnd.toLocaleString('tr-TR')}
            </strong>
            {' / '}
            <strong>{totalAll.toLocaleString('tr-TR')}</strong> satır (bu sayfa)
          </>
        )}
      </p>
      <div className="coe-tableFooter__pager" aria-label="Sayfalama">
        <label className="coe-pageSize">
          <span className="coe-pageSize__label">Sayfa boyutu</span>
          <select
            className="coe-select coe-select--compact"
            value={String(pageSize)}
            disabled={loading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="coe-pageNav">
          <IconButton onClick={onPagePrev} title="Önceki sayfa" disabled={loading || totalAll === 0 || atFirst}>
            <ChevronLeft size={18} />
          </IconButton>
          <span className="coe-pageNav__meta">
            Sayfa <strong>{page}</strong> / {maxPage}
          </span>
          <IconButton onClick={onPageNext} title="Sonraki sayfa" disabled={loading || totalAll === 0 || atLast}>
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </div>
      <button
        type="button"
        className="coe-btnExport"
        onClick={onExportExcel}
        disabled={loading || exportDisabled}
        title="Filtrelenmiş tüm satırları Excel dosyası olarak kaydeder (tablodaki sayfa değil, tam liste)"
      >
        <FileSpreadsheet size={16} />
        <span>Excel olarak kaydet</span>
      </button>
    </div>
  )
}

function DetailModal({ row, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!row) return null

  const typeId = row._typeId ?? MAIL_TYPES[0].id

  const entries = Object.entries(row).filter(([k]) => k !== '_typeId')
  const longKeys = new Set(entries.filter(([, v]) => typeof v === 'string' && v.length > 80).map(([k]) => k))
  const shortEntries = entries.filter(([k]) => !longKeys.has(k))
  const longEntries = entries.filter(([k]) => longKeys.has(k))

  return (
    <div className="coe-modalBackdrop" role="presentation" onClick={onClose}>
      <div className="coe-modal" role="dialog" aria-modal="true" aria-labelledby="coe-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="coe-modal__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="coe-modal-title" className="coe-modal__titleRow">
              <AlertTriangle size={16} color="#f43f5e" /> Hata Detayı
            </h3>
            <p className="coe-modal__sub">{row.orderDcid ?? row.id ?? row.mailId ?? '—'}</p>
            <div className="coe-modal__summary">
              <SourceBadge source={buildErrorSource(typeId, row)} />
              <p className="coe-modal__summaryText">{buildErrorMessage(typeId, row)}</p>
            </div>
          </div>
          <IconButton onClick={onClose} title="Kapat">
            <X size={16} />
          </IconButton>
        </div>

        <div className="coe-modal__body">
          <section>
            <h4 className="coe-modal__sectionTitle">Alanlar</h4>
            <dl className="coe-modalDl">
              {shortEntries.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {Array.isArray(v) ? (
                      v.join(', ')
                    ) : v == null ? (
                      <span className="coe-nullText">null</span>
                    ) : typeof v === 'object' ? (
                      <code>{JSON.stringify(v)}</code>
                    ) : k.toLowerCase().includes('at') || k.toLowerCase().endsWith('date') ? (
                      fmtDate(v)
                    ) : (
                      String(v)
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {longEntries.length > 0 && (
            <section>
              <h4 className="coe-modal__sectionTitle">Uzun Alanlar</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {longEntries.map(([k, v]) => (
                  <div key={k}>
                    <div className="coe-modal__sectionTitle" style={{ marginBottom: 4 }}>
                      {k}
                    </div>
                    <pre className="coe-modalPre">{String(v)}</pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="coe-modal__footer">
          <button type="button" className="coe-btnPrimary" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}

function formatSelectionSummary(ids) {
  if (ids.length === 0) return 'Seçim yok'
  if (ids.length === MAIL_TYPES.length) return 'Tüm hata tipleri'
  return ids
    .map((id) => MAIL_TYPES.find((t) => t.id === id)?.title ?? id)
    .join(' · ')
}

/**
 * @param {{ typeIds: string[]; brands: string[]; channels: string[]; productCodeQuery?: string }} p
 */
function formatAppliedHeaderSummary(p) {
  const parts = [formatSelectionSummary(p.typeIds)]
  if (p.brands?.length) parts.push(`${p.brands.length} marka`)
  if (p.channels?.length) parts.push(`${p.channels.length} kanal`)
  const pcq = String(p.productCodeQuery ?? '').trim()
  if (pcq) parts.push(`ürün kodu: ${pcq.length > 24 ? `${pcq.slice(0, 24)}…` : pcq}`)
  return parts.join(' · ')
}

function createDefaultPending() {
  return {
    typeIds: MAIL_TYPES.map((t) => t.id),
    from: todayISO(-30),
    to: todayISO(0),
    q: '',
    brands: [],
    channels: [],
    productCodeQuery: '',
  }
}

/**
 * @param {{
 *   apiBase: string
 *   useMock: boolean
 *   authHeader?: Record<string, string>
 *   onAppliedSummaryChange?: (summary: string) => void
 * }} props
 */
function ChannelOrderLogPanel({ apiBase, useMock, authHeader, onAppliedSummaryChange }) {
  const [pending, setPending] = useState(createDefaultPending)
  /** Sunulan sonuçların kaynağı; açılışta varsayılanlarla dolar, filtre değişince «Ara» ile güncellenir. */
  const [applied, setApplied] = useState(createDefaultPending)

  const [items, setItems] = useState([])
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [reqId, setReqId] = useState(0)
  const abortRef = useRef(null)

  const totalAll = items.length
  const maxPage = Math.max(1, Math.ceil(totalAll / pageSize) || 1)
  const currentPage = Math.min(Math.max(1, page), maxPage)
  const rangeStart = totalAll === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = totalAll === 0 ? 0 : Math.min(currentPage * pageSize, totalAll)
  const pagedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  const patchPending = (/** @type {Record<string, unknown>} */ patch) => {
    setPending((p) => ({ ...p, ...patch }))
  }

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    if (applied.typeIds.length === 0) {
      setItems([])
      setPage(1)
      setLoading(false)
      return
    }
    try {
      const base = {
        from: applied.from,
        to: applied.to,
        q: applied.q,
        brands: applied.brands,
        channels: applied.channels,
        productCodeQuery: applied.productCodeQuery,
      }
      const rows = useMock
        ? await fetchMockMergedMailLogsAll(applied.typeIds, base)
        : await fetchApiMergedMailLogsAllRows(applied.typeIds, base, apiBase, authHeader, ctrl.signal)
      setItems(Array.isArray(rows) ? rows : [])
      setPage(1)
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'İstek başarısız.')
    } finally {
      setLoading(false)
    }
  }, [apiBase, useMock, authHeader, applied, reqId])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const handleSearch = () => {
    if (pending.typeIds.length === 0) return
    const next = { ...pending }
    setApplied(next)
    onAppliedSummaryChange?.(formatAppliedHeaderSummary(next))
  }

  const handleRefresh = () => {
    setReqId((x) => x + 1)
  }

  const handlePageSizeChange = (n) => {
    setPageSize(n)
    setPage(1)
  }

  const handleExportExcel = () => {
    if (loading || applied.typeIds.length === 0 || items.length === 0) return
    setError(null)
    try {
      exportChannelErrorsToExcel(items)
    } catch (e) {
      setError(`Excel dışa aktarma: ${e?.message || 'İşlem başarısız.'}`)
    }
  }

  const emptyHint =
    applied.typeIds.length === 0 ? 'Listelemek için en az bir hata sebebi seçin.' : undefined

  return (
    <div className="coe-panelStack">
      <div className="coe-card">
        <FiltersBar
          from={pending.from}
          to={pending.to}
          q={pending.q}
          selectedTypeIds={pending.typeIds}
          selectedBrands={pending.brands}
          selectedChannels={pending.channels}
          productCodeQuery={pending.productCodeQuery}
          onPendingChange={patchPending}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          loading={loading}
          searchDisabled={pending.typeIds.length === 0}
        />
        <ErrorTable items={pagedItems} loading={loading} error={error} onView={setSelected} emptyHint={emptyHint} />
        <ResultsFooterBar
          totalAll={totalAll}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          page={currentPage}
          maxPage={maxPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          onPagePrev={() => setPage((p) => Math.max(1, p - 1))}
          onPageNext={() =>
            setPage((p) => {
              const m = Math.max(1, Math.ceil(items.length / pageSize))
              return Math.min(m, p + 1)
            })
          }
          loading={loading}
          onExportExcel={handleExportExcel}
          exportDisabled={applied.typeIds.length === 0 || totalAll === 0}
        />
      </div>

      {selected ? <DetailModal row={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

/**
 * @param {{
 *   apiBase?: string
 *   useMock?: boolean
 *   authHeader?: Record<string, string>
 *   brandLabel?: string
 *   systemName?: string
 * }} props
 */
export default function ChannelOrderErrors({
  apiBase = '',
  useMock: useMockProp = true,
  authHeader,
  brandLabel = 'AT',
  systemName = 'ATP Zenia',
}) {
  const [headerCrumb, setHeaderCrumb] = useState(() => formatAppliedHeaderSummary(createDefaultPending()))
  const useMock = useMockProp || getQueryParam('mock') === '1'

  return (
    <div className="coe-dash">
      <HeaderBar brandLabel={brandLabel} systemName={systemName} activeTitle={headerCrumb} />

      <main className="coe-main">
        <div className="coe-intro">
          <h1 className="coe-intro__title">Kanal Sipariş Hata Listesi</h1>
          <p className="coe-intro__desc">
            Sayfa açıldığında varsayılan tarih aralığı ve tüm hata tipleriyle sonuçlar yüklenir; tabloda varsayılan{' '}
            <strong>25</strong> satır gösterilir, 50 veya 100 seçilebilir. Filtre veya yenilemeden sonra liste ilk
            sayfaya döner. Excel, tablodaki sayfa değil <strong>filtrelenmiş tüm satırları</strong> dışa aktarır.
          </p>
          {useMock ? (
            <div className="coe-intro__mock">
              <Filter size={12} /> MOCK — yerleşik örnek veri. Canlı API için{' '}
              <code className="coe-mono">useMock={'{false}'}</code> ile bu bileşeni çağırın.
            </div>
          ) : null}
        </div>

        <ChannelOrderLogPanel
          apiBase={apiBase}
          useMock={useMock}
          authHeader={authHeader}
          onAppliedSummaryChange={setHeaderCrumb}
        />

        <footer className="coe-footer">
          API: <code>{apiBase || (typeof window !== 'undefined' ? window.location.origin : '—')}</code>
          {' · '}
          {useMock ? 'mock veri' : 'canlı API'}
        </footer>
      </main>
    </div>
  )
}
