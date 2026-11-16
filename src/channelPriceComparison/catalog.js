/** Kanal–CCS fiyat karşılaştırma örnek verisi ve durum kuralları. */

export const BRANDS = [
  { ccsId: 1, name: 'Burger King' },
  { ccsId: 2, name: 'Usta Pideci' },
  { ccsId: 3, name: 'Burger King Cafe' },
  { ccsId: 4, name: 'Usta Dönerci' },
  { ccsId: 5, name: 'Popeyes' },
  { ccsId: 6, name: "Arby's" },
  { ccsId: 7, name: 'Sbarro' },
  { ccsId: 10, name: 'Subway' },
]

export const GROUPS = [
  { id: '1001', name: 'BANT AVM' },
  { id: '1002', name: 'BANT INLINE' },
]

export const BANDS = {
  1001: [
    { id: '1004', name: 'BNT 3 AVM' },
    { id: '1000', name: 'BNT 4 AVM' },
  ],
  1002: [{ id: '1001', name: 'BANT 1 NORMAL' }],
}

const O = (name, ty, plu, k, c, st, mods) => ({ name, ty, plu, k, c, st, mods })

export const CHANNELS = [
  { id: 'TY', label: 'Trendyol Go' },
  { id: 'MG', label: 'Migros' },
]

export function channelLabel(channelId) {
  return CHANNELS.find((ch) => ch.id === channelId)?.label ?? 'Trendyol Go'
}

export function channelTypeLabel(channelId) {
  return channelId === 'MG' ? 'Migros' : 'Trendyol'
}

export function formatChannelItemId(channelId, id) {
  if (id == null || id === '' || id === '–') return '–'
  if (channelId !== 'MG') return id
  return `2300000${String(id).slice(-7).padStart(7, '0')}`
}

export function localizeWhy(text, channelId) {
  if (!text || channelId !== 'MG') return text
  return text.replace(/Trendyol/g, 'Migros')
}

const MIG_STORE_ID = {
  '281001': '60471',
  '281010': '60488',
  '281020': '60502',
  '281030': '60515',
  '281040': '60530',
  '281045': '60544',
  '281050': '60550',
  '281060': '60555',
}

function modAci() {
  return [
    {
      name: 'Peynir Seçimi',
      ty: '141603',
      sub: '999950',
      opts: [
        O('Peynir 1 Adet', '1273230', '111054', 15, 15),
        O('Peynir 2 Adet', '1273232', '111054', 30, 15, 'adet'),
      ],
    },
    {
      name: 'Ekstra Lavaş Seçimi',
      ty: '1747471',
      sub: '999951',
      opts: [O('Ekstra Lavaş', '19945674', '11253', 30, 25)],
    },
  ]
}

function modCacik() {
  return [
    {
      name: 'Gramaj Seçimi',
      ty: '35483',
      sub: '999952',
      opts: [
        O('Tavuk Döner (130 gr.)', '282065', '10025', 25, 25),
        O('Tavuk Döner (160 gr.)', '282067', '10026', 50, 50),
      ],
    },
    {
      name: 'Peynir Seçimi',
      ty: '141603',
      sub: '999950',
      opts: [
        O('Peynir 1 Adet', '1273230', '111054', 15, 15),
        O('Peynir 2 Adet', '1273232', '111054', 30, 15, 'adet'),
      ],
    },
    {
      name: 'Ekstra Lavaş Seçimi',
      ty: '1747471',
      sub: '999951',
      opts: [O('Ekstra Lavaş', '19945674', '11253', 30, 25)],
    },
  ]
}

