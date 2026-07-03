import { diffLabel } from './priceDiff'
import { formatSalePrice } from './whopperMenuOptionsData'

function flattenOptionItems(options) {
  return options.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      key: `${group.id}-${item.name}`,
    })),
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

export function WhopperMenuOptions({ options }) {
  const items = flattenOptionItems(options)

  return (
    <div className="pc-whopper-compare">
      <ul className="pc-whopper-compare__items pc-whopper-compare__items--flat">
        {items.map((optionItem, itemIndex) => (
          <li
            key={optionItem.key}
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
    </div>
  )
}
