import { BRANDS, PriceSelect } from './priceComparisonUi'

export function PlatformComparisonToolbar({
  idSuffix = '',
  channelId,
  brand,
  formError,
  onChannelIdChange,
  onBrandChange,
  onCheck,
}) {
  const channelInputId = `ppc-channel-id${idSuffix}`

  return (
    <>
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

      {formError ? <p className="pc-platform-error">{formError}</p> : null}
    </>
  )
}