function template(variant) {
  const dort = {
    type: 'menu',
    name: 'Dört Dörtlük Menü',
    ty: '281520',
    plu: '299071',
    ccsName: 'DÖRT DÖRTLÜK MENÜ',
    k: 1090,
    c: 1090,
    groups: [
      {
        name: '1. Sandviç Seçimi',
        ty: '35317',
        sub: '999901',
        opts: [
          O('Cacık Soslu Dürüm Tavuk Döner', '14891580', '2141', 0, 0, undefined, modCacik()),
          O('Acı Soslu Dürüm Et Döner', '14891739', '2138', 30, 30, undefined, modAci()),
          O('Gyro Soslu Dürüm Et Döner', '282173', '2102', 30, 30),
        ],
      },
      {
        name: 'İçecek Seçimi',
        ty: '35307',
        sub: '999905',
        opts: [
          O('Coca-Cola (1 L.)', '282297', '3049', 0, 0),
          O('Fanta (1 L.)', '282291', '3051', 0, 0),
          O('Sprite (1 L.)', '282337', '3052', 0, 0),
        ],
      },
      {
        name: '2. Sos Seçimi',
        ty: '35239',
        sub: '999911',
        opts: [
          O('Ketçap', '277381', '9001', 0, 0),
          O('Mayonez', '277382', '9002', 0, 0),
          O('Barbekü Sos', '277379', '9006', 5, 0),
          O('Ranch Sos', '4167592', '9008', 5, 0),
          O('Acı Sos', '277377', '9003', null, 0, 'kanaldayok'),
        ],
      },
      {
        name: 'Promosyon Yan Ürün',
        ty: '35263',
        sub: null,
        opts: [O("Soğan Halkası (8'li)", '280669', '5014', 45, null), O("Soğan Halkası (6'lı)", '280664', '5013', 40, null)],
      },
      {
        name: 'Promosyon Baharat',
        ty: '35990',
        sub: null,
        noMongo: true,
        opts: [O('Barbekü Baharatı', '4999101', null, 5, null), O('Acılı Baharat', '4999102', null, 5, null)],
      },
      {
        name: 'Promosyon Tatlı',
        ty: '35262',
        sub: '999940',
        chMissing: true,
        opts: [O('Künefe', '—', '8010', null, 25), O('Sütlaç', '—', '8012', null, 20)],
      },
    ],
  }

  const tombik = {
    type: 'menu',
    name: 'Tombik Avantaj Menü',
    ty: '281802',
    plu: '299064',
    ccsName: 'TOMBIK AVANTAJ MENU',
    k: 340,
    c: 340,
    groups: [
      {
        name: 'Yan Ürün Seçimi',
        ty: '35314',
        sub: '999922',
        opts: [O("Soğan Halkası (6'lı)", '280664', '5013', 0, 0), O("Soğan Halkası (8'li)", '280669', '5014', 8, 8)],
      },
      {
        name: 'Promosyon Ekstra İçecek',
        ty: '306934',
        sub: '999923',
        opts: [
          O('Coca-Cola (1 L.)', '282297', '3049', 65, 65),
          O('Fanta (1 L.)', '282291', '3051', 70, 65, 'pasif'),
          O('Ayran (1 L.)', '4999001', null, 40, null, 'ccsyok'),
        ],
      },
    ],
  }

  const durum = {
    type: 'menu',
    name: 'Dürüm Tavuk Döner Menü',
    ty: '281510',
    plu: '299020',
    ccsName: 'DURUM TAVUK DONER MENU',
    k: 265,
    c: 255,
    groups: [
      {
        name: 'İçecek Seçimi',
        ty: '35307',
        sub: '999905',
        opts: [O('Coca-Cola (33 cl.)', '282280', '3010', 0, 0), O('Ayran (Küçük)', '282281', '3020', 0, 0)],
      },
    ],
  }

  const lokum = {
    type: 'menu',
    name: 'Tavuk Lokum Dürüm Menü',
    ty: '15335943',
    plu: '299088',
    ccsName: 'TAVUK LOKUM DURUM MENU',
    k: 315,
    c: 305,
    st: 'pasif',
    groups: [
      {
        name: 'İçecek Seçimi',
        ty: '35307',
        sub: '999905',
        opts: [O('Coca-Cola (1 L.)', '282297', '3049', 0, 0)],
      },
    ],
  }

  const singles = [
    {
      type: 'single',
      name: 'Cacık Soslu Dürüm Tavuk Döner',
      ty: '14891580',
      plu: '2141',
      ccsName: 'CACIK SOSLU DURUM TAVUK',
      k: 325,
      c: 325,
      groups: modCacik(),
    },
    {
      type: 'single',
      name: 'Tombik Tavuk Döner',
      ty: '282207',
      plu: '2030',
      ccsName: 'TOMBIK TAVUK DONER',
      k: 300,
      c: 300,
    },
    {
      type: 'single',
      name: 'Ekmek Arası Et Döner',
      ty: '282179',
      plu: '2090',
      ccsName: 'EKMEK ARASI ET DONER',
      k: 230,
      c: 220,
    },
    {
      type: 'single',
      name: "Soğan Halkası (8'li)",
      ty: '280700',
      plu: '5014',
      ccsName: 'SOGAN HALKASI 8LI',
      k: 95,
      c: 95,
    },
    {
      type: 'single',
      name: 'Coca-Cola (1 L.)',
      ty: '282400',
      plu: '3049',
      ccsName: 'COCA COLA 1 LT',
      k: 75,
      c: 75,
      st: 'pasif',
    },
    {
      type: 'single',
      name: 'Şalgam (300 ml.)',
      ty: '282600',
      plu: null,
      ccsName: null,
      k: 45,
      c: null,
      st: 'ccsyok',
      why: "Mongo'da Trendyol eşleşmesi yok",
    },
    {
      type: 'single',
      name: null,
      ty: null,
      plu: '8010',
      ccsName: 'KUNEFE',
      k: null,
      c: 120,
      st: 'kanaldayok',
      why: 'Kanalda yok',
    },
    {
      type: 'single',
      name: "Soğan Halkası (10'lu)",
      ty: '280671',
      plu: '5016',
      ccsName: 'SOGAN HALKASI 10LU',
      k: 105,
      c: 110,
      why: "Trendyol'da sadece opsiyon olarak satılıyor; Mongo'da tekli ürün (F-P29)",
    },
  ]

  let all = [dort, tombik, durum, lokum, ...singles]
  if (variant === 'clean') {
    all.forEach((product) => {
      if (product.groups) product.groups = product.groups.filter((group) => !group.chMissing && !group.noMongo)
    })
  }
  if (variant === 'clean' || variant === 'missing') {
    all.forEach((product) => {
      if (!product.st) product.c = product.k
      ;(product.groups || []).forEach((group) => {
        if (!group.sub) group.sub = '999930'
        group.opts.forEach((opt) => {
          if (!opt.st && !group.chMissing) opt.c = opt.k
          ;(opt.mods || []).forEach((modGroup) => {
            modGroup.opts.forEach((mod) => {
              mod.c = mod.k
            })
          })
        })
      })
    })
    if (variant === 'clean') {
      all = all
        .filter((product) => !product.st || product.st === 'pasif')
        .map((product) => ({
          ...product,
          groups: (product.groups || [])
            .filter((group) => !group.chMissing)
            .map((group) => ({
              ...group,
              opts: group.opts.filter((opt) => !opt.st || opt.st === 'pasif'),
            })),
        }))
    }
  }
  return all
}

