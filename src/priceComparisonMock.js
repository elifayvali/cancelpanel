/** Mock veri ve run simülasyonu — Kanal Fiyat Karşılaştırma */

export const ALLOWED_CCS_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '10'])

export const MOCK_BRANDS = [
  { ccsId: '1', brandName: 'Burger King' },
  { ccsId: '2', brandName: 'Usta Pideci' },
  { ccsId: '3', brandName: 'Burger King Cafe' },
  { ccsId: '4', brandName: 'Usta Dönerci' },
  { ccsId: '5', brandName: 'Popeyes' },
  { ccsId: '6', brandName: "Arby's" },
  { ccsId: '7', brandName: 'Sbarro' },
  { ccsId: '10', brandName: 'Subway' },
]

const PRODUCT_GROUPS = [
  { productGroupId: '1001', productGroupName: 'BANT AVM' },
  { productGroupId: '1002', productGroupName: 'BANT INLINE' },
]

const PRICE_GROUPS = [
  { priceGroupId: '1004', productGroupId: '1001', priceGroupName: 'BNT 3 AVM' },
  { priceGroupId: '1000', productGroupId: '1001', priceGroupName: 'BNT 4 AVM' },
  { priceGroupId: '1001', productGroupId: '1002', priceGroupName: 'BANT 1 NORMAL' },
]

export const MOCK_STORES = [
  {
    storeName: 'UD Kadıköy Moda',
    globalStoreId: '40571',
    trendyolStoreId: '281001',
    priceDiffCount: 4,
    missingCount: 3,
    storeStatus: 'PRICE_DIFF',
  },
  {
    storeName: 'UD Kadıköy Moda',
    globalStoreId: '40571',
    trendyolStoreId: '281002',
    priceDiffCount: 0,
    missingCount: 0,
    storeStatus: 'OK',
  },
  {
    storeName: 'UD Beşiktaş',
    globalStoreId: '40580',
    trendyolStoreId: '281010',
    priceDiffCount: 0,
    missingCount: 2,
    storeStatus: 'MISSING',
  },
  {
    storeName: 'UD Ataşehir',
    globalStoreId: '40590',
    trendyolStoreId: '281020',
    priceDiffCount: 1,
    missingCount: 0,
    storeStatus: 'PRICE_DIFF',
  },
  {
    storeName: 'UD Bakırköy',
    globalStoreId: '40600',
    trendyolStoreId: '281030',
    priceDiffCount: 0,
    missingCount: 0,
    storeStatus: 'OK',
  },
  {
    storeName: 'UD Üsküdar',
    globalStoreId: '40610',
    trendyolStoreId: '281040',
    priceDiffCount: 0,
    missingCount: 0,
    storeStatus: 'OK',
  },
  {
    storeName: 'UD Maltepe',
    globalStoreId: '40620',
    trendyolStoreId: '281045',
    priceDiffCount: 2,
    missingCount: 1,
    storeStatus: 'PRICE_DIFF',
  },
]

export const MOCK_FAILED_STORES = [
  { storeName: 'UD Pendik', trendyolStoreId: '281050', reason: 'Trendyol 504' },
]

