import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FileSpreadsheet, Search } from 'lucide-react'
import {
  formatComparedAt,
  sortStores,
  storeStatusLabel,
  tagToneClass,
} from './formatters'

const PAGE_SIZES = [50, 75, 100]

function sortIconFor(col, sortKey, sortDir) {
  if (sortKey !== col) return null
  return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
}

export default function BandResultPanel({ runState, onSelectStore, onExport, exportError }) {
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('default')
  const [sortDir, setSortDir] = useState('desc')

  const filters = runState.filters ?? {}
  const summary = runState.summary ?? {}
  const failedStores = runState.failedStores ?? []
  const hasFailed = failedStores.length > 0
  const hasPriceDiff = summary.hasPriceDiff

  const decisionTitle = hasFailed
    ? hasPriceDiff
      ? 'Karşılaştırılan mağazalarda fiyat farkı var'
      : 'Karşılaştırılan mağazalarda fiyat farkı yok'
    : hasPriceDiff
      ? 'Bu fiyat bandında fiyat farkı var'
      : 'Bu fiyat bandında fiyat farkı yok'

  const stores = useMemo(() => {
    let list = sortStores(runState.stores ?? [])
    const q = search.trim().toLocaleLowerCase('tr')
    if (q) {
      list = list.filter(
        (s) =>
          s.storeName.toLocaleLowerCase('tr').includes(q) ||
          String(s.trendyolStoreId).includes(q),
      )
    }
    if (sortKey !== 'default') {
      list = [...list].sort((a, b) => {
        let va = a[sortKey]
        let vb = b[sortKey]
        if (sortKey === 'storeName') {
          va = String(va).localeCompare(String(vb), 'tr')
          vb = 0
          return sortDir === 'asc' ? va : -va
        }
        va = Number(va ?? 0)
        vb = Number(vb ?? 0)
        return sortDir === 'asc' ? va - vb : vb - va
      })
    }
    return list
  }, [runState.stores, search, sortKey, sortDir])

  const maxPage = Math.max(1, Math.ceil(stores.length / pageSize) || 1)
  const safePage = Math.min(page, maxPage)
  const slice = stores.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const metaLine = `${filters.brandName ?? ''} · ${filters.productGroupName ?? ''} · ${filters.priceGroupName ?? ''} · Trendyol Go · ${summary.storeCount ?? 0} mağaza karşılaştırıldı`

  return (
    <div className="cpc-band">
      <div className={`cpc-decision ${hasPriceDiff ? 'cpc-decision--warn' : 'cpc-decision--ok'}`}>
        <div className="cpc-decision__main">
          <h3 className="cpc-decision__title">{decisionTitle}</h3>
          <p className="cpc-decision__meta">{metaLine}</p>
        </div>
        <button type="button" className="cpc-btnExport" onClick={onExport}>
          <FileSpreadsheet size={16} />
          Excel&apos;e aktar
        </button>
      </div>
      {exportError ? <p className="cpc-alert cpc-alert--err">{exportError}</p> : null}

      {hasFailed ? (
        <p className="cpc-failedWarn" role="status">
          ⚠ {failedStores.length} mağaza kanal yanıt vermediği için karşılaştırılamadı:{' '}
          {failedStores.map((f) => `${f.storeName} (${f.trendyolStoreId})`).join(', ')}. Yeniden karşılaştırabilirsiniz.
        </p>
      ) : null}

      <div className="cpc-kpiRow">
        <div className="cpc-kpi">
          <span className="cpc-kpi__label">Restoran</span>
          <strong className="cpc-kpi__val">{summary.storeCount ?? 0}</strong>
        </div>
        <div className="cpc-kpi">
          <span className="cpc-kpi__label">Fiyat farkı olan</span>
          <strong className="cpc-kpi__val">{summary.priceDiffStoreCount ?? 0}</strong>
        </div>
        <div className="cpc-kpi">
          <span className="cpc-kpi__label">Eksik kayıtlı</span>
          <strong className="cpc-kpi__val">{summary.missingStoreCount ?? 0}</strong>
        </div>
        <div className="cpc-kpi">
          <span className="cpc-kpi__label">Farksız</span>
          <strong className="cpc-kpi__val">{summary.okStoreCount ?? 0}</strong>
        </div>
      </div>

      <div className="cpc-tableToolbar">
        <label className="cpc-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Restoran adı veya Trendyol store ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>

      <div className="cpc-tableWrap">
        <table className="cpc-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="cpc-thBtn" onClick={() => toggleSort('storeName')}>
                  Restoran {sortIconFor('storeName', sortKey, sortDir)}
                </button>
              </th>
              <th>Trendyol store ID</th>
              <th>
                <button type="button" className="cpc-thBtn" onClick={() => toggleSort('priceDiffCount')}>
                  Farklı kalem {sortIconFor('priceDiffCount', sortKey, sortDir)}
                </button>
              </th>
              <th>
                <button type="button" className="cpc-thBtn" onClick={() => toggleSort('missingCount')}>
                  Eksik kayıt {sortIconFor('missingCount', sortKey, sortDir)}
                </button>
              </th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={5} className="cpc-emptyCell">
                  Aramaya uyan restoran yok.
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr
                  key={row.trendyolStoreId}
                  className="cpc-table__clickRow"
                  onClick={() => onSelectStore(row)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectStore(row)
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td>{row.storeName}</td>
                  <td className="cpc-mono">{row.trendyolStoreId}</td>
                  <td>{row.priceDiffCount}</td>
                  <td>{row.missingCount}</td>
                  <td>
                    <span className={tagToneClass(row.storeStatus === 'OK' ? 'green' : row.storeStatus === 'PRICE_DIFF' ? 'orange' : 'blue')}>
                      {storeStatusLabel(row.storeStatus)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="cpc-tableFooter">
        <label className="cpc-pageSize">
          Sayfa boyutu
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="cpc-pager">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </button>
          <span>
            Sayfa {safePage} / {maxPage}
          </span>
          <button type="button" disabled={safePage >= maxPage} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </button>
        </div>
      </div>

      <p className="cpc-metaTime">Karşılaştırma zamanı: {formatComparedAt(runState.comparedAt)}</p>
    </div>
  )
}
