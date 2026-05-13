import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HataDetayPanel } from './HataDetayPanel'
import { buildDashboardJson, dashboardJsonToString } from './channelDashboardModel'
import { CHANNEL_LABELS } from './channelLabels'
import { mergeExcelFiles } from './excelImport'
import { mergeCloseReasonExcelFiles } from './closeReasonExcelImport'
import {
  clearCloseReasonEventsStorage,
  loadCloseReasonEventsFromStorage,
  saveCloseReasonEventsToStorage,
} from './closeReasonMockStorage'
import {
  clearMockRowsStorage,
  loadMockMetaFromStorage,
  loadMockRowsOrDashboardRestaurants,
  replaceMockExcelDataset,
} from './mockExcelStorage'
import BrandPerformanceCarousel from './BrandPerformanceCarousel'
import './RestaurantChannelStatus.css'

/** SVG ring math for Satışa Açık Kanal Oranı donut (viewBox 100×100, r=42). */
const OPEN_CHANNEL_RING_R = 42
const OPEN_CHANNEL_RING_C = 2 * Math.PI * OPEN_CHANNEL_RING_R

/** Kanal Detayları özet kartları: sayfa başına gösterim (üst bant yüksekliğine sığsın) */
const CHANNEL_SUMMARY_PAGE_SIZE = 3

/** Toplam Kapalı Kanallar kartı — bilgi ikonu title / aria-label */
const TOP_KAPALI_KANAL_TOOLTIP =
  'Bu sayı “kapalı restoran” adedi değildir; kapalı durumdaki entegrasyon kanal bağlantılarının toplamıdır. ' +
  'Excel’de Kapali_Kanal_Sayisi (veya eşdeğer başlıklar) doluysa her şube satırındaki bu değerler toplanır; sütun yoksa tablodaki kanal hücrelerinde “kapalı” (closed) olanlar sayılır. ' +
  'Grup müdürü görünümünde yalnızca yetkiniz dahilindeki şubeler hesaba katılır.'

/** Restoran tablosu sütun varsayılan genişlikleri (px) */
const TABLE_COL_DEFAULT = /** @type {const} */ ({
  name: 220,
  brand: 200,
  city: 120,
  evlere: 120,
  ch: 88,
})
const TABLE_COL_MIN = 56
const TABLE_COL_MAX = 560

/** @typedef {'open' | 'closed' | 'na'} ChannelState */

function getInitialMockRows() {
  if (typeof window === 'undefined') return []
  return loadMockRowsOrDashboardRestaurants()
}

/** @returns {{ kind: 'idle' } | { kind: 'success'; rowCount: number; fileNames: string[] }} */
function getInitialMockUploadState() {
  if (typeof window === 'undefined') return { kind: 'idle' }
  const rows = loadMockRowsOrDashboardRestaurants()
  const meta = loadMockMetaFromStorage()
  if (rows?.length) {
    return {
      kind: 'success',
      rowCount: rows.length,
      fileNames: meta?.names ?? [],
    }
  }
  return { kind: 'idle' }
}

function getInitialSelectedRowId() {
  if (typeof window === 'undefined') return null
  const rows = loadMockRowsOrDashboardRestaurants()
  return rows?.length ? String(rows[0].id) : null
}

function StatusCell({ state }) {
  if (state === 'open') {
    return (
      <span className="rkd-status-icon rkd-status-icon--open" title="Açık">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          />
        </svg>
      </span>
    )
  }
  if (state === 'closed') {
    return (
      <span className="rkd-status-icon rkd-status-icon--closed" title="Kapalı">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </svg>
      </span>
    )
  }
  return (
    <span className="rkd-status-icon rkd-status-icon--na" title="Satış yapmıyor (Kanal ID boş)">
      <svg viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M7 12h10v1.5H7z" />
      </svg>
    </span>
  )
}

function HomeDeliveryCell({ value }) {
  const active = value === 'Evet'
  return (
    <span
      className={
        active ? 'rkd-evlere-text rkd-evlere-text--aktif' : 'rkd-evlere-text rkd-evlere-text--pasif'
      }
      title={active ? 'Evlere servis: Aktif' : 'Evlere servis: Pasif'}
    >
      {active ? 'Aktif' : 'Pasif'}
    </span>
  )
}

function normalizeChannels(ch) {
  return CHANNEL_LABELS.map((_, i) => ch?.[i] ?? 'na')
}

function formatStatNumber(n) {
  return Number(n).toLocaleString('tr-TR')
}

/** Tablo / özet araması: satırın tüm görünür alanlarını tek küçük harf dizgisinde birleştirir */
function buildRestaurantRowSearchBlob(row) {
  const parts = []
  const push = (v) => {
    if (v == null) return
    const s = String(v).trim()
    if (s) parts.push(s)
  }
  push(row.id)
  push(row.name)
  push(row.globalId)
  push(row.equipmentId)
  push(row.brand)
  push(row.city)
  push(row.homeDelivery)
  for (const key of /** @type {const} */ (['kapaliKanalSayisi', 'satisAcikKanalSayisi', 'satisYapilabilirKanalSayisi'])) {
    const n = row[key]
    if (typeof n === 'number' && !Number.isNaN(n)) {
      parts.push(String(n))
      parts.push(formatStatNumber(n))
    }
  }
  const ch = normalizeChannels(row.channels)
  const stateBlob = { open: 'open açık acik', closed: 'closed kapalı kapali', na: 'na tanımsız tanimli degil satis yapmiyor' }
  ch.forEach((st, i) => {
    push(CHANNEL_LABELS[i])
    parts.push(stateBlob[st] ?? st)
  })
  const d = row.detail
  if (d && typeof d === 'object') {
    push(d.hours)
    if (d.audit && typeof d.audit === 'object') {
      push(d.audit.user)
      push(d.audit.at)
    }
    if (d.closeReasons && typeof d.closeReasons === 'object') {
      for (const v of Object.values(d.closeReasons)) push(v)
    }
  }
  return parts.join(' ').toLocaleLowerCase('tr-TR')
}

/** Boşlukla ayrılmış kelimelerin hepsi blob içinde geçmeli (büyük/küçük harf yok sayılır) */
function rowMatchesMultiColumnSearch(row, rawQuery) {
  const q = rawQuery.trim().toLocaleLowerCase('tr-TR')
  if (!q) return true
  const tokens = q.split(/\s+/).filter(Boolean)
  const blob = buildRestaurantRowSearchBlob(row)
  return tokens.every((t) => blob.includes(t.toLocaleLowerCase('tr-TR')))
}

/**
 * @param {{ colKey: string; width: number; className?: string; children: import('react').ReactNode; onResizeStart: (e: import('react').MouseEvent, key: string) => void }} props
 */
function RkdResizeTh({ colKey, width, className = '', children, onResizeStart }) {
  return (
    <th className={className} style={{ width }} scope="col">
      <span className="rkd-th-inner">{children}</span>
      <span
        className="rkd-col-resize-handle"
        onMouseDown={(e) => onResizeStart(e, colKey)}
        role="separator"
        aria-orientation="vertical"
        tabIndex={-1}
        aria-hidden
      />
    </th>
  )
}

/** @typedef {'today' | '7' | '15' | '30'} CloseReasonRange */
const CLOSE_REASON_BASE_DATE = new Date(2026, 2, 30)

/** @param {CloseReasonRange} kind */
function getCloseReasonRangeBounds(kind) {
  const end = new Date(CLOSE_REASON_BASE_DATE)
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  if (kind === 'today') return { start, end }
  const days = kind === '7' ? 7 : kind === '15' ? 15 : 30
  start.setDate(start.getDate() - (days - 1))
  return { start, end }
}

