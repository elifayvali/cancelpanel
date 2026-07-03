import { ChevronDown } from 'lucide-react'
import { diffLabel } from './priceDiff'
import { flattenProductOptionItems, formatSalePrice } from './whopperMenuOptionsData'
import {
  formatTl,
  getProductDetailContent,
  isExpandableProduct,
} from './platformPriceComparisonMock'

export function flattenOptionItems(options) {
  return flattenProductOptionItems(options)
}

function DiffPill({ channelPrice, ccsPrice, priceDiff, highlightOnly, title }) {
  const { text, tone } = diffLabel(channelPrice, ccsPrice, { priceDiff, highlightOnly })

  return (
    <span className={`pc-platform-diff pc-platform-diff--${tone}`} title={title}>
      {text}
    </span>
  )
}

function ProductNameCell({ name, expanded, onToggle }) {
  const expandable = isExpandableProduct(name)

  if (!expandable) {
    return <span className="pc-platform-product__name">{name}</span>
  }

  return (
    <button
      type="button"
      className={`pc-platform-product__nameBtn ${expanded ? 'pc-platform-product__nameBtn--open' : ''}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span>{name}</span>
      <ChevronDown size={16} className="pc-platform-product__nameChev" aria-hidden />
    </button>
  )
}

function OptionRow({ item }) {
  return (
    <div className="pc-platform-product__row pc-platform-product__row--option">
      <div className="pc-platform-product__nameCol">
        <span className="pc-platform-product__optionName">{item.name}</span>
      </div>
      <div className="pc-platform-product__priceCol pc-platform-product__priceCol--channel">
        {formatSalePrice(item.channelPrice)}
      </div>
      <div className="pc-platform-product__priceCol pc-platform-product__priceCol--ccs">
        {formatSalePrice(item.ccsPrice)}
      </div>
      <div className="pc-platform-product__diffCol">
        <DiffPill
          channelPrice={item.channelPrice}
          ccsPrice={item.ccsPrice}
          priceDiff={item.priceDiff}
          title={
            item.priceDiff != null
              ? `Fiyat farkı: ${item.priceDiff} TL`
              : `Kanal − CCS: ${(item.channelPrice ?? 0) - (item.ccsPrice ?? 0)} TL`
          }
        />
      </div>
    </div>
  )
}

export default function PlatformProductResults({ rows, expandedProduct, onToggleProduct }) {
  return (
    <div className="pc-platform-results">
      <div className="pc-platform-results__header">
        <span className="pc-platform-results__th pc-platform-results__th--product">Ürün Adı</span>
        <span className="pc-platform-results__th pc-platform-results__th--channel">Kanalda Tanımlı Fiyat</span>
        <span className="pc-platform-results__th pc-platform-results__th--ccs">CCS&apos;te Tanımlı Fiyat</span>
        <span className="pc-platform-results__th pc-platform-results__th--diff">Fiyat Farkı</span>
      </div>

      <ul className="pc-platform-results__list">
        {rows.map((row) => {
          const expanded = expandedProduct === row.name
          const detail = getProductDetailContent(row.name)
          const optionItems = detail ? flattenOptionItems(detail.options) : []
          const parentHighlightOnly =
            Boolean(detail) && optionItems.length > 0 && row.channelPrice === row.ccsPrice

          return (
            <li
              key={row.name}
              className={`pc-platform-product ${expanded ? 'pc-platform-product--open' : ''}`}
            >
              <div className="pc-platform-product__row">
                <div className="pc-platform-product__nameCol">
                  <ProductNameCell
                    name={row.name}
                    expanded={expanded}
                    onToggle={() => onToggleProduct(row.name)}
                  />
                </div>
                <div className="pc-platform-product__priceCol pc-platform-product__priceCol--channel">
                  {formatTl(row.channelPrice)}
                </div>
                <div className="pc-platform-product__priceCol pc-platform-product__priceCol--ccs">
                  {formatTl(row.ccsPrice)}
                </div>
                <div className="pc-platform-product__diffCol">
                  <DiffPill
                    channelPrice={row.channelPrice}
                    ccsPrice={row.ccsPrice}
                    highlightOnly={parentHighlightOnly}
                    title={
                      parentHighlightOnly
                        ? 'Ana ürün fiyatları eşit; opsiyonlarda fark var'
                        : `Kanal − CCS: ${row.channelPrice - row.ccsPrice} TL`
                    }
                  />
                </div>
              </div>

              {expanded && detail ? (
                <div className="pc-platform-product__options" role="region" aria-label={`${row.name} opsiyonları`}>
                  {optionItems.map((item) => (
                    <OptionRow key={item.key} item={item} />
                  ))}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