export function getMockStoreDetail281001() {
  return {
    storeName: 'UD Kadıköy Moda',
    trendyolStoreId: '281001',
    counters: { priceDiff: 4, missing: 3, channelPassive: 1, groupNotMatched: 2 },
    menus: [
      {
        trendyolProductId: '281520',
        channelName: 'Dört Dörtlük Menü',
        ccsPlu: '299071',
        ccsName: 'DÖRT DÖRTLÜK MENÜ',
        channelPrice: 1090,
        ccsPrice: 1090,
        diff: null,
        status: 'OK',
        optionSummary: { priceDiff: 2, missing: 3 },
        optionGroups: [
          {
            trendyolGroupId: '35200',
            groupName: '1. Sandviç Seçimi',
            ccsSubgroupPlu: '999900',
            groupStatus: 'MATCHED',
            options: [
              {
                trendyolOptionId: '277300',
                name: 'Whopper',
                ccsSubPlu: '9001',
                channelPrice: 0,
                ccsPrice: 0,
                diff: null,
                status: 'OK',
              },
            ],
          },
          {
            trendyolGroupId: '35210',
            groupName: 'İçecek Seçimi',
            ccsSubgroupPlu: '999905',
            groupStatus: 'MATCHED',
            options: [
              {
                trendyolOptionId: '277350',
                name: 'Kola',
                ccsSubPlu: '9002',
                channelPrice: 0,
                ccsPrice: 0,
                diff: null,
                status: 'OK',
              },
            ],
          },
          {
            trendyolGroupId: '35239',
            groupName: '2. Sos Seçimi',
            ccsSubgroupPlu: '999911',
            groupStatus: 'MATCHED',
            options: [
              {
                trendyolOptionId: '277379',
                name: 'Barbekü Sos',
                ccsSubPlu: '9006',
                channelPrice: 5,
                ccsPrice: 0,
                diff: 5,
                status: 'PRICE_DIFF',
              },
              {
                trendyolOptionId: '277380',
                name: 'Ranch Sos',
                ccsSubPlu: '9007',
                channelPrice: 5,
                ccsPrice: 0,
                diff: 5,
                status: 'PRICE_DIFF',
              },
              {
                trendyolOptionId: '277381',
                name: 'Acı Sos',
                ccsSubPlu: '',
                channelPrice: null,
                ccsPrice: null,
                diff: null,
                status: 'NOT_IN_CHANNEL',
              },
            ],
          },
          {
            trendyolGroupId: '35250',
            groupName: 'Promosyon Yan Ürün',
            ccsSubgroupPlu: '',
            groupStatus: 'NOT_MATCHED',
            options: [
              {
                trendyolOptionId: '277400',
                name: 'Patates',
                ccsSubPlu: '',
                channelPrice: 0,
                ccsPrice: null,
                diff: null,
                status: 'GROUP_NOT_MATCHED',
              },
            ],
          },
          {
            trendyolGroupId: '35260',
            groupName: 'Promosyon Tatlı',
            ccsSubgroupPlu: '',
            groupStatus: 'NOT_IN_CHANNEL',
            options: [
              {
                trendyolOptionId: '277410',
                name: 'Sufle',
                ccsSubPlu: '',
                channelPrice: null,
                ccsPrice: null,
                diff: null,
                status: 'NOT_IN_CHANNEL',
              },
            ],
          },
        ],
      },
      {
        trendyolProductId: '281802',
        channelName: 'Tombik Avantaj Menü',
        ccsPlu: '299064',
        ccsName: 'TOMBIK AVANTAJ MENU',
        channelPrice: 890,
        ccsPrice: 890,
        diff: null,
        status: 'OK',
        optionSummary: { priceDiff: 0, missing: 2 },
        optionGroups: [
          {
            trendyolGroupId: '35300',
            groupName: 'Promosyon Ekstra İçecek',
            ccsSubgroupPlu: '999920',
            groupStatus: 'MATCHED',
            options: [
              {
                trendyolOptionId: '277500',
                name: 'Ayran',
                ccsSubPlu: '9010',
                channelPrice: 0,
                ccsPrice: 0,
                diff: null,
                status: 'CHANNEL_PASSIVE',
              },
              {
                trendyolOptionId: '277501',
                name: 'Limonata',
                ccsSubPlu: '9011',
                channelPrice: 15,
                ccsPrice: null,
                diff: null,
                status: 'NOT_IN_CCS',
              },
            ],
          },
        ],
      },
      {
        trendyolProductId: '281900',
        channelName: 'Dürüm Tavuk Döner Menü',
        ccsPlu: '299080',
        ccsName: 'DURUM TAVUK DONER MENU',
        channelPrice: 265,
        ccsPrice: 255,
        diff: 10,
        status: 'PRICE_DIFF',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '281950',
        channelName: 'Tavuk Lokum Dürüm Menü',
        ccsPlu: '299090',
        ccsName: 'TAVUK LOKUM DURUM MENU',
        channelPrice: 320,
        ccsPrice: 320,
        diff: null,
        status: 'CHANNEL_PASSIVE',
        optionSummary: null,
        optionGroups: [],
      },
    ],
    singles: [
      {
        trendyolProductId: '282100',
        channelName: 'Tombik Tavuk Döner',
        ccsPlu: '2080',
        ccsName: 'TOMBIK TAVUK DONER',
        channelPrice: 195,
        ccsPrice: 195,
        diff: null,
        status: 'OK',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '282179',
        channelName: 'Ekmek Arası Et Döner',
        ccsPlu: '2090',
        ccsName: 'EKMEK ARASI ET DONER',
        channelPrice: 230,
        ccsPrice: 220,
        diff: 10,
        status: 'PRICE_DIFF',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '282200',
        channelName: "Soğan Halkası 8'li",
        ccsPlu: '2100',
        ccsName: 'SOGAN HALKASI 8LI',
        channelPrice: 85,
        ccsPrice: 85,
        diff: null,
        status: 'OK',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '282210',
        channelName: 'Coca-Cola 1 L',
        ccsPlu: '2110',
        ccsName: 'COCA COLA 1L',
        channelPrice: 75,
        ccsPrice: 75,
        diff: null,
        status: 'CHANNEL_PASSIVE',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '282220',
        channelName: '',
        ccsPlu: '2120',
        ccsName: 'SALGAM',
        channelPrice: null,
        ccsPrice: 45,
        diff: null,
        status: 'NOT_IN_CHANNEL',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '',
        channelName: '',
        ccsPlu: '',
        ccsName: 'KUNEFE',
        channelPrice: null,
        ccsPrice: null,
        diff: null,
        status: 'NOT_IN_CCS',
        optionSummary: null,
        optionGroups: [],
      },
      {
        trendyolProductId: '282230',
        channelName: 'Künefe',
        ccsPlu: '',
        ccsName: '',
        channelPrice: 120,
        ccsPrice: null,
        diff: null,
        status: 'NOT_IN_CHANNEL',
        optionSummary: null,
        optionGroups: [],
      },
    ],
  }
}

