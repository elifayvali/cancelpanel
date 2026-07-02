import { ChevronRight, ChevronUp } from 'lucide-react'
import { diffLabel } from './priceDiff'
import { formatSalePrice } from './whopperMenuOptionsData'

function optionHasPriceDiff(option) {
  return option.items.some(
    (item) => (item.channelPrice ?? 0) !== (item.ccsPrice ?? 0),
  )
}

function OptionItemCell({ item, priceKey }) {
  return (
    <div className="pc-whopper-compare__itemCell">
      <div className="pc-whopper-compare__itemMain">
        <span className="pc-whopper-options__label">Ürün Adı</span>
        <span className="pc-whopper-options__itemName">{item.name}</span>
      </div>
      <div className="pc-whopper-compare__itemPrice">
        <span className="pc-whopper-options__label">Satış Fiyatı</span>
        <span className="pc-whopper-options__itemAmount">{formatSalePrice(item[priceKey])}</span>
      </div>
    </div>
  )
}

function OptionDiffCell({ channelPrice, ccsPrice }) {
  const { text, tone } = diffLabel(channelPrice ?? 0, ccsPrice ?? 0)

  return (
    <div className="pc-whopper-compare__diffCell">
      <span
        className={`pc-platform-cell pc-platform-cell--diff pc-platform-cell--diff-${tone}`}
        title={`Kanal − CCS: ${(channelPrice ?? 0) - (ccsPrice ?? 0)} TL`}
      >
        {text}
      </span>
    </div>
  )
}

export function WhopperMenuOptions({ options, expandedOptionId, onToggleOption }) {
  return (
    <div className="pc-whopper-compare">
      <ul className="pc-whopper-options">
        {options.map((option, index) => {
          const open = expandedOptionId === option.id
          const hasDiff = optionHasPriceDiff(option)
          const nameClass = `pc-whopper-options__name${hasDiff ? ' pc-whopper-options__name--diff' : ''}`
          return (
            <li key={option.id} className="pc-whopper-options__group">
              <button
                type="button"
                className={`pc-whopper-compare__optionRow ${index % 2 === 0 ? 'pc-whopper-compare__optionRow--alt' : ''} ${open ? 'pc-whopper-compare__optionRow--open' : ''}`}
                onClick={() => onToggleOption(option.id)}
                aria-expanded={open}
              >
                <div className="pc-whopper-compare__optionCol">
                  <span className="pc-whopper-options__chev" aria-hidden>
                    {open ? <ChevronUp size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <div className="pc-whopper-options__main">
                    <span className="pc-whopper-options__label">Opsiyon Adı</span>
                    <span className={nameClass}>{option.name}</span>
                  </div>
                  <div className="pc-whopper-options__total">
                    <span className="pc-whopper-options__label">Toplam</span>
                    <span className="pc-whopper-options__count">{option.count} Ürün</span>
                  </div>
                </div>
                <div className="pc-whopper-compare__optionCol">
                  <span className="pc-whopper-options__chev" aria-hidden>
                    {open ? <ChevronUp size={18} /> : <ChevronRight size={18} />}
                  </span>
                  <div className="pc-whopper-options__main">
                    <span className="pc-whopper-options__label">Opsiyon Adı</span>
                    <span className={nameClass}>{option.name}</span>
                  </div>
                  <div className="pc-whopper-options__total">
                    <span className="pc-whopper-options__label">Toplam</span>
                    <span className="pc-whopper-options__count">{option.count} Ürün</span>
                  </div>
                </div>
                <div className="pc-whopper-compare__optionCol pc-whopper-compare__optionCol--result" aria-hidden />
              </button>

              {open ? (
                <ul className="pc-whopper-compare__items">
                  {option.items.map((optionItem, itemIndex) => (
                    <li
                      key={optionItem.name}
                      className={`pc-whopper-compare__itemRow ${itemIndex % 2 === 0 ? 'pc-whopper-compare__itemRow--alt' : ''}`}
                    >
                      <OptionItemCell item={optionItem} priceKey="channelPrice" />
                      <OptionItemCell item={optionItem} priceKey="ccsPrice" />
                      <OptionDiffCell
                        channelPrice={optionItem.channelPrice}
                        ccsPrice={optionItem.ccsPrice}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
