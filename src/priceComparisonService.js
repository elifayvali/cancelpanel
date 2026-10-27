import * as XLSX from 'xlsx'
import {
  mockCancelRun,
  mockExportRun,
  mockGetBrandsWithCcsId,
  mockGetPriceGroups,
  mockGetProductGroups,
  mockGetRun,
  mockGetStoreDetail,
  mockStartRun,
  ALLOWED_CCS_IDS,
} from './priceComparisonMock'

function isMockModeEnabled() {
  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search)
    if (q.get('priceMock') === '0') return false
  }
  return import.meta.env.VITE_PRICE_COMPARISON_MOCK !== 'false'
}

function commonBase() {
  const base = import.meta.env.VITE_COMMON_API_URL || ''
  return base.replace(/\/$/, '')
}

async function parseError(res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    /* ignore */
  }
  const message = body?.message || res.statusText || 'İstek başarısız.'
  const err = new Error(message)
  err.httpStatus = res.status
  err.errorCode = body?.errorCode
  throw err
}

async function apiGet(path, authHeader, signal) {
  const res = await fetch(`${commonBase()}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json', ...authHeader },
    signal,
  })
  if (!res.ok) await parseError(res)
  return res.json()
}

async function apiPost(path, body, authHeader, signal) {
  const res = await fetch(`${commonBase()}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) await parseError(res)
  return res.json()
}

export function isPriceComparisonMock() {
  return isMockModeEnabled()
}

export async function getBrandsWithCcsId(authHeader, signal) {
  if (isMockModeEnabled()) return mockGetBrandsWithCcsId()
  const data = await apiGet('/brand/getAllWithCcsId', authHeader, signal)
  const list = Array.isArray(data) ? data : data?.data ?? []
  return list.filter((b) => ALLOWED_CCS_IDS.has(String(b.ccsId ?? b.id)))
}

export async function getProductGroups(ccsId, authHeader, signal) {
  if (isMockModeEnabled()) return mockGetProductGroups(ccsId)
  return apiGet(
    `/price-comparison/product-groups?ccsId=${encodeURIComponent(ccsId)}`,
    authHeader,
    signal,
  )
}

export async function getPriceGroups(ccsId, productGroupId, authHeader, signal) {
  if (isMockModeEnabled()) return mockGetPriceGroups(ccsId, productGroupId)
  return apiGet(
    `/price-comparison/price-groups?ccsId=${encodeURIComponent(ccsId)}&productGroupId=${encodeURIComponent(productGroupId)}`,
    authHeader,
    signal,
  )
}

export async function startRun(payload, authHeader, signal) {
  if (isMockModeEnabled()) return mockStartRun(payload)
  return apiPost('/price-comparison/runs', payload, authHeader, signal)
}

export async function getRun(runId, authHeader, signal) {
  if (isMockModeEnabled()) return mockGetRun(runId)
  return apiGet(`/price-comparison/runs/${encodeURIComponent(runId)}`, authHeader, signal)
}

export async function getStoreDetail(runId, trendyolStoreId, authHeader, signal) {
  if (isMockModeEnabled()) return mockGetStoreDetail(runId, trendyolStoreId)
  return apiGet(
    `/price-comparison/runs/${encodeURIComponent(runId)}/stores/${encodeURIComponent(trendyolStoreId)}`,
    authHeader,
    signal,
  )
}

export async function cancelRun(runId, authHeader) {
  if (isMockModeEnabled()) return mockCancelRun(runId)
  const url = `${commonBase()}/price-comparison/runs/${encodeURIComponent(runId)}/cancel`
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    }
  } catch {
    /* ignore */
  }
  return apiPost(`/price-comparison/runs/${encodeURIComponent(runId)}/cancel`, {}, authHeader)
}

function slugFilePart(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-ğüşıöçĞÜŞİÖÇ]/gi, '')
    .slice(0, 40)
}

function stampFile() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export async function exportRunToExcel(runId, statusFilter, authHeader) {
  let run
  if (isMockModeEnabled()) {
    run = await mockExportRun(runId)
  } else {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
    const res = await fetch(`${commonBase()}/price-comparison/runs/${encodeURIComponent(runId)}/export${q}`, {
      headers: { ...authHeader },
    })
    if (!res.ok) await parseError(res)
    const blob = await res.blob()
    const disp = res.headers.get('Content-Disposition') || ''
    const match = /filename="?([^";]+)"?/.exec(disp)
    const name = match?.[1] || `fiyat-karsilastirma-${stampFile()}.xlsx`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const rows = []
  for (const s of run.stores ?? []) {
    rows.push({
      Restoran: s.storeName,
      'Trendyol store ID': s.trendyolStoreId,
      'Farklı kalem': s.priceDiffCount,
      'Eksik kayıt': s.missingCount,
      Durum: s.storeStatus,
    })
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Restoranlar')
  const f = run.filters ?? {}
  const fname = `fiyat-karsilastirma_${slugFilePart(f.brandName)}_${slugFilePart(f.productGroupName)}_${slugFilePart(f.priceGroupName)}_${stampFile()}.xlsx`
  XLSX.writeFile(wb, fname)
}
