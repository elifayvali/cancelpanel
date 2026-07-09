import { BRANDS, PriceSelect } from './priceComparisonUi'

export function PlatformComparisonToolbar({
  idSuffix = '',
  channelId,
  brand,
  productName,
  ncrId,
  formError,
  showFilters = false,
  onChannelIdChange,
  onBrandChange,
  onProductNameChange,
  onNcrIdChange,
  onCheck,
}) {
  const channelInputId = `ppc-channel-id${idSuffix}`
  const productNameInputId = `ppc-product-name${idSuffix}`
  const ncrIdInputId = `ppc-ncr-id${idSuffix}`

  return (
    <>
      <div className="pc-platform-toolbar-wrap">
        <div className="pc-platform-toolbar">
        <div className="pc-platform-toolbar__field">
          <label className="pc-platform-toolbar__label" htmlFor={channelInputId}>
            Restoran Kanal ID
          </label>
          <input
            id={channelInputId}
            type="text"
            className="pc-input"
            value={channelId}
            onChange={onChannelIdChange}
            placeholder="Örn. 172002"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="pc-platform-toolbar__field pc-platform-toolbar__field--brand">
          <PriceSelect
            id={`ppc-brand${idSuffix}`}
            label="Marka"
            value={brand}
            onChange={onBrandChange}
            placeholder="Marka seçiniz"
            options={BRANDS.map((b) => ({ value: b, label: b }))}
          />
        </div>

        <div className="pc-platform-toolbar__action">
          <button type="button" className="pc-btn pc-btn--primary" onClick={onCheck}>
            Kontrol Et
          </button>
        </div>
      </div>

      {showFilters ? (
      <div className="pc-platform-toolbar pc-platform-toolbar--filters">
        <div className="pc-platform-toolbar__field">
          <label className="pc-platform-toolbar__label" htmlFor={productNameInputId}>
            Ürün İsmi
          </label>
          <input
            id={productNameInputId}
            type="text"
            className="pc-input"
            value={productName}
            onChange={onProductNameChange}
            placeholder="Ürün adı girin"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="pc-platform-toolbar__field">
          <label className="pc-platform-toolbar__label" htmlFor={ncrIdInputId}>
            NCR ID
          </label>
          <input
            id={ncrIdInputId}
            type="text"
            className="pc-input"
            value={ncrId}
            onChange={onNcrIdChange}
            placeholder="Örn. 1001"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
      ) : null}
      </div>

      {formError ? <p className="pc-platform-error">{formError}</p> : null}
    </>
  )
}