const STORE_SEED = [
  { name: 'UD Kadıköy Moda', store: '281001', g: '40571', pg: '1001', pb: '1004', v: 'full' },
  { name: 'UD Kadıköy Moda', store: '281002', g: '40571', pg: '1001', pb: '1004', v: 'clean', second: true },
  { name: 'UD Ataşehir Brandium', store: '281010', g: '40588', pg: '1001', pb: '1004', v: 'clean' },
  { name: 'UD Bakırköy Carousel', store: '281020', g: '40602', pg: '1001', pb: '1000', v: 'missing' },
  { name: 'UD Maltepe Piazza', store: '281030', g: '40615', pg: '1001', pb: '1000', v: 'full' },
  { name: 'UD Beşiktaş Çarşı', store: '281040', g: '40630', pg: '1001', pb: '1004', v: 'clean' },
  { name: 'UD Üsküdar Meydan', store: '281045', g: '40644', pg: '1001', pb: '1000', v: 'missing' },
]

export const ALL_STORES = STORE_SEED.map((row, index) => ({
  ...row,
  id: `r${index}`,
  items: template(row.v),
}))

const ALL_FAILED_TY = [
  {
    name: 'UD Pendik',
    store: '281050',
    g: '40650',
    pg: '1001',
    pb: '1004',
    reason: 'Trendyol menü servisi yanıt vermedi (HTTP 504)',
  },
  { name: 'UD Bağdat Caddesi', store: '281060', g: '40655', pg: '1001', pb: '1000', reason: 'Kanal menüsü boş döndü' },
]

