import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { WhopperMenuOptions } from './WhopperMenuOptions'
import {
  diffLabel,
  formatTl,
  getProductDetailContent,
  isExpandableProduct,
} from './platformPriceComparisonMock'

function ProductNameCell({ name, expanded, onToggle }) {
  const expandable = isExpandableProduct(name)

  if (!expandable) {
    return <span className="pc-platform-cell pc-platform-cell--name">{name}</span>
  }

  return (
    <button
      type="button"
      className={`pc-platform-cell pc-platform-cell--name pc-platform-cell--expandable ${expanded ? 'pc-platform-cell--expandable-open' : ''}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span>{name}</span>
      <ChevronDown size={16} className="pc-platform-cell__chev" aria-hidden />
    </button>
  )
}

export default function PlatformProductResults({ rows, expandedProduct, onToggleProduct }) {
  const [expandedOptionId, setExpandedOptionId] = useState(null)

  useEffect(() => {
    setExpandedOptionId(null)
  }, [expandedProduct])

  const handleToggleOption = useCallback((optionId) => {
    setExpandedOptionId((prev) => (prev === optionId ? null : optionId))
  }, [])

  return (
    <div className="pc-platform-results">
      <div className="pc-platform-results__header">
        <span>Kanal Ürünleri</span>
        <span>CCS Ürünleri</span>
        <span>Karşılaştırma Sonucu</span>
      </div>

      <ul className="pc-platform-results__list">
        {rows.map((row) => {
          const { text, tone } = diffLabel(row.channelPrice, row.ccsPrice)
          const expanded = expandedProduct === row.name
          const detail = expanded ? getProductDetailContent(row.name) : null

          return (
            <li key={row.name} className={`pc-platform-product ${expanded ? 'pc-platform-product--open' : ''}`}>
              <div className="pc-platform-product__row">
                <div className="pc-platform-product__col pc-platform-product__col--stack">
                  <div className="pc-platform-product__colTop">
                    <ProductNameCell
                      name={row.name}
                      expanded={expanded}
                      onToggle={() => onToggleProduct(row.name)}
                    />
                    <span className="pc-platform-cell pc-platform-cell--price">{formatTl(row.channelPrice)}</span>
                  </div>
                </div>

                <div className="pc-platform-product__col pc-platform-product__col--stack">
                  <div className="pc-platform-product__colTop">
                    <ProductNameCell
                      name={row.name}
                      expanded={expanded}
                      onToggle={() => onToggleProduct(row.name)}
                    />
                    <span className="pc-platform-cell pc-platform-cell--price">{formatTl(row.ccsPrice)}</span>
                  </div>
                </div>

                <div className="pc-platform-product__col pc-platform-product__col--result">
                  <span
                    className={`pc-platform-cell pc-platform-cell--diff pc-platform-cell--diff-${tone}`}
                    title={`Kanal − CCS: ${row.channelPrice - row.ccsPrice} TL`}
                  >
                    {text}
                  </span>
                </div>
              </div>

              {detail ? (
                <div
                  className="pc-platform-product__optionsCompare"
                  role="region"
                  aria-label={`${row.name} opsiyonları`}
                >
                  <WhopperMenuOptions
                    options={detail.options}
                    expandedOptionId={expandedOptionId}
                    onToggleOption={handleToggleOption}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
