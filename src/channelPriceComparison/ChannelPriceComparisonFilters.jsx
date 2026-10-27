import { PriceSelect } from '../priceComparisonUi'

export default function ChannelPriceComparisonFilters({
  brands,
  productGroups,
  priceGroups,
  ccsId,
  productGroupId,
  priceGroupId,
  loadingBrands,
  loadingGroups,
  loadingBands,
  disabled,
  onCcsIdChange,
  onProductGroupChange,
  onPriceGroupChange,
  onCompare,
}) {
  const brandOptions = brands.map((b) => ({
    value: b.ccsId,
    label: `${b.brandName} (${b.ccsId})`,
  }))
  const pgOptions = productGroups.map((g) => ({
    value: g.productGroupId,
    label: `${g.productGroupName} (${g.productGroupId})`,
  }))
  const pbOptions = priceGroups.map((p) => ({
    value: p.priceGroupId,
    label: `${p.priceGroupName} (${p.priceGroupId})`,
  }))

  const canCompare = Boolean(ccsId && productGroupId && priceGroupId) && !disabled

  return (
    <div className="cpc-filters">
      <PriceSelect
        id="cpc-brand"
        label="Marka"
        value={ccsId}
        onChange={onCcsIdChange}
        options={brandOptions}
        disabled={disabled}
        placeholder={loadingBrands ? 'Yükleniyor…' : 'Marka seçiniz'}
      />
      <PriceSelect
        id="cpc-pg"
        label="Ürün grubu"
        value={productGroupId}
        onChange={onProductGroupChange}
        options={pgOptions}
        disabled={disabled || !ccsId}
        placeholder={
          !ccsId ? 'Önce marka seçin' : loadingGroups ? 'Yükleniyor…' : pgOptions.length ? 'Ürün grubu seçiniz' : '—'
        }
      />
      <PriceSelect
        id="cpc-pb"
        label="Fiyat bandı"
        value={priceGroupId}
        onChange={onPriceGroupChange}
        options={pbOptions}
        disabled={disabled || !productGroupId}
        placeholder={
          !productGroupId
            ? 'Önce ürün grubu seçin'
            : loadingBands
              ? 'Yükleniyor…'
              : pbOptions.length
                ? 'Fiyat bandı seçiniz'
                : '—'
        }
      />
      <PriceSelect
        id="cpc-channel"
        label="Kanal"
        value="TRENDYOL_GO"
        onChange={() => {}}
        disabled={disabled}
        options={[{ value: 'TRENDYOL_GO', label: 'Trendyol Go' }]}
      />
      <div className="cpc-filters__action">
        <button type="button" className="pc-btn pc-btn--primary" disabled={!canCompare} onClick={onCompare}>
          Karşılaştır
        </button>
      </div>
    </div>
  )
}