const ALL_FAILED_MG = [
  {
    name: 'UD Pendik',
    store: '60550',
    g: '40650',
    pg: '1001',
    pb: '1004',
    reason: 'Migros menü servisi yanıt vermedi (HTTP 504)',
  },
  { name: 'UD Bağdat Caddesi', store: '60555', g: '40655', pg: '1001', pb: '1000', reason: 'Migros API anahtarı bulunamadı' },
]

/** @deprecated mock uyumluluğu — aktif kapsam bileşende tutulur */
export const STORES = ALL_STORES
export const FAILED = ALL_FAILED_TY

export function filterScope(groupId, bandId, channelId = 'TY') {
  const inScope = (row) => (!groupId || row.pg === groupId) && (!bandId || row.pb === bandId)
  if (channelId === 'MG') {
    const stores = ALL_STORES.filter((row) => !row.second)
      .map((row) => ({
        ...row,
        store: MIG_STORE_ID[row.store] ?? row.store,
      }))
      .filter(inScope)
    return { stores, failed: ALL_FAILED_MG.filter(inScope) }
  }
  return {
    stores: ALL_STORES.filter(inScope),
    failed: ALL_FAILED_TY.filter(inScope),
  }
}

export function resolveGroupName(groupId) {
  if (!groupId) return 'Tüm ürün grupları'
  return GROUPS.find((group) => group.id === groupId)?.name ?? groupId
}

export function resolveBandName(groupId, bandId) {
  if (!bandId) return 'Tüm bantlar'
  return BANDS[groupId]?.find((band) => band.id === bandId)?.name ?? bandId
}

export function bandSummaries(stores, failed) {
  const map = new Map()
  stores.forEach((store) => {
    const key = `${store.pg}|${store.pb}`
    if (!map.has(key)) map.set(key, { key, pg: store.pg, pb: store.pb, stores: [], failed: 0 })
    map.get(key).stores.push(store)
  })
  failed.forEach((row) => {
    const key = `${row.pg}|${row.pb}`
    if (map.has(key)) map.get(key).failed += 1
  })
  return [...map.values()]
    .map((band) => {
      const statuses = band.stores.map(storeStatus)
      return {
        ...band,
        n: band.stores.length,
        diffCount: statuses.filter((status) => status === 'diff').length,
        missingCount: statuses.filter((status) => status === 'missing').length,
      }
    })
    .sort(
      (a, b) =>
        a.pg.localeCompare(b.pg) ||
        resolveBandName(a.pg, a.pb).localeCompare(resolveBandName(b.pg, b.pb), 'tr'),
    )
}

export const FILTERS = [
  ['all', 'Tümü'],
  ['diff', 'Fiyat farkı'],
  ['missing', 'Eksik kayıt'],
  ['pasif', 'Kanalda pasif'],
  ['ok', 'Farksız'],
]

export const STATUS_LABEL = {
  ok: ['Farksız', 'ok'],
  diff: ['Fiyat farkı', 'warn'],
  pasif: ['Kanalda pasif', 'off'],
  kanaldayok: ['Kanalda yok', 'info'],
  ccsyok: ["CCS'te yok", 'bad'],
  nogroup: ['Karşılaştırılamadı · eşleşen opsiyon türü yok', 'bad'],
  adet: ["CCS'te ürünün tekli ürün fiyatı gönderilmektedir", 'off'],
}