function mockDelay() {
  return new Promise((r) => setTimeout(r, 300 + Math.random() * 200))
}

/** @type {Map<string, object>} */
const runs = new Map()

let runSeq = 0

function brandNameForCcs(ccsId) {
  return MOCK_BRANDS.find((b) => b.ccsId === String(ccsId))?.brandName ?? 'Marka'
}

function groupMeta(productGroupId) {
  return PRODUCT_GROUPS.find((g) => g.productGroupId === String(productGroupId))
}

function bandMeta(priceGroupId) {
  return PRICE_GROUPS.find((g) => g.priceGroupId === String(priceGroupId))
}

export async function mockGetBrandsWithCcsId() {
  await mockDelay()
  return MOCK_BRANDS.filter((b) => ALLOWED_CCS_IDS.has(b.ccsId))
}

export async function mockGetProductGroups(ccsId) {
  await mockDelay()
  if (!ALLOWED_CCS_IDS.has(String(ccsId))) return []
  return PRODUCT_GROUPS.map((g) => ({ ...g, ccsId: String(ccsId) }))
}

export async function mockGetPriceGroups(ccsId, productGroupId) {
  await mockDelay()
  return PRICE_GROUPS.filter((p) => p.productGroupId === String(productGroupId)).map((p) => ({
    ...p,
    ccsId: String(ccsId),
  }))
}

