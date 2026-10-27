import * as XLSX from 'xlsx'
import { FAILED, itemStatus, optionCanOpen, optionStatus } from './catalog'

function statusLabelTr(status) {
  switch (status) {
    case 'ok':
      return 'Farksız'
    case 'diff':
      return 'Fiyat farkı'
    case 'pasif':
      return 'Kanalda pasif'
    case 'kanaldayok':
      return 'Kanalda yok'
    case 'ccsyok':
      return "CCS'te yok"
    case 'nogroup':
      return 'Karşılaştırılamadı'
    default:
      return status || ''
  }
}

function channelState(productOrOpt) {
  if (productOrOpt.st === 'pasif') return 'PASSIVE'
  if (productOrOpt.st === 'kanaldayok') return 'MISSING'
  return 'ACTIVE'
}

function numOrEmpty(v) {
  if (v == null || v === '') return ''
  return Number(v)
}

function diffVal(k, c, status) {
  if (status === 'kanaldayok' || status === 'ccsyok' || status === 'nogroup' || status === 'pasif') return ''
  if (k == null || c == null) return ''
  const d = Number(k) - Number(c)
  if (Number.isNaN(d) || d === 0) return ''
  return d
}

function pushProductRows(store, product, productRows) {
  const status = itemStatus(product)
  const tip = product.type === 'menu' ? 'Menü' : 'Tekli'
  productRows.push({
    Restoran: store.name,
    'Trendyol Store ID': store.store,
    'Ürün Tipi': tip,
    'Trendyol Ürün ID': product.ty || '',
    'Kanal Ürün Adı': product.name || '',
    'CCS PLU': product.plu || '',
    'CCS Ürün Adı': product.ccsName || '',
    'Kanal Fiyatı (TL)': numOrEmpty(product.k),
    'CCS Fiyatı (TL)': numOrEmpty(product.c),
    'Fark (TL)': diffVal(product.k, product.c, status),
    Durum: statusLabelTr(status),
    'Kanal Durumu': channelState(product),
    Neden: product.why || '',
  })
}

function pushOptionRows(store, product, optionRows) {
  const tip = product.type === 'menu' ? 'Menü' : 'Tekli'
  const productPlu = product.plu || ''
  const productName = product.name || product.ccsName || ''

  ;(product.groups || []).forEach((group) => {
    group.opts.forEach((option) => {
      const optStatus = optionStatus(group, option)
      optionRows.push({
        Restoran: store.name,
        'Trendyol Store ID': store.store,
        'Ürün Tipi': tip,
        'Ürün PLU': productPlu,
        'Ürün Adı': productName,
        Seviye: 'Opsiyon',
        'Üst Opsiyon': '',
        'Opsiyon Grubu ID': group.chMissing ? '' : group.ty || '',
        'Opsiyon Grubu Adı': group.name || '',
        'CCS Subgroup PLU': group.sub || '',
        'Trendyol Opsiyon ID': group.chMissing ? '' : option.ty || '',
        'Opsiyon Adı': option.name || '',
        'CCS Sub PLU': option.plu || '',
        'Kanal Fiyatı (TL)': group.chMissing ? '' : numOrEmpty(option.k),
        'CCS Fiyatı (TL)': group.chMissing ? '' : numOrEmpty(option.c),
        'Fark (TL)': group.chMissing ? '' : diffVal(option.k, option.c, optStatus),
        Durum: statusLabelTr(optStatus),
        'Kanal Durumu': channelState(option),
      })

      if (optionCanOpen(group, option)) {
        option.mods.forEach((modGroup) => {
          modGroup.opts.forEach((mod) => {
            const modStatus = optionStatus(modGroup, mod)
            optionRows.push({
              Restoran: store.name,
              'Trendyol Store ID': store.store,
              'Ürün Tipi': tip,
              'Ürün PLU': productPlu,
              'Ürün Adı': productName,
              Seviye: 'Değiştirici',
              'Üst Opsiyon': option.name || '',
              'Opsiyon Grubu ID': modGroup.ty || '',
              'Opsiyon Grubu Adı': modGroup.name || '',
              'CCS Subgroup PLU': modGroup.sub || '',
              'Trendyol Opsiyon ID': mod.ty || '',
              'Opsiyon Adı': mod.name || '',
              'CCS Sub PLU': mod.plu || '',
              'Kanal Fiyatı (TL)': numOrEmpty(mod.k),
              'CCS Fiyatı (TL)': numOrEmpty(mod.c),
              'Fark (TL)': diffVal(mod.k, mod.c, modStatus),
              Durum: statusLabelTr(modStatus),
              'Kanal Durumu': channelState(mod),
            })
          })
        })
      }
    })
  })
}

function slugPart(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-ğüşıöçĞÜŞİÖÇ]/gi, '')
}

function fileStamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export function exportChannelPriceComparisonExcel({ stores, brandName, groupName, bandName, comparedAt }) {
  const productRows = []
  const optionRows = []

  for (const store of stores) {
    for (const product of store.items) {
      pushProductRows(store, product, productRows)
      pushOptionRows(store, product, optionRows)
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productRows), 'Ürünler')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(optionRows), 'Opsiyonlar')

  const stamp = comparedAt
    ? comparedAt.replaceAll('.', '').replace(' ', '-').replace(':', '').slice(0, 13)
    : fileStamp()
  const fname = `fiyat-karsilastirma_${slugPart(brandName)}_${slugPart(groupName)}_${slugPart(bandName)}_${stamp}.xlsx`
  XLSX.writeFile(wb, fname)
}

export { FAILED }
