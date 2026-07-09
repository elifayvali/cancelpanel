import * as XLSX from 'xlsx'
import { diffLabel } from './priceDiff'
import { flattenProductOptionItems } from './whopperMenuOptionsData'
import { getProductDetailContent, ncrDigits } from './platformPriceComparisonMock'

function diffText(channelPrice, ccsPrice, { priceDiff, highlightOnly } = {}) {
  return diffLabel(channelPrice, ccsPrice, { priceDiff, highlightOnly }).text
}

function formatNcrIdForExport(ncrId) {
  return ncrDigits(ncrId)
}

/**
 * @param {Array<{ name: string, channelPrice: number, ccsPrice: number, ncrId?: string }>} rows
 */
export function exportPlatformPricesToExcel(rows) {
  if (!rows.length) return

  const sheetData = []

  for (const row of rows) {
    const detail = getProductDetailContent(row.name)
    const options = detail ? flattenProductOptionItems(detail.options) : []
    const highlightOnly = options.length > 0 && row.channelPrice === row.ccsPrice

    sheetData.push({
      'Ürün Adı': row.name,
      'Kanalda Tanımlı Fiyat': row.channelPrice,
      "CCS'te Tanımlı Fiyat": row.ccsPrice,
      'Fiyat Farkı': diffText(row.channelPrice, row.ccsPrice, { highlightOnly }),
      'NCR ID': formatNcrIdForExport(row.ncrId),
    })

    for (const option of options) {
      sheetData.push({
        'Ürün Adı': `  ${option.name}`,
        'Kanalda Tanımlı Fiyat': option.channelPrice,
        "CCS'te Tanımlı Fiyat": option.ccsPrice,
        'Fiyat Farkı': diffText(option.channelPrice, option.ccsPrice, { priceDiff: option.priceDiff }),
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