export async function mockStartRun({ ccsId, productGroupId, priceGroupId, channel }) {
  await mockDelay()
  const runId = `mock-run-${++runSeq}-${Date.now()}`
  const pg = groupMeta(productGroupId)
  const pb = bandMeta(priceGroupId)
  const total = MOCK_STORES.length + MOCK_FAILED_STORES.length
  runs.set(runId, {
    runId,
    runStatus: 'RUNNING',
    progress: { done: 0, total },
    filters: {
      ccsId: String(ccsId),
      brandName: brandNameForCcs(ccsId),
      productGroupId: String(productGroupId),
      productGroupName: pg?.productGroupName ?? '',
      priceGroupId: String(priceGroupId),
      priceGroupName: pb?.priceGroupName ?? '',
      channel: channel || 'TRENDYOL_GO',
    },
    storeCount: total,
  })
  return { runId, runStatus: 'RUNNING', storeCount: total }
}

export async function mockGetRun(runId) {
  await mockDelay()
  const run = runs.get(runId)
  if (!run) {
    const err = new Error('Karşılaştırma bulunamadı.')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (run.runStatus === 'CANCELLED') {
    return { runId, runStatus: 'CANCELLED' }
  }
  if (run.runStatus === 'COMPLETED') {
    return { ...run }
  }
  if (run.runStatus === 'RUNNING') {
    run.progress.done = Math.min(run.progress.done + 1, run.progress.total)
    if (run.progress.done >= run.progress.total) {
      run.runStatus = 'COMPLETED'
      run.comparedAt = new Date().toISOString()
      const priceDiffStoreCount = MOCK_STORES.filter((s) => s.storeStatus === 'PRICE_DIFF').length
      const missingStoreCount = MOCK_STORES.filter((s) => s.storeStatus === 'MISSING').length
      const okStoreCount = MOCK_STORES.filter((s) => s.storeStatus === 'OK').length
      run.summary = {
        hasPriceDiff: priceDiffStoreCount > 0,
        storeCount: MOCK_STORES.length,
        priceDiffStoreCount,
        missingStoreCount,
        okStoreCount,
      }
      run.failedStores = [...MOCK_FAILED_STORES]
      run.stores = [...MOCK_STORES]
      delete run.progress
    }
    return {
      runId: run.runId,
      runStatus: run.runStatus,
      ...(run.runStatus === 'RUNNING' ? { progress: { ...run.progress } } : {}),
      ...(run.runStatus === 'COMPLETED' ? { ...run } : {}),
    }
  }
  return { ...run }
}

export async function mockGetStoreDetail(runId, trendyolStoreId) {
  await mockDelay()
  const run = runs.get(runId)
  if (!run || run.runStatus !== 'COMPLETED') {
    const err = new Error('Mağaza detayı için tamamlanmış karşılaştırma gerekir.')
    throw err
  }
  if (String(trendyolStoreId) === '281001') {
    return getMockStoreDetail281001()
  }
  return {
    storeName: MOCK_STORES.find((s) => s.trendyolStoreId === String(trendyolStoreId))?.storeName ?? 'Mağaza',
    trendyolStoreId: String(trendyolStoreId),
    counters: { priceDiff: 0, missing: 0, channelPassive: 0, groupNotMatched: 0 },
    menus: [],
    singles: [
      {
        trendyolProductId: '282999',
        channelName: 'Örnek Ürün',
        ccsPlu: '9999',
        ccsName: 'ORNEK URUN',
        channelPrice: 100,
        ccsPrice: 100,
        diff: null,
        status: 'OK',
        optionSummary: null,
        optionGroups: [],
      },
    ],
  }
}

export async function mockCancelRun(runId) {
  await mockDelay()
  const run = runs.get(runId)
  if (run) {
    run.runStatus = 'CANCELLED'
    delete run.progress
  }
  return { runId, runStatus: 'CANCELLED' }
}

export async function mockExportRun(runId) {
  await mockDelay()
  const run = runs.get(runId)
  if (!run || run.runStatus !== 'COMPLETED') {
    const err = new Error('Sonucun süresi doldu, yeniden karşılaştırın.')
    throw err
  }
  return run
}
