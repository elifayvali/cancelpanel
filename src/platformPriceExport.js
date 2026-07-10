import * as XLSX from 'xlsx'
import { flattenProductOptionItems } from './whopperMenuOptionsData'
import {
  getProductDetailContent,
  isWhopperMenuProduct,
  ncrDigits,
} from './platformPriceComparisonMock'

function absoluteDiff(channelPrice, ccsPrice, priceDiff) {
  if (priceDiff != null) return Math.abs(Number(priceDiff))
  return Math.abs(Number(channelPrice ?? 0) - Number(ccsPrice ?? 0))
}

function controlTypeForProduct(name) {
  return isWhopperMenuProduct(name) ? 'Menü' : 'Ürün'
}

/**
 * Excel satırları:
 * | Ürün | Kontrol Tipi | Opsiyon | Kanal | CCS | Fark |
 * Ana ürün/menü → Tip: Ürün veya Menü, Opsiyon: —
 * Farklı opsiyon → Tip: Opsiyon, Ürün: bağlı ürün adı, Opsiyon: opsiyon adı
 *
 * @param {Array<{ name: string, channelPrice: number, ccsPrice: number, ncrId?: string }>} rows
 */
export function exportPlatformPricesToExcel(rows) {
  if (!rows.length) return

  const sheetData = []

  for (const row of rows) {
    const detail = getProductDetailContent(row.name)
    const options = detail ? flattenProductOptionItems(detail.options) : []

    sheetData.push({
      Ürün: row.name,
      'Kontrol Tipi': controlTypeForProduct(row.name),
      Opsiyon: '—',
      Kanal: row.channelPrice,
      CCS: row.ccsPrice,
      Fark: absoluteDiff(row.channelPrice, row.ccsPrice),
      'NCR ID': ncrDigits(row.ncrId),
    })

    for (const option of options) {
      sheetData.push({
        Ürün: row.name,
        'Kontrol Tipi': 'Opsiyon',
        Opsiyon: option.name,
        Kanal: option.channelPrice,
        CCS: option.ccsPrice,
        Fark: absoluteDiff(option.channelPrice, option.ccsPrice, option.priceDiff),
        'NCR ID': '',
      })
    }
  }

  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Fiyat Karşılaştırma')
  const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  XLSX.writeFile(wb, `platform-fiyat-karsilastirma-${stamp}.xlsx`)
}