/** @param {string} ymd */
function parseYMDToLocalMidnight(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  d.setHours(0, 0, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * @param {import('./closeReasonMockStorage').CloseReasonEvent[]} events
 * @param {CloseReasonRange} kind
 * @param {string[]} channelLabels
 * @param {Set<number>} channelFilter 1-based; boş = hiç kanal seçilmedi (grafik boş)
 */
function buildCloseReasonBlocks(events, kind, channelLabels, channelFilter) {
  const { start, end } = getCloseReasonRangeBounds(kind)
  if (!channelFilter || channelFilter.size === 0) {
    return { blocks: [], inRangeCount: 0 }
  }
  const filtered = events.filter((e) => {
    const d = parseYMDToLocalMidnight(e.date)
    if (d == null || d < start || d > end) return false
    if (!channelFilter.has(e.channelIndex)) return false
    return true
  })
  /** @type {Map<number, Map<string, number>>} */
  const byCh = new Map()
  for (const e of filtered) {
    const idx = e.channelIndex
    if (idx < 1 || idx > channelLabels.length) continue
    const reason = e.reason.trim()
    if (!reason) continue
    if (!byCh.has(idx)) byCh.set(idx, new Map())
    const m = byCh.get(idx)
    m.set(reason, (m.get(reason) ?? 0) + 1)
  }
  const blocks = []
  for (let i = 1; i <= channelLabels.length; i += 1) {
    const m = byCh.get(i)
    if (!m || m.size === 0) continue
    const rows = Array.from(m.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort(
        (a, b) =>
          b.count - a.count || a.reason.localeCompare(b.reason, 'tr', { sensitivity: 'base' }),
      )
    const total = rows.reduce((s, x) => s + x.count, 0)
    const maxInChannel = rows.reduce((mx, x) => Math.max(mx, x.count), 0)
    blocks.push({
      channelIndex: i,
      label: channelLabels[i - 1],
      rows,
      total,
      maxInChannel,
    })
  }
  blocks.sort(
    (a, b) =>
      b.total - a.total || a.label.localeCompare(b.label, 'tr', { sensitivity: 'base' }),
  )
  return { blocks, inRangeCount: filtered.length }
}

/**
 * @param {Array<{ channelIndex: number, label: string, rows: { reason: string, count: number }[], total: number, maxInChannel: number }>} blocks
 * @param {number} inRangeCount
 */
function computeCloseReasonInsights(blocks, inRangeCount) {
  if (!blocks.length || inRangeCount <= 0) return null
  /** @type {Map<string, number>} */
  const reasonTally = new Map()
  for (const b of blocks) {
    for (const { reason, count } of b.rows) {
      reasonTally.set(reason, (reasonTally.get(reason) ?? 0) + count)
    }
  }
  let topReason = ''
  let topReasonCount = 0
  for (const [r, c] of reasonTally) {
    if (c > topReasonCount) {
      topReasonCount = c
      topReason = r
    }
  }
  const topReasonPct = Math.round((topReasonCount / inRangeCount) * 1000) / 10
  const maxCh = blocks[0]
  const minCh = blocks[blocks.length - 1]
  return { topReason, topReasonCount, topReasonPct, maxCh, minCh }
}

function getRowEquipmentId(row) {
  const direct = String(row?.equipmentId ?? '').trim()
  if (direct && direct !== '—') return direct
  const fromId = String(row?.id ?? '').split('\u001f')[1] ?? ''
  return String(fromId).trim()
}

function toDisplayDate(ymd) {
  const parts = String(ymd ?? '').split('-')
  if (parts.length !== 3) return String(ymd ?? '')
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

function formatCloseDateTime(rawValue, fallbackDateYmd) {
  const raw = String(rawValue ?? '').trim()
  const fallback = String(fallbackDateYmd ?? '').trim()
  const source = raw || fallback
  if (!source) return { sortKey: '', display: '—' }

  const iso = source.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/)
  if (iso) {
    const y = iso[1]
    const m = iso[2]
    const d = iso[3]
    const hh = iso[4] ?? '00'
    const mm = iso[5] ?? '00'
    return { sortKey: `${y}-${m}-${d} ${hh}:${mm}`, display: `${d}-${m}-${y.slice(2)} ${hh}:${mm}` }
  }

  const dmy = source.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (dmy) {
    const d = String(Number(dmy[1])).padStart(2, '0')
    const m = String(Number(dmy[2])).padStart(2, '0')
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    const hh = String(Number(dmy[4] ?? '0')).padStart(2, '0')
    const mm = String(Number(dmy[5] ?? '0')).padStart(2, '0')
    return { sortKey: `${y}-${m}-${d} ${hh}:${mm}`, display: `${d}-${m}-${y.slice(2)} ${hh}:${mm}` }
  }

  return { sortKey: source, display: source }
}

/** Örnek ekran: GG.AA.YYYY ss:dd:00 */
function sortKeyToSiparisTarihDisplay(sortKey) {
  const m = String(sortKey ?? '').match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return '—'
  const sec = (m[6] ?? '00').padStart(2, '0')
  return `${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}:${sec}`
}

const DEFAULT_HATA_DETAY_MESAJI =
  '"Texas Smokehouse Burger®" ürününe bağlı subProductOptionId: 114006 Turşulu bulunamamıştır.'

function getInitialCloseReasonEvents() {
  if (typeof window === 'undefined') return []
  return loadCloseReasonEventsFromStorage()
}

/** @returns {{ kind: 'idle' } | { kind: 'success'; eventCount: number; fileNames: string[] }} */
function getInitialCloseReasonUploadState() {
  if (typeof window === 'undefined') return { kind: 'idle' }
  const ev = loadCloseReasonEventsFromStorage()
  if (ev.length > 0) return { kind: 'success', eventCount: ev.length, fileNames: [] }
  return { kind: 'idle' }
}

export default function RestaurantChannelStatus() {
  const GROUP_MANAGER_EQUIPMENT_PREFIXES = [
    'A6E66F1F',
    '878FBD4A',
    '6D2FECCC',
    'A42265AC',
    'AF329A0D',
    '43E7035E',
  ]
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const closeReasonFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const channelDropdownRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const rkdTopRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const rkdTopLeftStackRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [mockRows, setMockRows] = useState(getInitialMockRows)
  const [mockUploadState, setMockUploadState] = useState(getInitialMockUploadState)
  const [selectedChannelIndices, setSelectedChannelIndices] = useState(
    /** Başlangıçta tüm kanallar seçili (tablo / özet tam görünür). */
    () => new Set(CHANNEL_LABELS.map((_, i) => i + 1)),
  )
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false)
  /** Uygulanan filtreler (tablo + Kanal Detayları özeti); yalnızca "Ara" ile güncellenir */
  const [searchName, setSearchName] = useState('')
  const [searchGlobalId, setSearchGlobalId] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [homeDeliverySeg, setHomeDeliverySeg] = useState(
    /** @type {'all' | 'Evet' | 'Hayır'} */ ('all'),
  )
  const [channelStatusFilter, setChannelStatusFilter] = useState(
    /** @type {'all' | ChannelState} */ ('all'),
  )
  /** Formdaki taslak değerler; Ara’ya basılınca uygulananlara kopyalanır */
  const [pendingSearchName, setPendingSearchName] = useState('')
  const [pendingSearchGlobalId, setPendingSearchGlobalId] = useState('')
  const [pendingFilterBrand, setPendingFilterBrand] = useState('')
  const [pendingFilterCity, setPendingFilterCity] = useState('')
  const [pendingHomeDeliverySeg, setPendingHomeDeliverySeg] = useState(
    /** @type {'all' | 'Evet' | 'Hayır'} */ ('all'),
  )
  const [pendingChannelStatusFilter, setPendingChannelStatusFilter] = useState(
    /** @type {'all' | ChannelState} */ ('all'),
  )

  function applyTableFilters() {
    setSearchName(pendingSearchName)
    setSearchGlobalId(pendingSearchGlobalId)
    setFilterBrand(pendingFilterBrand)
    setFilterCity(pendingFilterCity)
    setHomeDeliverySeg(pendingHomeDeliverySeg)
    setChannelStatusFilter(pendingChannelStatusFilter)
  }
  const [viewRole, setViewRole] = useState(/** @type {'merkezOfis' | 'grupMuduru'} */ ('merkezOfis'))
  const [selectedRowId, setSelectedRowId] = useState(/** @type {string | null} */ (getInitialSelectedRowId))
  const [closeReasonRange, setCloseReasonRange] = useState(
    /** @type {CloseReasonRange} */ ('7'),
  )
  const [closeReasonEvents, setCloseReasonEvents] = useState(getInitialCloseReasonEvents)
  const [closeReasonUploadState, setCloseReasonUploadState] = useState(getInitialCloseReasonUploadState)
  const [closeReasonChannelFilter, setCloseReasonChannelFilter] = useState(
    () => new Set(CHANNEL_LABELS.map((_, i) => i + 1)),
  )
  const [closeReasonExpandedChannel, setCloseReasonExpandedChannel] = useState(null)
  const [closeReasonShowAllChannels, setCloseReasonShowAllChannels] = useState(false)
  const [closeLogPopupOpen, setCloseLogPopupOpen] = useState(false)

  /** @type {React.MutableRefObject<{ key: string; startX: number; startW: number } | null>} */
  const tableColResizeRef = useRef(null)
  const [tableColWidths, setTableColWidths] = useState(
    () =>
      /** @type {Record<string, number>} */ ({
        name: TABLE_COL_DEFAULT.name,
        brand: TABLE_COL_DEFAULT.brand,
        city: TABLE_COL_DEFAULT.city,
        evlere: TABLE_COL_DEFAULT.evlere,
      }),
  )

  const baseRows = useMemo(() => {
    if (viewRole === 'merkezOfis') return mockRows
    return mockRows.filter((r) => {
      const equipment = String(r?.equipmentId ?? '').trim().toUpperCase()
      return GROUP_MANAGER_EQUIPMENT_PREFIXES.some((p) => equipment.startsWith(p))
    })
  }, [mockRows, viewRole])

  useEffect(() => {
    if (!channelDropdownOpen) return
    function handlePointerDown(/** @type {MouseEvent} */ e) {
      const el = channelDropdownRef.current
      if (el && !el.contains(/** @type {Node} */ (e.target))) {
        setChannelDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [channelDropdownOpen])

  /** Üst band: sol (donut+Kapalı) yüksekliği = Marka + Kanal kartları; grafik altı Kapalı altı ile hizada */
  useEffect(() => {
    const top = rkdTopRef.current
    const stack = rkdTopLeftStackRef.current
    if (!top || !stack) return
    const mq = window.matchMedia('(max-width: 1100px)')
    const apply = () => {
      if (mq.matches) {
        top.style.removeProperty('--rkd-top-sync-h')
        return
      }
      top.style.setProperty('--rkd-top-sync-h', `${Math.round(stack.getBoundingClientRect().height)}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(stack)
    mq.addEventListener('change', apply)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', apply)
    }
  }, [])

  const brandOptions = useMemo(
    () =>
      [...new Set(baseRows.map((r) => String(r.brand ?? '—')))].sort((a, b) => a.localeCompare(b, 'tr')),
    [baseRows],
  )
  const cityOptions = useMemo(
    () =>
      [...new Set(baseRows.map((r) => String(r.city ?? '—')))].sort((a, b) => a.localeCompare(b, 'tr')),
    [baseRows],
  )

  const dashboardJson = useMemo(() => buildDashboardJson(baseRows), [baseRows])
  const channelLabels = dashboardJson.kanal.etiketler

  useEffect(() => {
    setTableColWidths((prev) => {
      const next = { ...prev }
      let changed = false
      channelLabels.forEach((_, i) => {
        const k = `ch${i}`
        if (next[k] == null) {
          next[k] = TABLE_COL_DEFAULT.ch
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [channelLabels])

  const onTableColResizeStart = useCallback(
    (e, key) => {
      e.preventDefault()
      e.stopPropagation()
      const startW =
        key === 'name' ? (tableColWidths.name ?? TABLE_COL_DEFAULT.name)
        : key === 'brand' ? (tableColWidths.brand ?? TABLE_COL_DEFAULT.brand)
        : key === 'city' ? (tableColWidths.city ?? TABLE_COL_DEFAULT.city)
        : key === 'evlere' ? (tableColWidths.evlere ?? TABLE_COL_DEFAULT.evlere)
        : (tableColWidths[key] ?? TABLE_COL_DEFAULT.ch)
      const startX = e.clientX
      function move(ev) {
        const delta = ev.clientX - startX
        const nw = Math.min(TABLE_COL_MAX, Math.max(TABLE_COL_MIN, startW + delta))
        setTableColWidths((prev) => ({ ...prev, [key]: nw }))
      }
      function up() {
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', up)
      }
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    },
    [tableColWidths],
  )

  const statOpenSaleResultClass = useMemo(() => {
    const y = dashboardJson.ozet.satisaAcikKanalSayisi.yuzde
    if (y >= 85) return 'rkd-stat-result--good'
    if (y >= 50) return 'rkd-stat-result--mid'
    return 'rkd-stat-result--bad'
  }, [dashboardJson.ozet.satisaAcikKanalSayisi.yuzde])
  /** Excel Kapali_Kanal_Sayisi (ve alias) sütununun satır toplamı; sütun hiç yoksa kanal hücrelerinden kapalı sayımı */
  const totalClosedChannels = useMemo(() => {
    const hasKapaliExcelCol = baseRows.some(
      (r) => typeof r.kapaliKanalSayisi === 'number' && !Number.isNaN(r.kapaliKanalSayisi),
    )
    if (hasKapaliExcelCol) {
      return baseRows.reduce((acc, r) => {
        const n = r.kapaliKanalSayisi
        return acc + (typeof n === 'number' && !Number.isNaN(n) ? n : 0)
      }, 0)
    }
    let total = 0
    for (const r of baseRows) {
      const ch = normalizeChannels(r.channels)
      total += ch.reduce((acc, st) => acc + (st === 'closed' ? 1 : 0), 0)
    }
    return total
  }, [baseRows])

  const brandPerformanceSlides = useMemo(() => {
    const tally = new Map()
    for (const r of baseRows) {
      const brand = String(r.brand ?? '—').trim() || '—'
      const ch = normalizeChannels(r.channels)
      const acc = tally.get(brand) ?? { sellable: 0, open: 0, closed: 0 }
      for (const st of ch) {
        if (st === 'na') continue
        acc.sellable += 1
        if (st === 'open') acc.open += 1
        else if (st === 'closed') acc.closed += 1
      }
      tally.set(brand, acc)
    }
    const rows = Array.from(tally.entries()).map(([brand, o]) => {
      const openPct = o.sellable === 0 ? 0 : Math.round((o.open / o.sellable) * 1000) / 10
      return { brand, closedCount: o.closed, openPct }
    })
    rows.sort(
      (a, b) =>
        b.closedCount - a.closedCount || a.brand.localeCompare(b.brand, 'tr', { sensitivity: 'base' }),
    )
    return rows
  }, [baseRows])

  const closeReasonBlocksData = useMemo(
    () =>
      buildCloseReasonBlocks(
        (() => {
          if (viewRole === 'merkezOfis') return closeReasonEvents
          const allowedEquipments = new Set(
            baseRows.map((r) => String(r.equipmentId ?? '').trim().toUpperCase()).filter(Boolean),
          )
          return closeReasonEvents.filter((ev) =>
            allowedEquipments.has(String(ev.equipmentId ?? '').trim().toUpperCase()),
          )
        })(),
        closeReasonRange,
        channelLabels,
        closeReasonChannelFilter,
      ),
    [baseRows, channelLabels, closeReasonChannelFilter, closeReasonEvents, closeReasonRange, viewRole],
  )

  const closeReasonInsights = useMemo(
    () =>
      computeCloseReasonInsights(
        closeReasonBlocksData.blocks,
        closeReasonBlocksData.inRangeCount,
      ),
    [closeReasonBlocksData.blocks, closeReasonBlocksData.inRangeCount],
  )

  const scopedCloseReasonEventCount = useMemo(() => {
    if (viewRole === 'merkezOfis') return closeReasonEvents.length
    const allowedEquipments = new Set(
      baseRows.map((r) => String(r.equipmentId ?? '').trim().toUpperCase()).filter(Boolean),
    )
    return closeReasonEvents.filter((ev) =>
      allowedEquipments.has(String(ev.equipmentId ?? '').trim().toUpperCase()),
    ).length
  }, [baseRows, closeReasonEvents, viewRole])

  useEffect(() => {
    if (closeReasonExpandedChannel == null) return
    const exists = closeReasonBlocksData.blocks.some((b) => b.channelIndex === closeReasonExpandedChannel)
    if (!exists) setCloseReasonExpandedChannel(null)
  }, [closeReasonBlocksData.blocks, closeReasonExpandedChannel])

  const visibleCloseReasonBlocks = useMemo(
    () =>
      closeReasonShowAllChannels
        ? closeReasonBlocksData.blocks
        : closeReasonBlocksData.blocks.slice(0, 2),
    [closeReasonBlocksData.blocks, closeReasonShowAllChannels],
  )

  const closeReasonDonut = useMemo(() => {
    if (!closeReasonBlocksData.blocks.length) return { segments: [], total: 0, style: {} }
    const tally = new Map()
    for (const block of closeReasonBlocksData.blocks) {
      for (const row of block.rows) {
        tally.set(row.reason, (tally.get(row.reason) ?? 0) + row.count)
      }
    }
    const allRows = Array.from(tally.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason, 'tr', { sensitivity: 'base' }))
    const total = allRows.reduce((s, r) => s + r.count, 0)
    if (total === 0) return { segments: [], total: 0, style: {} }
    const top = allRows.slice(0, 4)
    const otherCount = allRows.slice(4).reduce((s, r) => s + r.count, 0)
    const segments = otherCount > 0 ? [...top, { reason: 'Diğer', count: otherCount }] : top
    const colors = [
      'rgb(223, 71, 71)',  // en cok sebep
      'rgb(76, 190, 217)',
      'rgb(27, 201, 128)',
      'rgb(246, 183, 18)',
      'rgb(198, 165, 219)',
    ]
    let start = 0
    const slices = segments.map((seg, i) => {
      const pct = (seg.count / total) * 100
      const end = start + pct
      const out = {
        ...seg,
        pct: Math.round(pct * 10) / 10,
        color: seg.reason === 'Diğer' ? '#cfd8e3' : colors[i % colors.length],
        start,
        end,
      }
      start = end
      return out
    })
    const gradient = slices.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')
    return { segments: slices, total, style: { background: `conic-gradient(${gradient})` } }
  }, [closeReasonBlocksData.blocks])

  const selectedRestaurantRow = useMemo(
    () => baseRows.find((r) => String(r.id) === String(selectedRowId)) ?? null,
    [baseRows, selectedRowId],
  )

  const selectedRestaurantCloseLogsData = useMemo(() => {
    if (!selectedRestaurantRow) return { latestDate: '', rows: [] }
    const equipmentId = getRowEquipmentId(selectedRestaurantRow)
    if (!equipmentId) return { latestDate: '', rows: [] }
    const baseRows = closeReasonEvents.filter((ev) => String(ev.equipmentId ?? '').trim() === equipmentId)
    if (baseRows.length === 0) return { latestDate: '', rows: [] }
    const latestDate = baseRows
      .map((ev) => String(ev.date ?? '').trim())
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a, 'tr'))[0]
    if (!latestDate) return { latestDate: '', rows: [] }
    const rows = baseRows
      .map((ev) => ({
        dateSort: formatCloseDateTime(ev.closedAt ?? ev.date, ev.date).sortKey,
        channel: channelLabels[ev.channelIndex - 1] ?? `Kanal ${ev.channelIndex}`,
        reason: ev.reason,
        closedBy: String(ev.closedBy ?? 'Bilinmiyor').trim() || 'Bilinmiyor',
      }))
    return { latestDate, rows }
  }, [channelLabels, closeReasonEvents, selectedRestaurantRow])

  const selectedRowHataDetay = useMemo(() => {
    if (!selectedRestaurantRow) return null
    const row = selectedRestaurantRow
    const equip = getRowEquipmentId(row)
    const platformId = equip && String(equip).trim() !== '' ? String(equip).trim() : '—'

    const g = String(row.globalId ?? '').trim()
    const dcid =
      g && g !== '—'
        ? g
        : String(row.id ?? '')
            .split('\u001f')
            .filter(Boolean)[0] || '—'

    const ch = normalizeChannels(row.channels)
    let firstKanal = '—'
    for (let i = 0; i < ch.length; i++) {
      if (ch[i] !== 'na') {
        firstKanal = channelLabels[i] ?? `Kanal ${i + 1}`
        break
      }
    }

    const logRows = selectedRestaurantCloseLogsData.rows
    let bestSort = ''
    let latest = /** @type {(typeof logRows)[0] | null} */ (null)
    for (const r of logRows) {
      const sk = String(r.dateSort)
      if (sk.localeCompare(bestSort, 'tr') > 0) {
        bestSort = sk
        latest = r
      }
    }

    const kanal =
      latest?.channel && String(latest.channel).trim() !== '' ? String(latest.channel).trim() : firstKanal
    const tarih = latest?.dateSort ? sortKeyToSiparisTarihDisplay(latest.dateSort) : '—'
    const hataMesaji =
      latest?.reason && String(latest.reason).trim() !== ''
        ? String(latest.reason).trim()
        : DEFAULT_HATA_DETAY_MESAJI

    return {
      dcid,
      platformId,
      kanal,
      marka: String(row.brand ?? '—'),
      tarih,
      hataMesaji,
    }
  }, [channelLabels, selectedRestaurantCloseLogsData, selectedRestaurantRow])

  useEffect(() => {
    if (!closeLogPopupOpen) return
    function onEsc(e) {
      if (e.key === 'Escape') setCloseLogPopupOpen(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [closeLogPopupOpen])

  useEffect(() => {
    if (baseRows.length === 0) {
      setSelectedRowId(null)
      return
    }
    const exists = baseRows.some((r) => String(r.id) === String(selectedRowId))
    if (!exists) setSelectedRowId(String(baseRows[0].id))
  }, [baseRows, selectedRowId])

  /** Kanal / kanal durumu filtresi hariç — özet sayımları bu küme üzerinden. */
  const rowsForChannelSummary = useMemo(() => {
    let rows = baseRows
    const qCombined = `${searchName} ${searchGlobalId}`.trim()
    if (qCombined) {
      rows = rows.filter((r) => rowMatchesMultiColumnSearch(r, qCombined))
    }
    if (filterBrand) {
      rows = rows.filter((r) => r.brand === filterBrand)
    }
    if (filterCity) {
      rows = rows.filter((r) => r.city === filterCity)
    }
    if (homeDeliverySeg !== 'all') {
      rows = rows.filter((r) => r.homeDelivery === homeDeliverySeg)
    }
    return rows
  }, [baseRows, filterBrand, filterCity, homeDeliverySeg, searchGlobalId, searchName])

  const filteredRows = useMemo(() => {
    const n = channelLabels.length
    /**
     * Hiç kanal seçili değilken “kanal filtresi yok” sanılırsa tablo tüm satırları basar;
     * Temizle sonrası binlerce satırda UI donar. Seçim yok = gösterilecek satır yok.
     */
    if (selectedChannelIndices.size === 0) {
      return []
    }

    let rows = rowsForChannelSummary
    /** Tüm kanallar seçiliyse = filtre yok (aksi halde “Tümü” yalnızca en az bir kanalı tanımlı satırları bırakırdı). */
    const allChannelsSelected =
      n > 0 &&
      selectedChannelIndices.size === n &&
      channelLabels.every((_, i) => selectedChannelIndices.has(i + 1))
    const restrictByChannelPick = selectedChannelIndices.size > 0 && !allChannelsSelected

    if (restrictByChannelPick) {
      rows = rows.filter((r) => {
        const ch = normalizeChannels(r.channels)
        return Array.from(selectedChannelIndices).some((idx) => ch[idx - 1] !== 'na')
      })
    }
    if (channelStatusFilter !== 'all') {
      rows = rows.filter((r) => {
        const ch = normalizeChannels(r.channels)
        const slice = restrictByChannelPick
          ? Array.from(selectedChannelIndices).map((idx) => ch[idx - 1])
          : ch
        return slice.some((st) => st === channelStatusFilter)
      })
    }
    return rows
  }, [channelLabels, channelStatusFilter, rowsForChannelSummary, selectedChannelIndices])

  const channelSelectionSummary = useMemo(() => {
    if (selectedChannelIndices.size === 0) return []
    const rows = rowsForChannelSummary
    const indices = Array.from(selectedChannelIndices).sort((a, b) => a - b)
    /** Satır başına tek normalizeChannels; önceki sürüm kanal sayısı × satır işlemi yapıyordu. */
    /** @type {Map<number, { acik: number; kapali: number; tanimliDegil: number }>} */
    const tallies = new Map(
      indices.map((idx) => [idx, { acik: 0, kapali: 0, tanimliDegil: 0 }]),
    )
    for (const r of rows) {
      const ch = normalizeChannels(r.channels)
      for (const idx of indices) {
        const st = ch[idx - 1]
        const t = tallies.get(idx)
        if (!t) continue
        if (st === 'open') t.acik += 1
        else if (st === 'closed') t.kapali += 1
        else t.tanimliDegil += 1
      }
    }
    return indices.map((idx) => {
      const label = channelLabels[idx - 1] ?? `Kanal ${idx}`
      const t = tallies.get(idx) ?? { acik: 0, kapali: 0, tanimliDegil: 0 }
      return { label, acik: t.acik, kapali: t.kapali, tanimliDegil: t.tanimliDegil }
    })
  }, [rowsForChannelSummary, selectedChannelIndices, channelLabels])

  const [channelSummaryPage, setChannelSummaryPage] = useState(0)
  const channelSummaryTotalPages = Math.max(
    1,
    Math.ceil(channelSelectionSummary.length / CHANNEL_SUMMARY_PAGE_SIZE),
  )
  const channelSummarySafePage = Math.min(
    channelSummaryPage,
    Math.max(0, channelSummaryTotalPages - 1),
  )
  const channelSummaryPageItems = useMemo(() => {
    const start = channelSummarySafePage * CHANNEL_SUMMARY_PAGE_SIZE
    return channelSelectionSummary.slice(start, start + CHANNEL_SUMMARY_PAGE_SIZE)
  }, [channelSelectionSummary, channelSummarySafePage])

  useEffect(() => {
    setChannelSummaryPage((p) => {
      const maxP = Math.max(
        0,
        Math.ceil(channelSelectionSummary.length / CHANNEL_SUMMARY_PAGE_SIZE) - 1,
      )
      return Math.min(p, maxP)
    })
  }, [channelSelectionSummary.length])

  const goChannelSummaryPage = (dir) => {
    setChannelSummaryPage((prev) => {
      const maxP = Math.max(
        0,
        Math.ceil(channelSelectionSummary.length / CHANNEL_SUMMARY_PAGE_SIZE) - 1,
      )
      const cur = Math.min(prev, maxP)
      const next = cur + dir
      if (next < 0) return maxP
      if (next > maxP) return 0
      return next
    })
  }

  const channelTriggerLabel = useMemo(() => {
    const n = channelLabels.length
    if (n === 0) return ''
    const allSelected =
      selectedChannelIndices.size === n && channelLabels.every((_, i) => selectedChannelIndices.has(i + 1))
    if (allSelected) return 'Tüm kanallar'
    if (selectedChannelIndices.size === 0) return ''
    const indices = Array.from(selectedChannelIndices).sort((a, b) => a - b)
    return indices.map((i) => channelLabels[i - 1]).join(', ')
  }, [selectedChannelIndices, channelLabels])

  function toggleChannelFilter(index1 /** 1..kanal sayısı */) {
    startTransition(() => {
      setSelectedChannelIndices((prev) => {
        const next = new Set(prev)
        if (next.has(index1)) next.delete(index1)
        else next.add(index1)
        return next
      })
    })
  }

  function clearChannelFilter() {
    startTransition(() => {
      setSelectedChannelIndices(new Set())
    })
  }

  function selectAllChannels() {
    startTransition(() => {
      setSelectedChannelIndices(new Set(channelLabels.map((_, i) => i + 1)))
    })
  }

  function openMockExcelPicker() {
    fileInputRef.current?.click()
  }

  /**
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  async function handleMockExcelChange(e) {
    const picked = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (picked.length === 0) {
      setMockUploadState({
        kind: 'error',
        message: 'Dosya seçilmedi veya seçim sıfırlandı. Tekrar seçin (bazı tarayıcılarda input temizlenince liste boşalır).',
      })
      return
    }
    setMockUploadState({ kind: 'loading' })
    try {
      const { rows, usedFiles } = await mergeExcelFiles(picked)
      const names = usedFiles.map((f) => f.name)
      if (rows.length === 0) {
        setMockUploadState({
          kind: 'error',
          message:
            'Dosyadan okunabilir satır çıkmadı. Tablo başlığının ilk 45 satır içinde olduğunu; Restoran adı ve kanal sütunlarının (ör. Kanal 1, Yemek Sepeti) beklendiği gibi yazıldığını kontrol edin.',
        })
        return
      }
      setMockRows(rows)
      setSelectedRowId(rows[0] ? String(rows[0].id) : null)
      try {
        replaceMockExcelDataset(rows, { names })
      } catch (persistErr) {
        const pmsg = persistErr instanceof Error ? persistErr.message : String(persistErr)
        setMockUploadState({
          kind: 'error',
          message: `Tarayıcı deposu (localStorage) dolu veya yazılamadı: ${pmsg}. Tablo bu oturum için bellekte; kalıcı kayıt için “Mock JSON indir” kullanın veya depo alanı açın.`,
        })
        return
      }
      setMockUploadState({
        kind: 'success',
        rowCount: rows.length,
        fileNames: names,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMockUploadState({ kind: 'error', message: msg || 'Excel okunamadı.' })
    }
  }

  function clearMockData() {
    setMockRows([])
    setSelectedRowId(null)
    clearMockRowsStorage()
    setMockUploadState({ kind: 'idle' })
  }

  function downloadMockDashboardJsonFile() {
    const model = buildDashboardJson(mockRows)
    const text = dashboardJsonToString(model)
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cancelpanel-mock-dashboard.json'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  function openCloseReasonExcelPicker() {
    closeReasonFileInputRef.current?.click()
  }

  /**
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  async function handleCloseReasonExcelChange(e) {
    const picked = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (picked.length === 0) {
      setCloseReasonUploadState({
        kind: 'error',
        message:
          'Dosya seçilmedi. Tekrar deneyin (bazı tarayıcılarda seçim sıfırlanabilir).',
      })
      return
    }
    setCloseReasonUploadState({ kind: 'loading' })
    try {
      const { events, usedFiles } = await mergeCloseReasonExcelFiles(picked)
      const names = usedFiles.map((f) => f.name)
      if (events.length === 0) {
        setCloseReasonUploadState({
          kind: 'error',
          message:
            'Okunabilir kayıt yok. Başlık satırında Tarih, Kanal, Kapanma ve Aksiyon (Kapama) olmalı; Kapanma dolu ve Aksiyon=Kapama satırları sayılır.',
        })
        return
      }
      try {
        saveCloseReasonEventsToStorage(events)
      } catch (persistErr) {
        const pmsg = persistErr instanceof Error ? persistErr.message : String(persistErr)
        setCloseReasonUploadState({
          kind: 'error',
          message: `Depoya yazılamadı: ${pmsg}`,
        })
        return
      }
      setCloseReasonEvents(events)
      setCloseReasonUploadState({
        kind: 'success',
        eventCount: events.length,
        fileNames: names,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setCloseReasonUploadState({ kind: 'error', message: msg || 'Excel okunamadı.' })
    }
  }

  function clearCloseReasonMockData() {
    clearCloseReasonEventsStorage()
    setCloseReasonEvents([])
    setCloseReasonUploadState({ kind: 'idle' })
  }

  function downloadCloseReasonMockJsonFile() {
    const payload = {
      exportedAt: new Date().toISOString(),
      eventCount: closeReasonEvents.length,
      events: closeReasonEvents,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cancelpanel-kapama-sebepleri-mock.json'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  function toggleCloseReasonChannelFilter(index1 /** 1..N */) {
    setCloseReasonChannelFilter((prev) => {
      const next = new Set(prev)
      if (next.has(index1)) next.delete(index1)
      else next.add(index1)
      return next
    })
  }

  function clearCloseReasonChannelFilter() {
    setCloseReasonChannelFilter(new Set())
  }

  function selectAllCloseReasonChannels() {
    setCloseReasonChannelFilter(new Set(channelLabels.map((_, i) => i + 1)))
  }

  return (
    <div className="rkd">
      <header className="rkd-header">
        <h1 className="rkd-title">Online Kanallar Özet</h1>
      </header>

      <div className="rkd-top" ref={rkdTopRef}>
        <div className="rkd-stat-stack" ref={rkdTopLeftStackRef}>
          <div className="rkd-card rkd-card--stat">
            <div className="rkd-stat-card-head">
              <span className="rkd-card__label">Satışa Açık Kanal Oranı</span>
              <span
                className="rkd-stat-info"
                title="Yüzde: tanımlı (açık veya kapalı) kanallar içinde açık olanların payı; kanal durumlarından hesaplanır."
              >
                i
              </span>
            </div>
            <div className="rkd-stat-donut-wrap" aria-hidden>
              <div className="rkd-stat-donut">
                <svg className="rkd-stat-donut__svg" viewBox="0 0 100 100" role="presentation">
                  <g transform="rotate(-90 50 50)">
                    <circle
                      className="rkd-stat-donut__track"
                      cx="50"
                      cy="50"
                      r={OPEN_CHANNEL_RING_R}
                      fill="none"
                      strokeWidth="4"
                    />
                    <circle
                      className="rkd-stat-donut__arc"
                      cx="50"
                      cy="50"
                      r={OPEN_CHANNEL_RING_R}
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(dashboardJson.ozet.satisaAcikKanalSayisi.yuzde / 100) * OPEN_CHANNEL_RING_C} ${OPEN_CHANNEL_RING_C}`}
                    />
                  </g>
                </svg>
                <div className="rkd-stat-donut__inner">
                  <div className={`rkd-stat-donut__pct rkd-stat-result ${statOpenSaleResultClass}`}>
                    {dashboardJson.ozet.satisaAcikKanalSayisi.yuzde}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={
              totalClosedChannels >= 1000 ?
                'rkd-card rkd-card--stat-secondary rkd-card--closed-alarm'
              : 'rkd-card rkd-card--stat-secondary'
            }
          >
            <div className="rkd-stat-closed-total">
              <div className="rkd-stat-closed-total__head">
                <span className="rkd-stat-closed-total__label">Toplam Kapalı Kanallar</span>
                <span
                  className="rkd-stat-info"
                  title={TOP_KAPALI_KANAL_TOOLTIP}
                  aria-label={TOP_KAPALI_KANAL_TOOLTIP}
                >
                  i
                </span>
              </div>
              <strong className="rkd-stat-closed-total__value">{formatStatNumber(totalClosedChannels)}</strong>
            </div>
          </div>
        </div>

        <section className="rkd-card rkd-card--brand-closed rkd-top__brand" aria-label="Marka performans analizi">
          <h2 className="rkd-brand-closed__title">Marka Performans Analizi</h2>
          {brandPerformanceSlides.length === 0 ?
            <p className="rkd-brand-closed__empty">Yüklü veri yok.</p>
          : <BrandPerformanceCarousel slides={brandPerformanceSlides} />}
        </section>

        <div className="rkd-card rkd-card--channels rkd-top__channels" ref={channelDropdownRef}>
          <h2 className="rkd-channel-card__title">Kanal Detayları</h2>
          <div className="rkd-dd">
            <button
              type="button"
              className="rkd-dd-trigger"
              aria-expanded={channelDropdownOpen}
              aria-haspopup="listbox"
              onClick={() => setChannelDropdownOpen((v) => !v)}
            >
              <span className="rkd-dd-trigger__text">
                {channelTriggerLabel || 'Kanalları seçin…'}
              </span>
              <span className="rkd-dd-trigger__chev" aria-hidden>
                ▾
              </span>
            </button>
            {channelDropdownOpen && (
              <div className="rkd-dd-panel" role="listbox">
                <div className="rkd-dd-actions">
                  <button type="button" className="rkd-dd-link" onClick={clearChannelFilter}>
                    Temizle
                  </button>
                  <button type="button" className="rkd-dd-link" onClick={selectAllChannels}>
                    Tümü
                  </button>
                </div>
                <div className="rkd-dd-list">
                  {channelLabels.map((label, i) => {
                    const n = i + 1
                    return (
                      <label key={label} className="rkd-dd-check">
                        <input
                          type="checkbox"
                          checked={selectedChannelIndices.has(n)}
                          onChange={() => toggleChannelFilter(n)}
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {channelSelectionSummary.length > 0 && (
            <section
              className="rkd-channel-summary"
              aria-label={`Seçili kanal özeti, sayfa ${channelSummarySafePage + 1} / ${channelSummaryTotalPages}`}
            >
              <div className="rkd-channel-summary__chrome">
                {channelSummaryTotalPages > 1 && (
                  <button
                    type="button"
                    className="rkd-brand-carousel__arrow rkd-channel-summary__arrow"
                    onClick={() => goChannelSummaryPage(-1)}
                    aria-label="Önceki kanal özeti sayfası"
                  >
                    ‹
                  </button>
                )}
                <div className="rkd-channel-summary__viewport">
                  {channelSummaryPageItems.map(({ label, acik, kapali, tanimliDegil }) => (
                    <div key={label} className="rkd-channel-summary__block">
                      <div className="rkd-channel-summary__title">{label}</div>
                      <div className="rkd-channel-summary__stats">
                        <div className="rkd-channel-summary__row rkd-channel-summary__row--metrics">
                          <span className="rkd-channel-summary__stat rkd-channel-summary__stat--open">
                            <span className="rkd-channel-summary__dot" aria-hidden />
                            <span className="rkd-channel-summary__stat-col">
                              <span className="rkd-channel-summary__lbl">Açık:</span>
                              <strong>{formatStatNumber(acik)}</strong>
                            </span>
                          </span>
                          <span className="rkd-channel-summary__pipe" aria-hidden>
                            |
                          </span>
                          <span className="rkd-channel-summary__stat rkd-channel-summary__stat--closed">
                            <span className="rkd-channel-summary__dot" aria-hidden />
                            <span className="rkd-channel-summary__stat-col">
                              <span className="rkd-channel-summary__lbl">Kapalı:</span>
                              <strong>{formatStatNumber(kapali)}</strong>
                            </span>
                          </span>
                          <span className="rkd-channel-summary__pipe" aria-hidden>
                            |
                          </span>
                          <span className="rkd-channel-summary__stat rkd-channel-summary__stat--na">
                            <span className="rkd-channel-summary__dot" aria-hidden />
                            <span className="rkd-channel-summary__stat-col">
                              <span className="rkd-channel-summary__lbl">Tanımlı değil:</span>
                              <strong>{formatStatNumber(tanimliDegil)}</strong>
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {channelSummaryTotalPages > 1 && (
                  <button
                    type="button"
                    className="rkd-brand-carousel__arrow rkd-channel-summary__arrow"
                    onClick={() => goChannelSummaryPage(1)}
                    aria-label="Sonraki kanal özeti sayfası"
                  >
                    ›
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="rkd-main">
        <div className="rkd-table-wrap">
          <div className="rkd-widget-head">
            <h2 className="rkd-widget-title">Online Satış Kanalları - Restoran Durum</h2>
            <div className="rkd-widget-filters">
              <div className="rkd-widget-filters__grid">
                <label className="rkd-field">
                  <span className="rkd-field__label">Ara</span>
                  <input
                    type="search"
                    className="rkd-input"
                    placeholder="Tüm sütunlarda ara (ad, marka, il, ID, kanal…)"
                    value={pendingSearchName}
                    onChange={(e) => setPendingSearchName(e.target.value)}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyTableFilters()
                    }}
                  />
                </label>
                <label className="rkd-field">
                  <span className="rkd-field__label">Ara (ek)</span>
                  <input
                    type="search"
                    className="rkd-input"
                    placeholder="İsteğe bağlı ek kelimeler (birlikte uygulanır)"
                    value={pendingSearchGlobalId}
                    onChange={(e) => setPendingSearchGlobalId(e.target.value)}
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyTableFilters()
                    }}
                  />
                </label>
                <label className="rkd-field">
                  <span className="rkd-field__label">Marka</span>
                  <select
                    className="rkd-select"
                    value={pendingFilterBrand}
                    onChange={(e) => setPendingFilterBrand(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {brandOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rkd-field">
                  <span className="rkd-field__label">İl</span>
                  <select
                    className="rkd-select"
                    value={pendingFilterCity}
                    onChange={(e) => setPendingFilterCity(e.target.value)}
                  >
                    <option value="">Tümü</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rkd-widget-filters__grid-end">
                  <button type="button" className="rkd-widget-ara" onClick={applyTableFilters}>
                    Ara
                  </button>
                  <span className="rkd-widget-count">{filteredRows.length} restoran</span>
                </div>
              </div>
              <div className="rkd-widget-filters__status-row">
                <div className="rkd-widget-filters__status-block">
                  <span className="rkd-widget-filters__status-label">Evlere servis:</span>
                  <div className="rkd-pill-group" role="group" aria-label="Evlere servis: Hepsi, Aktif, Pasif">
                    {(
                      /** @type {const} */ ([
                        ['all', 'Hepsi'],
                        ['Evet', 'Aktif'],
                        ['Hayır', 'Pasif'],
                      ])
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className={`rkd-pill ${pendingHomeDeliverySeg === val ? 'active' : ''}`}
                        onClick={() => setPendingHomeDeliverySeg(/** @type {'all' | 'Evet' | 'Hayır'} */ (val))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rkd-widget-filters__status-block">
                  <span className="rkd-widget-filters__status-label">Kanal durumu:</span>
                  <div className="rkd-pill-group" role="group" aria-label="Kanal durumu">
                    {(
                      /** @type {const} */ ([
                        ['all', 'Hepsi'],
                        ['open', 'Açık'],
                        ['closed', 'Kapalı'],
                        ['na', 'Satış yapmıyor'],
                      ])
                    ).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        className={`rkd-pill ${pendingChannelStatusFilter === val ? 'active' : ''}`}
                        onClick={() =>
                          setPendingChannelStatusFilter(/** @type {'all' | ChannelState} */ (val))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rkd-table-scroll">
            <table className="rkd-table">
              <colgroup>
                <col style={{ width: tableColWidths.name ?? TABLE_COL_DEFAULT.name }} />
                <col style={{ width: tableColWidths.brand ?? TABLE_COL_DEFAULT.brand }} />
                <col style={{ width: tableColWidths.city ?? TABLE_COL_DEFAULT.city }} />
                <col style={{ width: tableColWidths.evlere ?? TABLE_COL_DEFAULT.evlere }} />
                {channelLabels.map((_, i) => (
                  <col key={`col-ch-${i}`} style={{ width: tableColWidths[`ch${i}`] ?? TABLE_COL_DEFAULT.ch }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <RkdResizeTh
                    colKey="name"
                    width={tableColWidths.name ?? TABLE_COL_DEFAULT.name}
                    className="rkd-th-name"
                    onResizeStart={onTableColResizeStart}
                  >
                    Restoran adı
                  </RkdResizeTh>
                  <RkdResizeTh
                    colKey="brand"
                    width={tableColWidths.brand ?? TABLE_COL_DEFAULT.brand}
                    onResizeStart={onTableColResizeStart}
                  >
                    Marka
                  </RkdResizeTh>
                  <RkdResizeTh
                    colKey="city"
                    width={tableColWidths.city ?? TABLE_COL_DEFAULT.city}
                    onResizeStart={onTableColResizeStart}
                  >
                    İl
                  </RkdResizeTh>
                  <RkdResizeTh
                    colKey="evlere"
                    width={tableColWidths.evlere ?? TABLE_COL_DEFAULT.evlere}
                    className="rkd-col-evlere"
                    onResizeStart={onTableColResizeStart}
                  >
                    Evlere servis
                  </RkdResizeTh>
                  {channelLabels.map((c, i) => (
                    <RkdResizeTh
                      key={c}
                      colKey={`ch${i}`}
                      width={tableColWidths[`ch${i}`] ?? TABLE_COL_DEFAULT.ch}
                      className="rkd-ch-num"
                      onResizeStart={onTableColResizeStart}
                    >
                      {c}
                    </RkdResizeTh>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4 + channelLabels.length} className="rkd-td-empty">
                      {selectedChannelIndices.size === 0 && channelLabels.length > 0 ?
                        "Kanal Detaylarından en az bir kanal seçin veya Tümü'ye basın."
                      : 'Gösterilecek satır yok. Veri bağlandığında burada listelenecek veya filtreleri gevşetin.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedRowId === row.id ? 'selected' : ''}
                      onClick={() => {
                        setSelectedRowId(row.id)
                        setCloseLogPopupOpen(true)
                      }}
                    >
                      <td className="rkd-td-name">{row.name}</td>
                      <td>
                        <span className="rkd-brand-pill">{row.brand}</span>
                      </td>
                      <td>{row.city}</td>
                      <td className="rkd-col-evlere">
                        <HomeDeliveryCell value={row.homeDelivery} />
                      </td>
                      {normalizeChannels(row.channels).map((st, i) => (
                        <td key={i} className="rkd-td-icon">
                          <StatusCell state={st} />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="rkd-close-reasons" aria-labelledby="rkd-close-reasons-heading">
        <div className="rkd-close-reasons__panel">
          <h2 id="rkd-close-reasons-heading" className="rkd-close-reasons__title">
            Kanal Kapatılma Sebepleri
          </h2>
          <div className="rkd-close-layout">
            <aside className="rkd-close-layout__filters">
              <div className="rkd-close-filter-block">
                <h3 className="rkd-close-filter-block__title">Tarih aralığı</h3>
                <div className="rkd-close-reasons__ranges" role="radiogroup" aria-label="Zaman aralığı">
                  {(
                    /** @type {const} */ ([
                      ['today', 'Bugün'],
                      ['7', 'Son 7 gün'],
                      ['15', 'Son 15 gün'],
                      ['30', 'Son 30 gün'],
                    ])
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`rkd-close-reasons__range ${closeReasonRange === val ? 'rkd-close-reasons__range--active' : ''}`}
                      aria-pressed={closeReasonRange === val}
                      onClick={() => setCloseReasonRange(/** @type {CloseReasonRange} */ (val))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rkd-close-filter-block">
                <div className="rkd-close-filter-block__head">
                  <h3 className="rkd-close-filter-block__title">Kanallar</h3>
                  <div className="rkd-close-reasons__filter-actions">
                    <button type="button" className="rkd-close-reasons__filter-link" onClick={clearCloseReasonChannelFilter}>
                      Temizle
                    </button>
                    <button type="button" className="rkd-close-reasons__filter-link" onClick={selectAllCloseReasonChannels}>
                      Tümü
                    </button>
                  </div>
                </div>
                <div className="rkd-close-reasons__filter-grid" role="group" aria-label="Kanal seçimi">
                  {channelLabels.map((label, i) => {
                    const n = i + 1
                    return (
                      <label key={label} className="rkd-close-reasons__filter-check">
                        <input
                          type="checkbox"
                          checked={closeReasonChannelFilter.has(n)}
                          onChange={() => toggleCloseReasonChannelFilter(n)}
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </aside>

            <div className="rkd-close-layout__content">
            {scopedCloseReasonEventCount === 0 ? (
                <p className="rkd-close-reasons__empty">Veri yokken grafik gösterilmez.</p>
              ) : closeReasonChannelFilter.size === 0 ? (
                <p className="rkd-close-reasons__empty">
                  Kanal filtresinde en az bir kanal seçin (&quot;Tümünü seç&quot;).
                </p>
              ) : closeReasonBlocksData.blocks.length === 0 ? (
                <p className="rkd-close-reasons__empty">Seçilen kanal ve tarih aralığında kayıt yok.</p>
              ) : (
                <>
                  <div className="rkd-close-top-widgets">
                    <section className="rkd-close-donut-card">
                      <h3 className="rkd-close-card-title">En çok kullanılan kapama sebepleri</h3>
                      <div className="rkd-close-donut-card__body">
                        <div className="rkd-close-donut" style={closeReasonDonut.style} aria-hidden />
                        <ul className="rkd-close-donut-legend">
                          {closeReasonDonut.segments.map((s) => (
                            <li key={s.reason} className="rkd-close-donut-legend__item">
                              <span className="rkd-close-donut-legend__dot" style={{ background: s.color }} />
                              <span className="rkd-close-donut-legend__reason" title={s.reason}>
                                {s.reason}
                              </span>
                              <strong className="rkd-close-donut-legend__pct">{s.pct}%</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>

                    <section className="rkd-close-minmax-card">
                      <h3 className="rkd-close-card-title">Kanal kapanma özeti</h3>
                      <div className="rkd-close-minmax-grid">
                        <div className="rkd-close-minmax-box">
                          <span className="rkd-close-minmax-box__label">En çok kapatılan kanal</span>
                          <strong className="rkd-close-minmax-box__value">{closeReasonInsights?.maxCh.label ?? '—'}</strong>
                          <span className="rkd-close-minmax-box__meta">
                            {formatStatNumber(closeReasonInsights?.maxCh.total ?? 0)} kayıt
                          </span>
                        </div>
                        <div className="rkd-close-minmax-box">
                          <span className="rkd-close-minmax-box__label">En az kapama yapılan kanal</span>
                          <strong className="rkd-close-minmax-box__value">{closeReasonInsights?.minCh.label ?? '—'}</strong>
                          <span className="rkd-close-minmax-box__meta">
                            {formatStatNumber(closeReasonInsights?.minCh.total ?? 0)} kayıt
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="rkd-close-channels-head">
                    <h3 className="rkd-close-card-title">Kanal bazında kapama sebepleri</h3>
                    {closeReasonBlocksData.blocks.length > 2 && (
                      <button
                        type="button"
                        className="rkd-close-channels-toggle"
                        onClick={() => setCloseReasonShowAllChannels((v) => !v)}
                      >
                        {closeReasonShowAllChannels ? 'Daralt' : 'Tüm kanallar'} →
                      </button>
                    )}
                  </div>
                  <div className="rkd-close-channels-grid">
                    {visibleCloseReasonBlocks.map((block) => {
                      const expanded = closeReasonExpandedChannel === block.channelIndex
                      const shownRows = expanded ? block.rows : block.rows.slice(0, 5)
                      return (
                        <article key={block.channelIndex} className={`rkd-close-channel-card ${expanded ? 'is-expanded' : ''}`}>
                          <header className="rkd-close-channel-card__head">
                            <div className="rkd-close-channel-card__head-main">
                              <h3 className="rkd-cr-channel__title">{block.label}</h3>
                              <span className="rkd-cr-channel__total">
                                {formatStatNumber(block.total)} kayıt
                              </span>
                            </div>
                            {block.rows.length > 5 && (
                              <button
                                type="button"
                                className="rkd-close-channel-card__toggle"
                                onClick={() =>
                                  setCloseReasonExpandedChannel((prev) =>
                                    prev === block.channelIndex ? null : block.channelIndex,
                                  )
                                }
                                aria-label={expanded ? 'Kapat' : 'Diğer kapama sebeplerini göster'}
                                aria-expanded={expanded}
                              >
                                {expanded ? '▴' : '▾'}
                              </button>
                            )}
                          </header>

                          <ul className="rkd-cr-channel__list">
                            {shownRows.map(({ reason, count }) => {
                              const pctOfCh = block.total > 0 ? Math.round((count / block.total) * 1000) / 10 : 0
                              return (
                                <li key={reason} className="rkd-cr-reason-row">
                                  <span className="rkd-cr-reason-text" title={reason}>
                                    {reason}
                                  </span>
                                  <div className="rkd-cr-reason-bar-cell">
                                    <div className="rkd-cr-reason-track" aria-hidden>
                                      <div
                                        className="rkd-cr-reason-fill"
                                        style={{
                                          width: `${block.maxInChannel > 0 ? (count / block.maxInChannel) * 100 : 0}%`,
                                        }}
                                    />
                                    </div>
                                  </div>
                                <span className="rkd-cr-reason-count">
                                  {formatStatNumber(count)} <span className="rkd-cr-reason-pct">({pctOfCh}%)</span>
                                </span>
                                </li>
                              )
                            })}
                          </ul>
                        </article>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rkd-close-reasons__upload-footer rkd-mock-upload">
            <h3 className="rkd-mock-upload__title">Kapama sebepleri (mock Excel)</h3>
            <p className="rkd-close-reasons__upload-hint">
              Rapor sütunları: <strong>Tarih</strong> (ör. 21-03-26 21:03 veya YYYY-AA-GG),{' '}
              <strong>Kanal</strong> (platform adı veya 1–9), <strong>Kapanma</strong> (kapama sebebi; NULL/boş
              satırlar sayılmaz), <strong>Aksiyon</strong> yalnızca <strong>Kapama</strong> olan satırlar
              dahildir (Açma satırları hariç). İsterseniz aynı yapıyı içeren <strong>JSON</strong> dosyası da
              yükleyebilirsiniz.
            </p>
            <input
              ref={closeReasonFileInputRef}
              type="file"
              className="rkd-mock-upload__input"
              accept=".xlsx,.xlsm,.xls,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              multiple
              onChange={handleCloseReasonExcelChange}
              aria-hidden
              tabIndex={-1}
            />
            <div className="rkd-mock-upload__row">
              <button
                type="button"
                className="rkd-mock-upload__btn"
                onClick={openCloseReasonExcelPicker}
                disabled={closeReasonUploadState.kind === 'loading'}
              >
                {closeReasonUploadState.kind === 'loading' ? 'Yükleniyor…' : 'Excel / JSON yükle (kapama sebepleri)'}
              </button>
              {closeReasonEvents.length > 0 && (
                <>
                  <button
                    type="button"
                    className="rkd-mock-upload__btn rkd-mock-upload__btn--ghost"
                    onClick={downloadCloseReasonMockJsonFile}
                  >
                    Mock JSON indir
                  </button>
                  <button
                    type="button"
                    className="rkd-mock-upload__btn rkd-mock-upload__btn--ghost"
                    onClick={clearCloseReasonMockData}
                  >
                    Mock veriyi temizle
                  </button>
                </>
              )}
            </div>
            <p className="rkd-mock-upload__status" role="status" aria-live="polite">
              {closeReasonUploadState.kind === 'loading' && (
                <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--loading">
                  Kapama sebepleri dosyası okunuyor…
                </span>
              )}
              {closeReasonUploadState.kind === 'success' && (
                <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--ok">
                  Yüklü: {formatStatNumber(closeReasonUploadState.eventCount)} kayıt
                  {closeReasonUploadState.fileNames.length > 0 && (
                    <>
                      {' '}
                      · {closeReasonUploadState.fileNames.join(', ')}
                    </>
                  )}
                </span>
              )}
              {closeReasonUploadState.kind === 'error' && (
                <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--err">
                  {closeReasonUploadState.message}
                </span>
              )}
              {closeReasonUploadState.kind === 'idle' && closeReasonEvents.length === 0 && (
                <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--muted">
                  Bu grafik için henüz kapama sebebi yok. Aşağıdaki butonla Excel yükleyin.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {closeLogPopupOpen && selectedRestaurantRow && selectedRowHataDetay && (
        <HataDetayPanel
          dcid={selectedRowHataDetay.dcid}
          platformId={selectedRowHataDetay.platformId}
          kanal={selectedRowHataDetay.kanal}
          marka={selectedRowHataDetay.marka}
          tarih={selectedRowHataDetay.tarih}
          hataMesaji={selectedRowHataDetay.hataMesaji}
          onClose={() => setCloseLogPopupOpen(false)}
        />
      )}

      <footer className="rkd-footer">
        <div className="rkd-mock-upload">
          <h3 className="rkd-mock-upload__title">Restoran kanal açık/kapalı</h3>
          <input
            ref={fileInputRef}
            type="file"
            className="rkd-mock-upload__input"
            accept=".xlsx,.xlsm,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            multiple
            onChange={handleMockExcelChange}
            aria-hidden
            tabIndex={-1}
          />
          <div className="rkd-mock-upload__row">
            <button
              type="button"
              className="rkd-mock-upload__btn"
              onClick={openMockExcelPicker}
              disabled={mockUploadState.kind === 'loading'}
            >
              {mockUploadState.kind === 'loading' ? 'Yükleniyor…' : 'Excel yükle (mock veri)'}
            </button>
            {mockRows.length > 0 && (
              <>
                <button
                  type="button"
                  className="rkd-mock-upload__btn rkd-mock-upload__btn--ghost"
                  onClick={downloadMockDashboardJsonFile}
                >
                  Mock JSON indir
                </button>
                <button type="button" className="rkd-mock-upload__btn rkd-mock-upload__btn--ghost" onClick={clearMockData}>
                  Mock veriyi temizle
                </button>
              </>
            )}
          </div>
          <p className="rkd-mock-upload__status" role="status" aria-live="polite">
            {mockUploadState.kind === 'loading' && (
              <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--loading">
                Dosyalar okunuyor, lütfen bekleyin…
              </span>
            )}
            {mockUploadState.kind === 'success' && (
              <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--ok">
                Hazır: {mockUploadState.rowCount} satır
                {mockUploadState.fileNames.length > 0 && (
                  <>
                    {' '}
                    · {mockUploadState.fileNames.length} dosya: {mockUploadState.fileNames.join(', ')}
                  </>
                )}
              </span>
            )}
            {mockUploadState.kind === 'error' && (
              <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--err">
                {mockUploadState.message}
              </span>
            )}
            {mockUploadState.kind === 'idle' && mockRows.length === 0 && (
              <span className="rkd-mock-upload__status-line rkd-mock-upload__status-line--muted">
                Mock veri yok. Excel seçerek yükleyin.
              </span>
            )}
          </p>
        </div>
        <div className="rkd-role-panel">
          <div className="rkd-role-toggle" role="group" aria-label="Görünüm yetkisi">
            <button
              type="button"
              className={`rkd-role-toggle__btn ${viewRole === 'merkezOfis' ? 'active' : ''}`}
              onClick={() => setViewRole('merkezOfis')}
            >
              Merkez Ofis
            </button>
            <button
              type="button"
              className={`rkd-role-toggle__btn ${viewRole === 'grupMuduru' ? 'active' : ''}`}
              onClick={() => setViewRole('grupMuduru')}
            >
              Grup Müdürü
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