export const STORE_STATUS_LABEL = {
  diff: ['Fiyat farkı var', 'warn'],
  missing: ['Eksik kayıt var', 'info'],
  ok: ['Farksız', 'ok'],
}

const STORE_ORDER = { diff: 0, missing: 1, ok: 2 }

export function isPasif(item) {
  return item.st === 'pasif'
}

export function itemStatus(item) {
  if (item.st === 'adet') return 'adet'
  if (item.st && !isPasif(item)) return item.st
  if (item.c === null) return 'nogroup'
  return item.k === item.c ? 'ok' : 'diff'
}

const OPTION_WHY = {
  kanaldayok: 'Kanalda yok',
  ccsyok: "Mongo'da Trendyol eşleşmesi yok",
}

export function optionWhyText(status, channelId = 'TY') {
  const text = OPTION_WHY[status]
  if (!text) return ''
  return localizeWhy(text, channelId)
}

export function isMissingStatus(status) {
  return status === 'kanaldayok' || status === 'ccsyok' || status === 'nogroup'
}

export function expandable(product) {
  return !!(product.groups && product.groups.length) && ['ok', 'diff'].includes(itemStatus(product))
}

export function optionStatus(group, option) {
  if (group.chMissing) return 'kanaldayok'
  if (group.noMongo) return 'ccsyok'
  if (!group.sub) return 'nogroup'
  return itemStatus(option)
}

export function optionCanOpen(group, option) {
  return ['ok', 'diff'].includes(optionStatus(group, option)) && !!(option.mods && option.mods.length)
}

export function modifierLines(group, option) {
  if (!optionCanOpen(group, option)) return []
  const out = []
  option.mods.forEach((modGroup) => {
    modGroup.opts.forEach((mod) => {
      out.push({
        key: `${option.ty}|${modGroup.ty}|${mod.ty}`,
        status: optionStatus(modGroup, mod),
        pasif: isPasif(mod),
      })
    })
  })
  return out
}

function optionStatuses(product) {
  if (!expandable(product)) return []
  const out = []
  ;(product.groups || []).forEach((group) => {
    group.opts.forEach((option) => out.push(optionStatus(group, option)))
  })
  return out
}

export function countItems(items) {
  const counts = { diff: 0, missing: 0, pasif: 0, ok: 0, nogroup: 0 }
  const seen = new Set()
  const add = (status, pasifRow) => {
    if (status === 'adet') return
    if (pasifRow) counts.pasif += 1
    if (status === 'diff') counts.diff += 1
    else if (isMissingStatus(status)) {
      counts.missing += 1
      if (status === 'nogroup') counts.nogroup += 1
    } else counts.ok += 1
  }

  items.forEach((product) => {
    add(itemStatus(product), isPasif(product))
    if (!expandable(product)) return
    product.groups.forEach((group) => {
      group.opts.forEach((option) => {
        const status = optionStatus(group, option)
        if (product.type === 'single') {
          const key = `${product.ty}|${group.ty}|${option.ty}`
          if (seen.has(key)) return
          seen.add(key)
        }
        add(status, isPasif(option))
        modifierLines(group, option).forEach((line) => {
          if (seen.has(line.key)) return
          seen.add(line.key)
          add(line.status, line.pasif)
        })
      })
    })
  })
  return counts
}

export function storeStatus(store) {
  const counts = countItems(store.items)
  if (counts.diff) return 'diff'
  if (counts.missing) return 'missing'
  return 'ok'
}

