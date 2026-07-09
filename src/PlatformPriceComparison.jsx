import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlatformComparisonToolbar } from './PlatformComparisonToolbar'
import { PlatformMissingInfoBox, PlatformMissingInfoModal } from './PlatformMissingInfo'
import PlatformResultsPagination from './PlatformResultsPagination'
import PlatformProductResults from './PlatformProductResults'
import {
  filterDiffRows,
  filterProductRows,
  getCatalogForBrand,
  isExpandableProduct,
} from './platformPriceComparisonMock'
import { exportPlatformPricesToExcel } from './platformPriceExport'
import './PriceComparison.css'

export default function PlatformPriceComparison() {
  const [channelId, setChannelId] = useState('')
  const [brand, setBrand] = useState('')
  const [productName, setProductName] = useState('')
  const [ncrId, setNcrId] = useState('')
  const [baseRows, setBaseRows] = useState(null)
  const [formError, setFormError] = useState('')
  const [checked, setChecked] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedProduct, setExpandedProduct] = useState(null)

  const rows = useMemo(() => {
    if (!baseRows) return null
    return filterProductRows(baseRows, { productName, ncrId })
  }, [baseRows, productName, ncrId])

  useEffect(() => {
    setPage(1)
    setExpandedProduct(null)
  }, [productName, ncrId, baseRows, pageSize])

  useEffect(() => {
    setExpandedProduct(null)
  }, [page])

  const paginatedRows = useMemo(() => {
    if (!rows) return []
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  const totalPages = useMemo(() => Math.max(1, Math.ceil((rows?.length ?? 0) / pageSize) || 1), [rows, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const handleChannelIdChange = useCallback((e) => {
    setChannelId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
    setChecked(false)
    setBaseRows(null)
    setFormError('')
  }, [])

  const handleBrandChange = useCallback((v) => {
    setBrand(v)
    setChecked(false)
    setBaseRows(null)
    setFormError('')
  }, [])

  const handleProductNameChange = useCallback((e) => {
    setProductName(e.target.value)
  }, [])

  const handleNcrIdChange = useCallback((e) => {
    setNcrId(e.target.value.replace(/[^0-9]/g, ''))
  }, [])

  const handleCheck = useCallback(() => {
    setFormError('')
    if (!channelId.trim()) {
      setFormError('Restoran kanal ID giriniz.')
      return
    }
    if (!brand) {
      setFormError('Marka seçiniz.')
      return
    }
    setBaseRows(filterDiffRows(getCatalogForBrand(brand)))
    setChecked(true)
    setPage(1)
    setInfoModalOpen(true)
  }, [channelId, brand])

  const handleToggleProduct = useCallback((name) => {
    if (!isExpandableProduct(name)) return
    setExpandedProduct((prev) => (prev === name ? null : name))
  }, [])

  const handleDownload = useCallback(() => {
    if (!rows?.length) return
    exportPlatformPricesToExcel(rows)
  }, [rows])

  return (
    <div className="pc-dash">
      <header className="pc-header">
        <div className="pc-header__inner pc-header__inner--wide">
          <div className="pc-header__meta">
            <h1 className="pc-header__title">Fiyat Karşılaştırma</h1>
            <p className="pc-header__crumb">
              <span>Dashboard</span>
              <span className="pc-header__crumbSep">/</span>
              <span className="pc-header__crumbActive">Platform Fiyat Karşılaştırma</span>
            </p>
          </div>
        </div>
      </header>

      <main className="pc-main pc-main--wide">
        <section className="pc-card pc-card--platform">
          <h2 className="pc-card__title">Platform Fiyat Karşılaştırma</h2>
          <p className="pc-card__desc">Kanal restoranı ve markasını seçerek, kanal ile CCS arasındaki ürün ve opsiyon fiyatlarını karşılaştırın.</p>

          <PlatformComparisonToolbar
            channelId={channelId}
            brand={brand}
            productName={productName}
            ncrId={ncrId}
            formError={formError}
            showFilters={checked}
            onChannelIdChange={handleChannelIdChange}
            onBrandChange={handleBrandChange}
            onProductNameChange={handleProductNameChange}
            onNcrIdChange={handleNcrIdChange}
            onCheck={handleCheck}
          />

          {checked && rows ? (
            <>
              <PlatformMissingInfoBox onClick={() => setInfoModalOpen(true)} />
              {rows.length > 0 ? (
                <>
                <PlatformProductResults
                  rows={paginatedRows}
                  expandedProduct={expandedProduct}
                  onToggleProduct={handleToggleProduct}
                />
                <PlatformResultsPagination
                  total={rows.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  onDownload={handleDownload}
                  downloadDisabled={!rows.length}
                />
                </>
              ) : (
                <p className="pc-platform-empty">Seçilen filtrelere uygun fiyat farkı bulunan ürün yok.</p>
              )}
            </>
          ) : (
            <p className="pc-platform-hint">Kanal ID ve marka girip Kontrol Et ile karşılaştırmayı başlatın.</p>
          )}
        </section>
      </main>

      <PlatformMissingInfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </div>
  )
}
