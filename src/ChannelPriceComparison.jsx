import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import {
  BANDS,
  BRANDS,
  FAILED,
  FILTERS,
  GROUPS,
  STATUS_LABEL,
  STORE_STATUS_LABEL,
  STORES,
  compareStores,
  countItems,
  expandable,
  formatDelta,
  formatMoney,
  itemStatus,
  optionCanOpen,
  optionStatus,
  optionTags,
  productKey,
  productMatches,
  productOwnsFilter,
  productRank,
  rowTags,
  storeStatus,
  visibleGroups,
  visibleModifiers,
} from './channelPriceComparison/catalog'
import './ChannelPriceComparison.css'

const PAGE_SIZES = [50, 75, 100]
const TOTAL_STORES = STORES.length + FAILED.length

function brandName(ccsId) {
  return BRANDS.find((brand) => String(brand.ccsId) === String(ccsId))?.name ?? ''
}

function groupName(groupId) {
  return GROUPS.find((group) => group.id === groupId)?.name ?? ''
}

function bandName(groupId, priceGroupId) {
  return BANDS[groupId]?.find((band) => band.id === priceGroupId)?.name ?? ''
}

function Pill({ status }) {
  const [label, tone] = STATUS_LABEL[status]
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

function GroupRows({ productKeyValue, groups, filter, open, onToggle }) {
  return groups.map((group) => {
    const groupPill = group.chMissing ? (
      <span className="fk-pill fk-info">Kanalda yok · opsiyon türü</span>
    ) : group.sub ? (
      <span className="fk-pill fk-ok">Tür eşleşti</span>
    ) : (
      <Pill status="nogroup" />
    )
    const showPrices = group.sub && !group.chMissing

    return (
      <Fragment key={`${productKeyValue}-${group.ty}-${group.name}`}>
        <tr className="fk-grp">
          <td colSpan={8}>
            <b>{group.name}</b>
            {' · Trendyol tür ID '}
            {group.chMissing ? '–' : group.ty}
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

          return (
            <Fragment key={optionKey}>
              <tr
                className={`fk-opt${status === 'diff' ? ' fk-diff' : ''}${canOpen ? ' fk-click' : ''}${isOpen ? ' fk-open' : ''}${context ? ' fk-ctx' : ''}`}
                tabIndex={canOpen ? 0 : undefined}
                onClick={() => canOpen && onToggle(optionKey)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canOpen) onToggle(optionKey)
                }}
              >
                <td>
                  {canOpen ? <span className="fk-caret">▸</span> : null}
                  {option.name}
                  {context ? <span className="fk-ctxnote">filtreye uyan değiştiricileri var</span> : null}
                </td>
                <td className="fk-mono">{group.chMissing ? '–' : option.ty || '–'}</td>
                <td className="fk-mono">{option.plu || '–'}</td>
                <td />
                <td className="fk-num">{group.chMissing ? '–' : formatMoney(option.k)}</td>
                <td className="fk-num">{showPrices || group.chMissing ? formatMoney(option.c) : '–'}</td>
                <td className="fk-num fk-delta">{showPrices ? formatDelta(option) : '–'}</td>
                <td>
                  <TagList tags={optionTags(group, option)} />
                </td>
              </tr>
              {mods.map((modGroup) => (
                <Fragment key={`${optionKey}-${modGroup.ty}`}>
                  <tr className="fk-grp fk-grp2">
                    <td colSpan={8}>
                      <b>{modGroup.name}</b>
                      {' · Trendyol tür ID '}
                      {modGroup.ty}
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
                        <td className="fk-mono">{mod.ty || '–'}</td>
                        <td className="fk-mono">{mod.plu || '–'}</td>
                        <td />
                        <td className="fk-num">{formatMoney(mod.k)}</td>
                        <td className="fk-num">{formatMoney(mod.c)}</td>
                        <td className="fk-num fk-delta">{formatDelta(mod)}</td>
                        <td>
                          <Pill status={modStatus} />
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

function ProductBlock({ product, filter, open, onToggle }) {
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
        onClick={() => canExpand && onToggle(key)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && canExpand) onToggle(key)
        }}
      >
        <td>
          <span className="fk-caret">{canExpand ? '▸' : ''}</span>
          {product.name ? product.name : <span className="fk-muted">{product.ccsName}</span>}
          {context ? <span className="fk-ctxnote">filtreye uyan opsiyonları var</span> : null}
        </td>
        <td className="fk-mono">{product.ty || '–'}</td>
        <td className="fk-mono">{product.plu || '–'}</td>
        <td>{product.ccsName || '–'}</td>
        <td className="fk-num">{formatMoney(product.k)}</td>
        <td className="fk-num">{formatMoney(product.c)}</td>
        <td className="fk-num fk-delta">{formatDelta(product)}</td>
        <td>
          <TagList tags={rowTags(product)} />
          {product.why ? <div className="fk-ctxnote fk-why">{product.why}</div> : null}
        </td>
      </tr>
      {isOpen ? (
        <GroupRows productKeyValue={key} groups={groups} filter={filter} open={open} onToggle={onToggle} />
      ) : null}
    </Fragment>
  )
}

function ProductTable({ title, hint, rows, pageKey, page, size, filter, open, onToggle, onPage, onSize, emptyText }) {
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

export default function ChannelPriceComparison() {
  const [ccsId, setCcsId] = useState('4')
  const [groupId, setGroupId] = useState('1001')
  const [priceGroupId, setPriceGroupId] = useState('1004')
  const [view, setView] = useState('band')
  const [restId, setRestId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(() => new Set())
  const [search, setSearch] = useState('')
  const [detailSearch, setDetailSearch] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 1 })
  const [page, setPage] = useState(1)
  const [detailPage, setDetailPage] = useState({ menu: 1, single: 1 })
  const [pageSize, setPageSize] = useState(50)
  const [comparedAt, setComparedAt] = useState('22.10.2026 09:42')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const [exportMsg, setExportMsg] = useState('')
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const rest = STORES.find((store) => store.id === restId) ?? null
  const bands = BANDS[groupId] ?? []

  const clearRunView = (message = '') => {
    setView('none')
    setRestId(null)
    setComparedAt('')
    setNotice(message)
    setExportMsg('')
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
    setView('none')
    setRestId(null)
    setExportMsg('')
    setRunning(true)
    setProgress(0)

    let step = 0
    const tick = () => {
      setProgress(step)
      if (step < TOTAL_STORES) {
        step += 1
        timerRef.current = setTimeout(tick, 450)
        return
      }
      const now = new Date()
      const date = now.toLocaleDateString('tr-TR')
      const time = now.toTimeString().slice(0, 5)
      setRunning(false)
      setComparedAt(`${date} ${time}`)
      setView('band')
      setPage(1)
      setSearch('')
      setSort({ key: null, dir: 1 })
    }
    tick()
  }

  const stopCompare = () => {
    clearTimeout(timerRef.current)
    setRunning(false)
    clearRunView('Karşılaştırma durduruldu. Sonuç tutulmadı; filtreleri seçip yeniden karşılaştırabilirsiniz.')
  }

  const storeRows = useMemo(() => {
    let list = STORES.map((store) => ({
      store,
      status: storeStatus(store),
      counts: countItems(store.items),
    }))
    const query = search.trim().toLocaleLowerCase('tr')
    if (query) {
      list = list.filter(
        (row) => row.store.name.toLocaleLowerCase('tr').includes(query) || row.store.store.includes(query),
      )
    }
    return compareStores(list, sort)
  }, [search, sort])

  const detailRows = useMemo(() => {
    if (!rest) return { menus: [], singles: [], counts: null }
    const query = detailSearch.trim().toLocaleLowerCase('tr')
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
  }, [rest, filter, detailSearch])

  const bandPages = Math.max(1, Math.ceil(storeRows.length / pageSize))
  const bandPage = Math.min(page, bandPages)
  const bandSlice = storeRows.slice((bandPage - 1) * pageSize, bandPage * pageSize)
  const diffStores = STORES.filter((store) => storeStatus(store) === 'diff').length
  const missingStores = STORES.filter((store) => storeStatus(store) === 'missing').length
  const okStores = STORES.filter((store) => storeStatus(store) === 'ok').length
  const hasDiff = diffStores > 0
  const sortArrow = (key) => (sort.key === key ? <span className="fk-arr">{sort.dir > 0 ? '▲' : '▼'}</span> : null)

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key ? { key, dir: -current.dir } : { key, dir: key === 'name' ? 1 : -1 },
    )
  }

  const lastRunText = comparedAt
    ? `Karşılaştırma zamanı: ${comparedAt} · ${brandName(ccsId)} · ${groupName(groupId)} · ${bandName(groupId, priceGroupId)}`
    : "Filtreleri seçip Karşılaştır'a basın. Hesaplama canlı yapılır."

  return (
    <div className="fk">
      <div className="fk-title">
        <h1>Kanal–CCS fiyat karşılaştırma</h1>
        <p>Kanaldaki ürün ve opsiyon fiyatları ile CCS delivery fiyatları · ₺ TL</p>
      </div>

      <section className="fk-card fk-filters" aria-label="Filtreler">
        <div className="fk-field">
          <label htmlFor="fk-brand">Marka</label>
          <select
            id="fk-brand"
            value={ccsId}
            disabled={running}
            onChange={(event) => {
              setCcsId(event.target.value)
              clearRunView()
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
          <label htmlFor="fk-group">Ürün grubu</label>
          <select
            id="fk-group"
            value={groupId}
            disabled={running}
            onChange={(event) => {
              const next = event.target.value
              setGroupId(next)
              setPriceGroupId(BANDS[next][0].id)
              clearRunView()
            }}
          >
            {GROUPS.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.id})
              </option>
            ))}
          </select>
          <small>product/group/list</small>
        </div>
        <div className="fk-field">
          <label htmlFor="fk-band">Fiyat bandı</label>
          <select
            id="fk-band"
            value={priceGroupId}
            disabled={running}
            onChange={(event) => {
              setPriceGroupId(event.target.value)
              clearRunView()
            }}
          >
            {bands.map((band) => (
              <option key={band.id} value={band.id}>
                {band.name} ({band.id})
              </option>
            ))}
          </select>
          <small>price/group/list · seçilen ürün grubuna göre</small>
        </div>
        <div className="fk-field">
          <label htmlFor="fk-channel">Kanal</label>
          <select id="fk-channel" disabled>
            <option>Trendyol Go</option>
          </select>
          <small>İlk fazda tek kanal</small>
        </div>
        <button type="button" className="fk-btn" disabled={running} onClick={startCompare}>
          Karşılaştır
        </button>
        <div className="fk-lastrun">{lastRunText}</div>
      </section>

      {running ? (
        <section className="fk-card fk-progress" aria-live="polite">
          <div className="fk-prow">
            <span>
              Bu bantta <b>{TOTAL_STORES} mağaza</b> karşılaştırılacak.
            </span>
            <button type="button" className="fk-btn fk-danger" onClick={stopCompare}>
              Karşılaştırmayı durdur
            </button>
          </div>
          <div className="fk-bar">
            <i style={{ width: `${(progress / TOTAL_STORES) * 100}%` }} />
          </div>
          <div className="fk-prow">
            <span>{progress < TOTAL_STORES ? 'Kanal ve CCS fiyatları alınıyor…' : 'Karşılaştırma tamamlandı.'}</span>
            <b>
              {progress} / {TOTAL_STORES} mağaza tamamlandı
            </b>
          </div>
        </section>
      ) : null}

      {notice ? <section className="fk-card fk-notice">{notice}</section> : null}

      {view !== 'none' ? (
        <nav className="fk-crumbs" aria-label="Konum">
          <button
            type="button"
            onClick={() => {
              setView('band')
              setRestId(null)
            }}
          >
            {bandName(groupId, priceGroupId)}
          </button>
          {view === 'rest' && rest ? (
            <>
              <span> › </span>
              <b>
                {rest.name} · {rest.store}
              </b>
            </>
          ) : null}
        </nav>
      ) : null}

      {view === 'band' ? (
        <div className="fk-stack">
          <section className={`fk-card fk-verdict ${hasDiff ? 'bad' : 'ok'}`}>
            <div>
              <div className="fk-big">
                {FAILED.length ? 'Karşılaştırılan mağazalarda' : 'Bu fiyat bandında'} fiyat farkı {hasDiff ? 'var' : 'yok'}
              </div>
              <div className="fk-meta">
                {brandName(ccsId)} · {groupName(groupId)} · {bandName(groupId, priceGroupId)} · Trendyol Go · {STORES.length}{' '}
                mağaza karşılaştırıldı
              </div>
            </div>
            <div className="fk-export">
              <button
                type="button"
                className="fk-btn fk-ghost"
                onClick={() => {
                  const stamp = (comparedAt || '').replaceAll('.', '').replace(' ', '-').replace(':', '')
                  setExportMsg(
                    `Örnek: fiyat-karsilastirma_${brandName(ccsId)}_${groupId}_${priceGroupId}_${stamp}.xlsx · sayfalar: Ürünler, Opsiyonlar`,
                  )
                }}
              >
                Excel&apos;e aktar
              </button>
              {exportMsg ? <span className="fk-exportmsg">{exportMsg}</span> : null}
            </div>
          </section>

          {FAILED.length ? (
            <section className="fk-failwarn">
              ⚠ {FAILED.length} mağaza kanal yanıt vermediği için karşılaştırılamadı:{' '}
              {FAILED.map((store) => `${store.name} (${store.store})`).join(', ')}. Yeniden karşılaştırabilirsiniz.
            </section>
          ) : null}

          <section className="fk-stats">
            <div className="fk-card fk-stat">
              <div className="fk-k">Restoran (mağaza satırı)</div>
              <div className="fk-v">{STORES.length}</div>
            </div>
            <div className="fk-card fk-stat warn">
              <div className="fk-k">Fiyat farkı olan</div>
              <div className="fk-v">{diffStores}</div>
            </div>
            <div className="fk-card fk-stat info">
              <div className="fk-k">Eksik kayıtlı</div>
              <div className="fk-v">{missingStores}</div>
            </div>
            <div className="fk-card fk-stat ok">
              <div className="fk-k">Farksız</div>
              <div className="fk-v">{okStores}</div>
            </div>
          </section>

          <section className="fk-card">
            <div className="fk-panelhead">
              <h2>Restoranlar</h2>
              <span>Bir restorana tıklayın, ürünleri açılır</span>
            </div>
            <div className="fk-tools">
              <input
                type="search"
                value={search}
                placeholder="Restoran adı veya Trendyol store ID ara"
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
                    <th>
                      <button type="button" className="fk-sort" onClick={() => toggleSort('name')}>
                        Restoran {sortArrow('name')}
                      </button>
                    </th>
                    <th>Trendyol store ID</th>
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
                        onClick={() => {
                          setRestId(store.id)
                          setView('rest')
                          setFilter('all')
                          setOpen(new Set())
                          setDetailSearch('')
                          setDetailPage({ menu: 1, single: 1 })
                          window.scrollTo({ top: 0 })
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          setRestId(store.id)
                          setView('rest')
                          setFilter('all')
                          setOpen(new Set())
                          setDetailSearch('')
                          setDetailPage({ menu: 1, single: 1 })
                        }}
                      >
                        <td>{store.name}</td>
                        <td className="fk-mono">{store.store}</td>
                        <td className="fk-num">{counts.diff}</td>
                        <td className="fk-num">{counts.missing}</td>
                        <td>
                          <span className={`fk-pill fk-${STORE_STATUS_LABEL[status][1]}`}>
                            {STORE_STATUS_LABEL[status][0]}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="fk-empty">
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
          <section className="fk-stats">
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
            <div className="fk-panelhead">
              <h2>
                {rest.name} · Trendyol {rest.store}
              </h2>
              <div className="fk-chips">
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
                value={detailSearch}
                placeholder="Ürün adı ara"
                aria-label="Ürün ara"
                onChange={(event) => {
                  setDetailSearch(event.target.value)
                  setDetailPage({ menu: 1, single: 1 })
                }}
              />
            </div>
            <ProductTable
              title="Menüler"
              hint="Satıra tıklayın, opsiyon türleri açılır; ▸ olan opsiyonun değiştiricileri de açılır"
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
            />
            <ProductTable
              title="Tekli ürünler"
              hint="Değiştiricileri olan ürünler açılır · Mongo eşleşmesi olmayanlar da burada"
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
            />
            <div className="fk-note">
              &quot;İstemiyorum&quot; içeren kayıtlar listelenmez. Fark, kanal ile CCS fiyatı arasındaki tutarın mutlak değeridir; tolerans yok. Kanalda pasif,
              kanalda yok veya CCS&apos;te yok olan ürünlerin opsiyonları karşılaştırılmaz.
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