export function rowTags(product) {
  const status = itemStatus(product)
  if (!expandable(product)) {
    return [{ cat: isMissingStatus(status) ? 'missing' : status, status }]
  }
  const lines = optionStatuses(product)
  const diffCount = lines.filter((statusId) => statusId === 'diff').length
  const missingCount = lines.filter(isMissingStatus).length
  const tags = []
  if (status === 'diff') tags.push({ cat: 'diff', status: 'diff' })
  const word = product.type === 'single' ? 'değiştirici' : 'opsiyon'
  if (diffCount) tags.push({ cat: 'diff', text: `${diffCount} ${word} fiyat farkı`, tone: 'warn' })
  if (missingCount) tags.push({ cat: 'missing', text: `${missingCount} ${word} eksik`, tone: 'info' })
  if (!tags.length) tags.push({ cat: 'ok', status: 'ok' })
  return tags
}

export function optionTags(group, option) {
  const status = optionStatus(group, option)
  const tags = [{ cat: isMissingStatus(status) ? 'missing' : status, status }]
  const lines = modifierLines(group, option).map((line) => line.status)
  const diffCount = lines.filter((statusId) => statusId === 'diff').length
  const missingCount = lines.filter(isMissingStatus).length
  if (diffCount) tags.push({ cat: 'diff', text: `${diffCount} değiştirici farkı`, tone: 'warn' })
  if (missingCount) tags.push({ cat: 'missing', text: `${missingCount} değiştirici eksik`, tone: 'info' })
  if ((diffCount || missingCount) && status === 'ok') tags.shift()
  return tags
}

export function productRank(product) {
  const cats = rowTags(product).map((tag) => tag.cat)
  if (cats.includes('diff')) return 0
  if (cats.includes('missing')) return 1
  if (cats.includes('pasif')) return 2
  return 3
}

function rowMatchesFilter(filter, status) {
  if (filter === 'all') return true
  if (filter === 'missing') return isMissingStatus(status)
  return status === filter
}

function optionOwnsFilter(filter, group, option) {
  return filter === 'all' || optionTags(group, option).some((tag) => tag.cat === filter)
}

export function visibleModifiers(filter, group, option) {
  if (!optionCanOpen(group, option)) return []
  return option.mods
    .map((modGroup) => ({
      ...modGroup,
      opts: modGroup.opts.filter((mod) => rowMatchesFilter(filter, optionStatus(modGroup, mod))),
    }))
    .filter((modGroup) => modGroup.opts.length)
}

export function visibleGroups(filter, product) {
  if (!expandable(product)) return []
  return (product.groups || [])
    .map((group) => ({
      ...group,
      opts: group.opts.filter(
        (option) => optionOwnsFilter(filter, group, option) || visibleModifiers(filter, group, option).length,
      ),
    }))
    .filter((group) => group.opts.length)
}

export function productOwnsFilter(filter, product) {
  return filter === 'all' || rowTags(product).some((tag) => tag.cat === filter)
}

export function productMatches(filter, product) {
  return productOwnsFilter(filter, product) || visibleGroups(filter, product).length > 0
}

export function formatMoney(value) {
  if (value === null || value === undefined) return '–'
  return `₺${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDelta(item) {
  if (itemStatus(item) !== 'diff') return '–'
  if (item.k == null || item.c == null) return '–'
  return Number(Math.abs(item.k - item.c)).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function productKey(product) {
  return `${product.ty || ''}${product.plu || ''}`
}

export function compareStores(list, sort) {
  const next = [...list]
  const textKey = (row, key) => {
    if (key === 'name') return row.store.name
    if (key === 'pg') return resolveGroupName(row.store.pg)
    if (key === 'pb') return resolveBandName(row.store.pg, row.store.pb)
    return ''
  }
  if (sort.key) {
    const dir = sort.dir
    next.sort((a, b) => {
      if (sort.key === 'name' || sort.key === 'pg' || sort.key === 'pb') {
        return dir * textKey(a, sort.key).localeCompare(textKey(b, sort.key), 'tr')
      }
      if (sort.key === 'diff') return dir * (a.counts.diff - b.counts.diff)
      return dir * (a.counts.missing - b.counts.missing)
    })
    return next
  }
  next.sort(
    (a, b) => STORE_ORDER[a.status] - STORE_ORDER[b.status] || b.counts.diff - a.counts.diff || b.counts.missing - a.counts.missing,
  )
  return next
}
