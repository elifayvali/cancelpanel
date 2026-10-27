import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import {
  DETAIL_FILTER_CHIPS,
  filterDetailProducts,
  formatDiff,
  formatPrice,
  groupStatusLabel,
  isExpandableProductRow,
  isProductNameMuted,
  productDisplayName,
  productStatusTags,
  sortProducts,
  statusLabel,
  tagToneClass,
} from './formatters'

const PAGE_SIZES = [50, 75, 100]

function ProductTable({
  title,
  rows,
  filterId,
  search,
  emptyHint,
}) {
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(() => new Set())

  const prepared = useMemo(() => {
    const sorted = sortProducts(rows)
    return filterDetailProducts(sorted, filterId, search)
  }, [rows, filterId, search])

  const maxPage = Math.max(1, Math.ceil(prepared.length / pageSize) || 1)
  const safePage = Math.min(page, maxPage)
  const slice = prepared.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleExpand = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const rowKey = (row) => row.trendyolProductId || row.ccsPlu || row.ccsName || row.channelName

  return (
    <section className="cpc-detailSection">
      <h3 className="cpc-detailSection__title">{title}</h3>
      <div className="cpc-tableWrap">
        <table className="cpc-table cpc-table--products">
          <thead>
            <tr>
              <th>Ürün / opsiyon</th>
              <th>Trendyol ID</th>
              <th>CCS PLU</th>
              <th>CCS ürün adı</th>
              <th>Kanal fiyatı</th>
              <th>CCS fiyatı</th>
              <th>Fark</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={8} className="cpc-emptyCell">
                  {emptyHint}
                </td>
              </tr>
            ) : (
              slice.map(({ row, isContextRow, forceOpen, visibleGroups }) => {
                const key = rowKey(row)
                const canExpand = isExpandableProductRow(row)
                const isOpen = forceOpen || expanded.has(key)
                const showExpand = canExpand && (forceOpen || expanded.has(key))

                return (
                  <Fragment key={key}>
                    <tr className={isContextRow ? 'cpc-row--context' : ''}>
                      <td>
                        {canExpand && !forceOpen ? (
                          <button
                            type="button"
                            className={`cpc-expandBtn ${isOpen ? 'cpc-expandBtn--open' : ''}`}
                            onClick={() => toggleExpand(key)}
                            aria-expanded={isOpen}
                          >
                            <ChevronDown size={16} />
                            <span className={isProductNameMuted(row) ? 'cpc-mutedName' : ''}>
                              {productDisplayName(row)}
                            </span>
                          </button>
                        ) : (
                          <span className={isProductNameMuted(row) ? 'cpc-mutedName' : ''}>
                            {productDisplayName(row)}
                            {isContextRow ? (
                              <span className="cpc-contextNote"> · filtreye uyan opsiyonları var</span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="cpc-mono">{row.trendyolProductId || '–'}</td>
                      <td className="cpc-mono">{row.ccsPlu || '–'}</td>
                      <td>{row.ccsName || '–'}</td>
                      <td>{formatPrice(row.channelPrice)}</td>
                      <td>{formatPrice(row.ccsPrice)}</td>
                      <td className={row.status === 'PRICE_DIFF' ? 'cpc-diffCell' : ''}>{formatDiff(row.diff)}</td>
                      <td>
                        <div className="cpc-tagStack">
                          {productStatusTags(row).map((t) => (
                            <span key={t.key} className={tagToneClass(t.tone)}>
                              {t.label}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {showExpand && visibleGroups?.length
                      ? visibleGroups.map((g) => (
                          <Fragment key={`${key}-g-${g.trendyolGroupId}`}>
                            <tr className="cpc-row--groupHead">
                              <td colSpan={8}>
                                <strong>{g.groupName}</strong>
                                {' · Trendyol tür ID '}
                                {g.trendyolGroupId}
                                {g.ccsSubgroupPlu ? ` · CCS subgroup ${g.ccsSubgroupPlu}` : ''}
                                <span className={`cpc-groupTag ${tagToneClass(g.groupStatus === 'MATCHED' ? 'green' : g.groupStatus === 'NOT_IN_CHANNEL' ? 'blue' : 'red')}`}>
                                  {groupStatusLabel(g.groupStatus)}
                                </span>
                              </td>
                            </tr>
                            {(g.options ?? []).map((opt) => (
                              <tr key={`${key}-o-${opt.trendyolOptionId}`} className="cpc-row--option">
                                <td className="cpc-optionIndent">{opt.name}</td>
                                <td className="cpc-mono">{opt.trendyolOptionId || '–'}</td>
                                <td className="cpc-mono">{opt.ccsSubPlu || '–'}</td>
                                <td>—</td>
                                <td>{formatPrice(opt.channelPrice)}</td>
                                <td>{formatPrice(opt.ccsPrice)}</td>
                                <td className={opt.status === 'PRICE_DIFF' ? 'cpc-diffCell' : ''}>
                                  {formatDiff(opt.diff)}
                                </td>
                                <td>
                                  <span className={tagToneClass(
                                    opt.status === 'OK'
                                      ? 'green'
                                      : opt.status === 'PRICE_DIFF'
                                        ? 'orange'
                                        : opt.status === 'NOT_IN_CCS'
                                          ? 'red'
                                          : opt.status === 'CHANNEL_PASSIVE'
                                            ? 'gray'
                                            : 'blue',
                                  )}
                                  >
                                    {statusLabel(opt.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        ))
                      : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {prepared.length > 0 ? (
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
      ) : null}
    </section>
  )
}

export default function StoreDetailPanel({
  priceGroupName,
  storeSummary,
  detail,
  loading,
  error,
  onBack,
}) {
  const [filterId, setFilterId] = useState('all')
  const [search, setSearch] = useState('')

  const counters = detail?.counters ?? {}

  return (
    <div className="cpc-detail">
      <nav className="cpc-breadcrumb" aria-label="Konum">
        <button type="button" className="cpc-breadcrumb__link" onClick={onBack}>
          {priceGroupName}
        </button>
        <span className="cpc-breadcrumb__sep">›</span>
        <span className="cpc-breadcrumb__current">
          {storeSummary?.storeName} · {storeSummary?.trendyolStoreId}
        </span>
      </nav>

      {loading ? <p className="cpc-hint">Mağaza detayı yükleniyor…</p> : null}
      {error ? <p className="cpc-alert cpc-alert--err">{error}</p> : null}

      {detail ? (
        <>
          <div className="cpc-kpiRow">
            <div className="cpc-kpi">
              <span className="cpc-kpi__label">Fiyat farkı</span>
              <strong className="cpc-kpi__val">{counters.priceDiff ?? 0}</strong>
            </div>
            <div className="cpc-kpi">
              <span className="cpc-kpi__label">Eksik kayıt</span>
              <strong className="cpc-kpi__val">{counters.missing ?? 0}</strong>
            </div>
            <div className="cpc-kpi">
              <span className="cpc-kpi__label">Kanalda pasif</span>
              <strong className="cpc-kpi__val">{counters.channelPassive ?? 0}</strong>
            </div>
            <div className="cpc-kpi">
              <span className="cpc-kpi__label">Karşılaştırılamayan opsiyon</span>
              <strong className="cpc-kpi__val">{counters.groupNotMatched ?? 0}</strong>
            </div>
          </div>

          <div className="cpc-chips" role="group" aria-label="Durum filtresi">
            {DETAIL_FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cpc-chip ${filterId === c.id ? 'cpc-chip--active' : ''}`}
                onClick={() => setFilterId(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <label className="cpc-search cpc-search--detail">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder="Ürün adı ile ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <ProductTable
            title="Menüler"
            rows={detail.menus ?? []}
            filterId={filterId}
            search={search}
            emptyHint="Bu filtrede menü yok."
          />
          <ProductTable
            title="Tekli ürünler"
            rows={detail.singles ?? []}
            filterId={filterId}
            search={search}
            emptyHint="Bu filtrede tekli ürün yok."
          />

          <p className="cpc-footnote">
            &apos;İstemiyorum&apos; içeren kayıtlar listelenmez. Fark = kanal − CCS, tutar olarak; tolerans yok.
          </p>
        </>
      ) : null}
    </div>
  )
}
