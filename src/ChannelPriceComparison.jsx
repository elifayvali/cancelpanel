import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  BANDS,
  BRANDS,
  CHANNELS,
  FILTERS,
  GROUPS,
  STATUS_LABEL,
  STORE_STATUS_LABEL,
  bandSummaries,
  channelLabel,
  channelTypeLabel,
  compareStores,
  countItems,
  expandable,
  filterScope,
  formatChannelItemId,
  formatDelta,
  formatMoney,
  itemStatus,
  localizeWhy,
  optionCanOpen,
  optionStatus,
  optionTags,
  optionWhyText,
  productKey,
  productMatches,
  productOwnsFilter,
  productRank,
  resolveBandName,
  resolveGroupName,
  rowTags,
  storeStatus,
  visibleGroups,
  visibleModifiers,
} from './channelPriceComparison/catalog'
import { exportChannelPriceComparisonExcel } from './channelPriceComparison/channelPriceExport'
import {
  hasPriceComparisonQuery,
  loadSavedRun,
  parseLinkSearch,
  replaceUrl,
  sameFilters,
  saveSavedRun,
} from './channelPriceComparison/urlSync'
import './ChannelPriceComparison.css'

const PAGE_SIZES = [50, 75, 100]

function brandName(ccsId) {
  return BRANDS.find((brand) => String(brand.ccsId) === String(ccsId))?.name ?? ''
}

function Pill({ status }) {
  const [label, tone] = STATUS_LABEL[status]
  return <span className={`fk-pill fk-${tone}`}>{label}</span>
}

function StorePill({ status }) {
  const [label, tone] = STORE_STATUS_LABEL[status]
  return <span className={`fk-pill fk-${tone}`}>{label}</span>
}

function TagList({ tags }) {
  return tags.map((tag, index) =>
    tag.status ? (
      <Pill key={`${tag.status}-${index}`} status={tag.status} />
    ) : (
      <span key={`${tag.text}-${index}`} className={`fk-pill fk-${tag.tone}`}>
        {tag.text}
      </span>
    ),
  )
}

