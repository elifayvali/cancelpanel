import { CHANNEL_LABELS } from './channelLabels'

/**
 * Kanal dizisini sabit uzunlukta open | closed | na listesine tamamlar.
 * @param {unknown[] | undefined} ch
 * @returns {('open' | 'closed' | 'na')[]}
 */
export function normalizeChannelsArray(ch) {
  return CHANNEL_LABELS.map((_, i) => ch?.[i] ?? 'na')
}

/**
 * Restoran satırlarından dashboard JSON üretir.
 * Satışa Açık Kanal Sayısı, Kanal etiketleri ve tablo verisi tek yapıda.
 *
 * @param {Array<{
 *   id: string
 *   name: string
 *   globalId: string
 *   brand: string
 *   city: string
 *   homeDelivery: string
 *   channels: unknown[]
 *   detail?: unknown
 * }>} rows
 */
export function buildDashboardJson(rows) {
  let acik = 0
  let satilabilir = 0

  for (const r of rows) {
    const kanallar = normalizeChannelsArray(r.channels)
    kanallar.forEach((durum) => {
      if (durum === 'na') return
      satilabilir += 1
      if (durum === 'open') acik += 1
    })
  }

  const yuzde = satilabilir === 0 ? 0 : Math.round((acik / satilabilir) * 1000) / 10

  return {
    meta: {
      surum: '1.0',
      olusturulma: new Date().toISOString(),
      restoranSayisi: rows.length,
      kanalEtiketleri: [...CHANNEL_LABELS],
    },
    ozet: {
      satisaAcikKanalSayisi: {
        acik,
        satilabilir,
        yuzde,
      },
    },
    kanal: {
      /** Çoklu seçim filtresinde kullanılan kanal listesi (1…N indeks) */
      etiketler: [...CHANNEL_LABELS],
    },
    kanalEntegrasyonDurumlari: {
      /** KANAL · entegrasyon durumları tablosu satırları */
      restoranlar: rows,
    },
  }
}

/**
 * İndirme / API / konsol için JSON string (UTF-8 uyumlu).
 * @param {ReturnType<typeof buildDashboardJson>} model
 */
export function dashboardJsonToString(model) {
  return JSON.stringify(model, null, 2)
}