function Pager({ total, page, pageKey, size, onPage, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size))
  const safePage = Math.min(page, pages)
  const from = total ? (safePage - 1) * size + 1 : 0
  const to = Math.min(total, safePage * size)
  const buttons = []
  for (let index = 1; index <= pages; index += 1) buttons.push(index)

  return (
    <div className="fk-pager">
      <span>
        {from}–{to} / {total}
      </span>
      <div className="fk-pg">
        <button type="button" disabled={safePage <= 1} onClick={() => onPage(pageKey, safePage - 1)}>
          ‹
        </button>
        {buttons.map((index) => (
          <button
            key={index}
            type="button"
            className={index === safePage ? 'on' : ''}
            onClick={() => onPage(pageKey, index)}
          >
            {index}
          </button>
        ))}
        <button type="button" disabled={safePage >= pages} onClick={() => onPage(pageKey, safePage + 1)}>
          ›
        </button>
      </div>
      <label>
        Sayfa başına{' '}
        <select value={size} onChange={(event) => onSize(Number(event.target.value))}>
          {PAGE_SIZES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function GroupRows({ productKeyValue, groups, filter, open, onToggle, channelId }) {
  return groups.map((group) => {
    const groupPill = group.chMissing ? (
      <span className="fk-pill fk-info">Kanalda yok · opsiyon türü</span>
    ) : group.noMongo ? (
      <span className="fk-pill fk-bad">Grup Mongo&apos;da tanımlı değil</span>
    ) : group.sub ? (
      <span className="fk-pill fk-ok">Tür eşleşti</span>
    ) : (
      <Pill status="nogroup" />
    )
    const showPrices = group.sub && !group.chMissing && !group.noMongo

    return (
      <Fragment key={`${productKeyValue}-${group.ty}-${group.name}`}>
        <tr className="fk-grp">
          <td colSpan={8}>
            <b>{group.name}</b>
            {` · ${channelTypeLabel(channelId)} tür ID `}
            {group.chMissing ? '–' : formatChannelItemId(channelId, group.ty)}
            {' · CCS subgroup '}
            {group.sub || '–'} {groupPill}
          </td>
        </tr>
        {group.opts.map((option) => {
          const status = optionStatus(group, option)
          const canOpen = optionCanOpen(group, option)
          const optionKey = `${productKeyValue}|${option.ty}`
          const isOpen = canOpen && (filter !== 'all' ? !open.has(optionKey) : open.has(optionKey))
          const context = filter !== 'all' && optionTags(group, option).every((tag) => tag.cat !== filter)
          const mods = isOpen ? (filter !== 'all' ? visibleModifiers(filter, group, option) : option.mods) : []
          const why = optionWhyText(status, channelId)

          return (
            <Fragment key={optionKey}>
              <tr
                className={`fk-opt${status === 'diff' ? ' fk-diff' : ''}${canOpen ? ' fk-click' : ''}${isOpen ? ' fk-open' : ''}${context ? ' fk-ctx' : ''}`}
                tabIndex={canOpen ? 0 : undefined}
                onClick={(event) => {
                  if (!canOpen) return
                  event.stopPropagation()
                  onToggle(optionKey)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canOpen) {
                    event.stopPropagation()
                    onToggle(optionKey)
                  }
                }}
              >
                <td>
                  {canOpen ? <span className="fk-caret">▸</span> : null}
                  {option.name}
                  {context ? <span className="fk-ctxnote">filtreye uyan değiştiricileri var</span> : null}
                </td>
                <td className="fk-mono">{group.chMissing ? '–' : formatChannelItemId(channelId, option.ty)}</td>
                <td className="fk-mono">{option.plu || '–'}</td>
                <td />
                <td className="fk-num">{group.chMissing ? '–' : formatMoney(option.k)}</td>
                <td className="fk-num">{showPrices || group.chMissing || group.noMongo ? formatMoney(option.c) : '–'}</td>
                <td className="fk-num fk-delta">{showPrices ? formatDelta(option) : '–'}</td>
                <td>
                  <TagList tags={optionTags(group, option)} />
                  {why ? <div className="fk-ctxnote fk-why">{why}</div> : null}
                </td>
              </tr>
              {mods.map((modGroup) => (
                <Fragment key={`${optionKey}-${modGroup.ty}`}>
                  <tr className="fk-grp fk-grp2">
                    <td colSpan={8}>
                      <b>{modGroup.name}</b>
                      {` · ${channelTypeLabel(channelId)} tür ID `}
                      {formatChannelItemId(channelId, modGroup.ty)}
                      {' · CCS subgroup '}
                      {modGroup.sub || '–'}{' '}
                      {modGroup.sub ? <span className="fk-pill fk-ok">Tür eşleşti</span> : <Pill status="nogroup" />}
                    </td>
                  </tr>
                  {modGroup.opts.map((mod) => {
                    const modStatus = optionStatus(modGroup, mod)
                    return (
                      <tr key={`${optionKey}-${modGroup.ty}-${mod.ty}`} className={`fk-opt fk-opt2${modStatus === 'diff' ? ' fk-diff' : ''}`}>
                        <td>{mod.name}</td>
                        <td className="fk-mono">{formatChannelItemId(channelId, mod.ty)}</td>
                        <td className="fk-mono">{mod.plu || '–'}</td>
                        <td />
                        <td className="fk-num">{formatMoney(mod.k)}</td>
                        <td className="fk-num">{formatMoney(mod.c)}</td>
                        <td className="fk-num fk-delta">{formatDelta(mod)}</td>
                        <td>
                          <Pill status={modStatus} />
                          {optionWhyText(modStatus, channelId) ? (
                            <div className="fk-ctxnote fk-why">{optionWhyText(modStatus, channelId)}</div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </Fragment>
          )
        })}
      </Fragment>
    )
  })
}

function ProductBlock({ product, filter, open, onToggle, channelId }) {
  const canExpand = expandable(product)
  const key = productKey(product)
  const filtered = filter !== 'all'
  const isOpen = canExpand && (filtered ? !open.has(key) : open.has(key))
  const owns = productOwnsFilter(filter, product)
  const context = filtered && !owns
  const status = itemStatus(product)
  const groups = isOpen ? (filtered ? visibleGroups(filter, product) : product.groups) : []

  return (
    <Fragment>
      <tr
        className={`${canExpand ? 'fk-click' : ''}${status === 'diff' ? ' fk-diff' : ''}${isOpen ? ' fk-open' : ''}${context ? ' fk-ctx' : ''}`}
        tabIndex={canExpand ? 0 : undefined}
        onClick={(event) => {
          if (!canExpand) return
          event.stopPropagation()
          onToggle(key)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && canExpand) {
            event.stopPropagation()
            onToggle(key)
          }
        }}
      >
        <td>
          <span className="fk-caret">{canExpand ? '▸' : ''}</span>
          {product.name ? product.name : <span className="fk-muted">{product.ccsName}</span>}
          {context ? <span className="fk-ctxnote">filtreye uyan opsiyonları var</span> : null}
        </td>
        <td className="fk-mono">{formatChannelItemId(channelId, product.ty)}</td>
        <td className="fk-mono">{product.plu || '–'}</td>
        <td>{product.ccsName || '–'}</td>
        <td className="fk-num">{formatMoney(product.k)}</td>
        <td className="fk-num">{formatMoney(product.c)}</td>
        <td className="fk-num fk-delta">{formatDelta(product)}</td>
        <td>
          <TagList tags={rowTags(product)} />
          {product.why ? <div className="fk-ctxnote fk-why">{localizeWhy(product.why, channelId)}</div> : null}
        </td>
      </tr>
      {isOpen ? (
        <GroupRows
          productKeyValue={key}
          groups={groups}
          filter={filter}
          open={open}
          onToggle={onToggle}
          channelId={channelId}
        />
      ) : null}
    </Fragment>
  )
}

function ProductTable({
  title,
  hint,
  rows,
  pageKey,
  page,
  size,
  filter,
  open,
  onToggle,
  onPage,
  onSize,
  emptyText,
  channelId,
}) {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const safePage = Math.min(page, pages)
  const slice = rows.slice((safePage - 1) * size, safePage * size)

  return (
    <>
      <div className="fk-sect">
        {title} <span>{hint}</span>
      </div>
      <div className="fk-tablewrap">
        <table>
          <thead>
            <tr>
              <th>Ürün / opsiyon</th>
              <th>Trendyol ID</th>
              <th>CCS PLU</th>
              <th>CCS ürün adı</th>
              <th className="fk-num">Kanal fiyatı</th>
              <th className="fk-num">CCS fiyatı</th>
              <th className="fk-num">Fark</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {slice.length ? (
              slice.map((product) => (
                <ProductBlock
                  key={productKey(product) || product.ccsName}
                  product={product}
                  filter={filter}
                  open={open}
                  onToggle={onToggle}
                  channelId={channelId}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="fk-empty">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pager total={rows.length} page={safePage} pageKey={pageKey} size={size} onPage={onPage} onSize={onSize} />
    </>
  )
}

const DEFAULT_FILTERS = { brand: '4', groupId: '', bandId: '', channel: 'TY' }
const initialScope = filterScope('', '', 'TY')

export default function ChannelPriceComparison() {
  const [ccsId, setCcsId] = useState('4')
  const [channelId, setChannelId] = useState('TY')
  const [groupId, setGroupId] = useState('')
  const [priceGroupId, setPriceGroupId] = useState('')
  const [selGroup, setSelGroup] = useState('')
  const [selBand, setSelBand] = useState('')
  const [selChannel, setSelChannel] = useState('TY')
  const [linkOpened, setLinkOpened] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [activeStores, setActiveStores] = useState(initialScope.stores)
  const [activeFailed, setActiveFailed] = useState(initialScope.failed)
  const [view, setView] = useState('band')
  const [restId, setRestId] = useState(null)
  const [bandFilter, setBandFilter] = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 1 })
  const [page, setPage] = useState(1)
  const [detailPage, setDetailPage] = useState({ menu: 1, single: 1 })
  const [pageSize, setPageSize] = useState(50)
  const [comparedAt, setComparedAt] = useState(() => {
    const now = new Date()
    return `${now.toLocaleDateString('tr-TR')} 09:42`
  })
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [notice, setNotice] = useState('')
  const [exportMsg, setExportMsg] = useState('')
  const timerRef = useRef(null)
  const toastTimerRef = useRef(null)
  const bootedRef = useRef(false)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    if (!toastMsg) return undefined
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 4500)
    return () => clearTimeout(toastTimerRef.current)
  }, [toastMsg])

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    if (hasPriceComparisonQuery()) {
      const { filters, fromLink, linkInvalid } = parseLinkSearch(window.location.search)
      if (fromLink && filters) {
        setCcsId(filters.brand)
        setGroupId(filters.groupId)
        setPriceGroupId(filters.bandId)
        setChannelId(filters.channel)

        const saved = loadSavedRun()
        if (saved && sameFilters(saved.filters, filters) && saved.comparedAt) {
          const scope = filterScope(filters.groupId, filters.bandId, filters.channel)
          setActiveStores(scope.stores)
          setActiveFailed(scope.failed)
          setSelGroup(filters.groupId)
          setSelBand(filters.bandId)
          setSelChannel(filters.channel)
          setComparedAt(saved.comparedAt)
          setView('band')
          setLinkOpened(false)
        } else {
          setView('none')
          setLinkOpened(true)
          if (linkInvalid) {
            setToastMsg('Linkteki seçimlerin bir kısmı bulunamadı. Eksik seçimleri tamamlayın.')
          }
        }
      }
      return
    }

    replaceUrl(DEFAULT_FILTERS)
    const saved = loadSavedRun()
    if (saved?.comparedAt && sameFilters(saved.filters, DEFAULT_FILTERS)) {
      setComparedAt(saved.comparedAt)
    }
  }, [])

  const rest = activeStores.find((store) => store.id === restId) ?? null

  const currentFilters = () => ({
    brand: ccsId,
    groupId,
    bandId: priceGroupId,
    channel: channelId,
  })

  const syncFiltersToUrl = (overrides = {}) => {
    setLinkOpened(false)
    replaceUrl({ ...currentFilters(), ...overrides })
  }

  const bandsForSelect = groupId
    ? (BANDS[groupId] ?? []).map((band) => ({
        value: band.id,
        label: `${band.name} (${band.id})`,
      }))
    : GROUPS.flatMap((group) =>
        (BANDS[group.id] ?? []).map((band) => ({
          value: band.id,
          label: `${group.name} · ${band.name} (${band.id})`,
        })),
      )

  const canCompare = Boolean(ccsId && channelId && !running)

  const resetRunView = (message = '') => {
    setView('none')
    setRestId(null)
    setBandFilter(null)
    setComparedAt('')
    setNotice(message)
    setExportMsg('')
  }

  const openRestaurant = (storeId) => {
    setRestId(storeId)
    setView('rest')
    setFilter('all')
    setOpen(new Set())
    setProductSearch('')
    setDetailPage({ menu: 1, single: 1 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const backToBand = () => {
    setView('band')
    setRestId(null)
    setFilter('all')
    setOpen(new Set())
    setProductSearch('')
  }

  const toggleOpen = (key) => {
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const changePageSize = (size) => {
    setPageSize(size)
    setPage(1)
    setDetailPage({ menu: 1, single: 1 })
  }

  const changePage = (key, nextPage) => {
    if (key === 'band') setPage(nextPage)
    else setDetailPage((current) => ({ ...current, [key]: nextPage }))
  }

  const startCompare = () => {
    clearTimeout(timerRef.current)
    setNotice('')
    setExportMsg('')
    setBandFilter(null)
    setRestId(null)
    setLinkOpened(false)
    setSelGroup(groupId)
    setSelBand(priceGroupId)
    setSelChannel(channelId)
    const runFilters = { brand: ccsId, groupId, bandId: priceGroupId, channel: channelId }

    const scope = filterScope(groupId, priceGroupId, channelId)
    const total = scope.stores.length + scope.failed.length
    if (!total) {
      resetRunView(
        priceGroupId ? 'Bu fiyat bandına bağlı restoran bulunamadı.' : 'Seçime bağlı restoran bulunamadı.',
      )
      return
    }

    setActiveStores(scope.stores)
    setActiveFailed(scope.failed)
    setView('none')
    setRunning(true)
    setProgress(0)
    setProgressTotal(total)

    let step = 0
    const tick = () => {
      setProgress(step)
      if (step < total) {
        step += 1
        timerRef.current = setTimeout(tick, 450)
        return
      }
      const now = new Date()
      setRunning(false)
      const at = `${now.toLocaleDateString('tr-TR')} ${now.toTimeString().slice(0, 5)}`
      setComparedAt(at)
      saveSavedRun(runFilters, at)
      replaceUrl(runFilters)
      setView('band')
      setPage(1)
      setSearch('')
      setProductSearch('')
      setSort({ key: null, dir: 1 })
    }
    tick()
  }

  const stopCompare = () => {
    clearTimeout(timerRef.current)
    setRunning(false)
    resetRunView('Karşılaştırma durduruldu. Sonuç tutulmadı; filtreleri seçip yeniden karşılaştırabilirsiniz.')
  }

  const storeRows = useMemo(() => {
    let list = activeStores.map((store) => ({
      store,
      status: storeStatus(store),
      counts: countItems(store.items),
    }))
    if (bandFilter) {
      list = list.filter((row) => `${row.store.pg}|${row.store.pb}` === bandFilter)
    }
    const query = search.trim().toLocaleLowerCase('tr')
    if (query) {
      list = list.filter(
        (row) =>
          row.store.name.toLocaleLowerCase('tr').includes(query) ||
          row.store.store.includes(query) ||
          String(row.store.g || '').includes(query),
      )
    }
    return compareStores(list, sort)
  }, [activeStores, bandFilter, search, sort])

  const detailRows = useMemo(() => {
    if (!rest) return { menus: [], singles: [], counts: null }
    const query = productSearch.trim().toLocaleLowerCase('tr')
    const pick = (type) =>
      rest.items
        .filter((product) => product.type === type && productMatches(filter, product))
        .filter((product) => {
          if (!query) return true
          return `${product.name || ''} ${product.ccsName || ''}`.toLocaleLowerCase('tr').includes(query)
        })
        .sort((a, b) => productRank(a) - productRank(b))
    return {
      menus: pick('menu'),
      singles: pick('single'),
      counts: countItems(rest.items),
    }
  }, [rest, filter, productSearch])

  const summaries = useMemo(() => bandSummaries(activeStores, activeFailed), [activeStores, activeFailed])
  const multiBand = summaries.length > 1
  const diffStores = activeStores.filter((store) => storeStatus(store) === 'diff').length
  const missStores = activeStores.filter((store) => storeStatus(store) === 'missing').length
  const okStores = activeStores.filter((store) => storeStatus(store) === 'ok').length
  const hasDiff = diffStores > 0
  const partialFailed = activeFailed.length > 0

  const bandPages = Math.max(1, Math.ceil(storeRows.length / pageSize))
  const bandPage = Math.min(page, bandPages)
  const bandSlice = storeRows.slice((bandPage - 1) * pageSize, bandPage * pageSize)

  const sortArrow = (key) => (sort.key === key ? <span className="fk-arr">{sort.dir > 0 ? '▲' : '▼'}</span> : null)

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key ? { key, dir: -current.dir } : { key, dir: ['name', 'pg', 'pb'].includes(key) ? 1 : -1 },
    )
  }

  const lastRunText =
    linkOpened && view === 'none'
      ? "Linkteki seçimler dolduruldu. Karşılaştır'a basın."
      : comparedAt && view !== 'none'
        ? `Karşılaştırma zamanı: ${comparedAt} · ${brandName(ccsId)} · ${resolveGroupName(selGroup)} · ${resolveBandName(selGroup, selBand)} · ${channelLabel(selChannel)}`
        : "Filtreleri seçip Karşılaştır'a basın. Hesaplama canlı yapılır."

  const verdictTitle = partialFailed
    ? `Karşılaştırılan mağazalarda fiyat farkı ${hasDiff ? 'var' : 'yok'}`
    : multiBand
      ? `Seçimde fiyat farkı ${hasDiff ? 'var' : 'yok'}`
      : `Bu fiyat bandında fiyat farkı ${hasDiff ? 'var' : 'yok'}`

  const crumbBandLabel = selBand
    ? resolveBandName(selGroup, selBand)
    : `${resolveGroupName(selGroup)} · ${resolveBandName(selGroup, selBand)}`

  const progressLabel = selBand ? 'Bu bantta' : 'Seçimde'

  return (
    <div className="fk">
      {toastMsg ? (
        <div className="fk-toast" role="status">
          {toastMsg}
        </div>
      ) : null}
      <div className="fk-title">
        <h1>Kanal–CCS fiyat karşılaştırma</h1>
        <p>Kanaldaki ürün ve opsiyon fiyatları ile CCS delivery fiyatları · ₺ TL</p>
      </div>

      <section className="fk-card fk-filters" aria-label="Filtreler">
        <div className="fk-field">
          <label htmlFor="fk-brand">Marka *</label>
          <select
            id="fk-brand"
            value={ccsId}
            disabled={running}
            onChange={(event) => {
              const nextBrand = event.target.value
              setCcsId(nextBrand)
              setGroupId('')
              setPriceGroupId('')
              resetRunView()
              syncFiltersToUrl({ brand: nextBrand, groupId: '', bandId: '' })
            }}
          >
            {BRANDS.map((brand) => (
              <option key={brand.ccsId} value={brand.ccsId}>
                {brand.name}
              </option>
            ))}
          </select>
          <small>brand/getAllWithCcsId · ccsId 1–7, 10</small>
        </div>
        <div className="fk-field">
          <label htmlFor="fk-channel">Kanal *</label>
          <select
            id="fk-channel"
            value={channelId}
            disabled={running}
            onChange={(event) => {
              const nextChannel = event.target.value
              setChannelId(nextChannel)
              resetRunView()
              syncFiltersToUrl({ channel: nextChannel })
            }}
          >
            {CHANNELS.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.label}
              </option>
            ))}
          </select>
          <small>Trendyol Go (Faz 1) · Migros (Faz 2)</small>
        </div>
        <div className="fk-field">
          <label htmlFor="fk-group">Ürün grubu</label>
          <select
            id="fk-group"
            value={groupId}
            disabled={running || !ccsId}
            onChange={(event) => {
              const next = event.target.value
              const nextBand = next && (BANDS[next] ?? []).some((band) => band.id === priceGroupId) ? priceGroupId : ''
              setGroupId(next)
              setPriceGroupId(nextBand)
              resetRunView()
              syncFiltersToUrl({ groupId: next, bandId: nextBand })
            }}
          >
            <option value="">Tümü</option>
            {GROUPS.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.id})
              </option>
            ))}
          </select>
          <small>İsteğe bağlı · Tümü bütün grupları kapsar</small>
        </div>
        <div className="fk-field">
          <label htmlFor="fk-band">Fiyat bandı</label>
          <select
            id="fk-band"
            value={priceGroupId}
            disabled={running}
            onChange={(event) => {
              const nextBand = event.target.value
              setPriceGroupId(nextBand)
              resetRunView()
              syncFiltersToUrl({ bandId: nextBand })
            }}
          >
            <option value="">Tümü</option>
            {bandsForSelect.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
          <small>İsteğe bağlı · Tümü bütün bantları kapsar</small>
        </div>
        <button type="button" className="fk-btn" disabled={!canCompare} onClick={startCompare}>
          Karşılaştır
        </button>
        <div className={`fk-lastrun${linkOpened && view === 'none' ? ' fk-lastrun--link' : ''}`}>{lastRunText}</div>
      </section>

      {running ? (
        <section className="fk-card fk-progress" aria-live="polite">
          <div className="fk-prow">
            <span>
              {progressLabel} <b>{progressTotal} mağaza</b> karşılaştırılacak.
            </span>
            <button type="button" className="fk-btn fk-danger" onClick={stopCompare}>
              Karşılaştırmayı durdur
            </button>
          </div>
          <div className="fk-bar">
            <i style={{ width: `${progressTotal ? (progress / progressTotal) * 100 : 0}%` }} />
          </div>
          <div className="fk-prow">
            <span>{progress < progressTotal ? 'Kanal ve CCS fiyatları alınıyor…' : 'Karşılaştırma tamamlandı.'}</span>
            <b>
              {progress} / {progressTotal} mağaza tamamlandı
            </b>
          </div>
        </section>
      ) : null}

      {notice ? <section className="fk-card fk-notice">{notice}</section> : null}

      {view !== 'none' ? (
        <nav className="fk-crumbs" aria-label="Konum">
          <button type="button" onClick={backToBand}>
            {crumbBandLabel}
          </button>
          {view === 'rest' && rest ? (
            <>
              {' '}
              › <b>{rest.name} · {rest.store}</b>
            </>
          ) : null}
        </nav>
      ) : null}

      {view === 'band' ? (
        <div className="fk-stack">
          <section className={`fk-card fk-verdict ${hasDiff ? 'bad' : 'ok'}`}>
            <div>
              <div className="fk-big">{verdictTitle}</div>
              <div className="fk-meta">
                {brandName(ccsId)} · {resolveGroupName(selGroup)} · {resolveBandName(selGroup, selBand)} ·{' '}
                {channelLabel(selChannel)} ·{' '}
                {activeStores.length} mağaza karşılaştırıldı
                {multiBand ? ` · ${summaries.length} fiyat bandı` : ''}
              </div>
            </div>
            <div className="fk-export">
              <button
                type="button"
                className="fk-btn fk-ghost"
                onClick={() => {
                  try {
                    exportChannelPriceComparisonExcel({
                      stores: activeStores,
                      ccsId: Number(ccsId),
                      groupId: selGroup,
                      bandId: selBand,
                      channelId: selChannel,
                      comparedAt,
                    })
                    setExportMsg('Excel dosyası indirildi (Ürünler · Opsiyonlar).')
                  } catch (e) {
                    setExportMsg(e?.message || 'Excel oluşturulamadı.')
                  }
                }}
              >
                Excel&apos;e aktar
              </button>
              {exportMsg ? <span className="fk-exportmsg">{exportMsg}</span> : null}
            </div>
          </section>

          {partialFailed ? (
            <section className="fk-failwarn">
              ⚠ {activeFailed.length} mağaza karşılaştırılamadı:{' '}
              {activeFailed.map((store) => `${store.name} (${store.store}) – ${store.reason}`).join(', ')}. Yeniden
              karşılaştırabilirsiniz.
            </section>
          ) : null}

          {multiBand ? (
            <section className="fk-card">
              <div className="fk-panelhead">
                <h2>Bant kararları ({summaries.length})</h2>
                <span>Bir banda tıklayın; restoran listesi o banda süzülür, tekrar tıklayınca süzme kalkar</span>
              </div>
              <div className="fk-tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ürün grubu</th>
                      <th>Fiyat bandı</th>
                      <th className="fk-num">Mağaza</th>
                      <th className="fk-num">Fiyat farkı olan</th>
                      <th className="fk-num">Eksik kayıtlı</th>
                      <th>Karar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((band) => (
                      <tr
                        key={band.key}
                        className={`fk-click${bandFilter === band.key ? ' fk-open' : ''}`}
                        tabIndex={0}
                        onClick={() => {
                          setBandFilter((current) => (current === band.key ? null : band.key))
                          setPage(1)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            setBandFilter((current) => (current === band.key ? null : band.key))
                            setPage(1)
                          }
                        }}
                      >
                        <td>{resolveGroupName(band.pg)}</td>
                        <td>
                          {resolveBandName(band.pg, band.pb)}{' '}
                          <span className="fk-mono">({band.pb})</span>
                        </td>
                        <td className="fk-num">{band.n}</td>
                        <td className="fk-num">{band.diffCount}</td>
                        <td className="fk-num">{band.missingCount}</td>
                        <td>
                          <span className={`fk-pill fk-${band.diffCount ? 'warn' : 'ok'}`}>
                            {band.failed ? 'Karşılaştırılan mağazalarda ' : ''}Fiyat farkı {band.diffCount ? 'var' : 'yok'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="fk-stats" aria-label="Özet göstergeler">
            <div className="fk-card fk-stat">
              <div className="fk-k">Restoran (mağaza satırı)</div>
              <div className="fk-v">{activeStores.length}</div>
            </div>
            <div className="fk-card fk-stat warn">
              <div className="fk-k">Fiyat farkı olan</div>
              <div className="fk-v">{diffStores}</div>
            </div>
            <div className="fk-card fk-stat info">
              <div className="fk-k">Eksik kayıtlı</div>
              <div className="fk-v">{missStores}</div>
            </div>
            <div className="fk-card fk-stat ok">
              <div className="fk-k">Farksız</div>
              <div className="fk-v">{okStores}</div>
            </div>
          </section>

          <section className="fk-card">
            <div className="fk-panelhead">
              <h2>
                Restoranlar
                {bandFilter
                  ? ` · ${resolveBandName(bandFilter.split('|')[0], bandFilter.split('|')[1])}`
                  : ''}
              </h2>
              <span>Bir restorana tıklayın, ürünleri açılır</span>
            </div>
            <div className="fk-tools">
              <input
                type="search"
                value={search}
                placeholder="Restoran adı, Global ID veya Kanal ID ara"
                aria-label="Restoran ara"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="fk-tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Marka</th>
                    <th>
                      <button type="button" className="fk-sort" onClick={() => toggleSort('name')}>
                        Restoran {sortArrow('name')}
                      </button>
                    </th>
                    <th>Global ID</th>
                    <th>Kanal ID</th>
                    <th>
                      <button type="button" className="fk-sort" onClick={() => toggleSort('pg')}>
                        Ürün grubu {sortArrow('pg')}
                      </button>
                    </th>
                    <th>
                      <button type="button" className="fk-sort" onClick={() => toggleSort('pb')}>
                        Fiyat bandı {sortArrow('pb')}
                      </button>
                    </th>
                    <th className="fk-num">
                      <button type="button" className="fk-sort" onClick={() => toggleSort('diff')}>
                        Farklı kalem {sortArrow('diff')}
                      </button>
                    </th>
                    <th className="fk-num">
                      <button type="button" className="fk-sort" onClick={() => toggleSort('missing')}>
                        Eksik kayıt {sortArrow('missing')}
                      </button>
                    </th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {bandSlice.length ? (
                    bandSlice.map(({ store, status, counts }) => (
                      <tr
                        key={store.id}
                        className="fk-click"
                        tabIndex={0}
                        onClick={() => openRestaurant(store.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') openRestaurant(store.id)
                        }}
                      >
                        <td>{brandName(ccsId)}</td>
                        <td>{store.name}</td>
                        <td className="fk-mono">{store.g}</td>
                        <td className="fk-mono">{store.store}</td>
                        <td>{resolveGroupName(store.pg)}</td>
                        <td>{resolveBandName(store.pg, store.pb)}</td>
                        <td className="fk-num">{counts.diff}</td>
                        <td className="fk-num">{counts.missing}</td>
                        <td>
                          <StorePill status={status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="fk-empty">
                        Aramaya uyan restoran yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager total={storeRows.length} page={bandPage} pageKey="band" size={pageSize} onPage={changePage} onSize={changePageSize} />
          </section>
        </div>
      ) : null}

      {view === 'rest' && rest && detailRows.counts ? (
        <div className="fk-stack">
          <section className="fk-stats fk-stats--kpi" aria-label="Mağaza göstergeleri">
            <div className="fk-card fk-stat warn">
              <div className="fk-k">Fiyat farkı (ürün + opsiyon)</div>
              <div className="fk-v">{detailRows.counts.diff}</div>
            </div>
            <div className="fk-card fk-stat info">
              <div className="fk-k">Eksik kayıt</div>
              <div className="fk-v">{detailRows.counts.missing}</div>
            </div>
            <div className="fk-card fk-stat off">
              <div className="fk-k">Kanalda pasif</div>
              <div className="fk-v">{detailRows.counts.pasif}</div>
            </div>
            <div className="fk-card fk-stat">
              <div className="fk-k">Karşılaştırılamayan opsiyon</div>
              <div className="fk-v">{detailRows.counts.nogroup}</div>
            </div>
          </section>

          <section className="fk-card">
            <div className="fk-panelhead fk-panelhead--inline">
              <h2>
                {rest.name} · Kanal ID {rest.store} · {resolveGroupName(rest.pg)} / {resolveBandName(rest.pg, rest.pb)}
              </h2>
              <div className="fk-chips" role="group" aria-label="Durum filtresi">
                {FILTERS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`fk-chip${filter === key ? ' on' : ''}`}
                    onClick={() => {
                      setFilter(key)
                      setOpen(new Set())
                      setDetailPage({ menu: 1, single: 1 })
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="fk-tools">
              <input
                type="search"
                value={productSearch}
                placeholder="Ürün adı ara"
                aria-label="Ürün ara"
                onChange={(event) => {
                  setProductSearch(event.target.value)
                  setDetailPage({ menu: 1, single: 1 })
                }}
              />
            </div>
            <ProductTable
              title="Menüler"
              hint="Satıra tıklayın, opsiyon türleri açılır; ▸ olan opsiyonun değiştiricileri de açılır (E10)"
              rows={detailRows.menus}
              pageKey="menu"
              page={detailPage.menu}
              size={pageSize}
              filter={filter}
              open={open}
              onToggle={toggleOpen}
              onPage={changePage}
              onSize={changePageSize}
              emptyText="Bu filtrede menü yok."
              channelId={selChannel}
            />
            <ProductTable
              title="Tekli ürünler"
              hint="Değiştiricileri olan ürünler açılır (C9 servisi gelince) · Mongo eşleşmesi olmayanlar da burada (E5)"
              rows={detailRows.singles}
              pageKey="single"
              page={detailPage.single}
              size={pageSize}
              filter={filter}
              open={open}
              onToggle={toggleOpen}
              onPage={changePage}
              onSize={changePageSize}
              emptyText="Bu filtrede tekli ürün yok."
              channelId={selChannel}
            />
            <div className="fk-note">
              &quot;İstemiyorum&quot; içeren kayıtlar (CCS kodu 20000) listelenmez ve opsiyon türü eşleşmesini bozmaz.
              Fark mutlak değer olarak (işaretsiz) gösterilir; tolerans yok. Kanalda pasif kayıtların fiyatı da
              karşılaştırılır; etiket fiyat sonucunun yanında gösterilir (F-P25). Kanalda yok veya CCS&apos;te yok olan
              ürünlerin opsiyonları karşılaştırılmaz (E6).
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
