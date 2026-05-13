import './ErrorDetailStaticInfoBox.css'

/** Tüm “Hata Detayı” popup’larında gösterilen sabit açıklama ve hata sebepleri listesi. */
export function ErrorDetailStaticInfoBox() {
  return (
    <div className="rkd-hata-detay__info-box">
      <p className="rkd-hata-detay__info-lead">
        Yukarıdaki siparişte belirtilen ürünler tanım hatası sebebiyle eşleştirilememiştir. Sipariş eksik içerikle
        devam edecektir. Kontrollerinizi rica ederiz.
      </p>
      <p className="rkd-hata-detay__info-subtitle">Hata Sebepleri:</p>
      <ul className="rkd-hata-detay__info-list">
        <li>Kanalın ilettiği Product id ile CRM ürün tanımı eşleşmiyor olabilir.</li>
        <li>CRM&apos;de ilgili ürün pasif olabilir.</li>
        <li>CRM&apos;de ilgili ürün hiç tanımlanmamış olabilir.</li>
      </ul>
    </div>
  )
}
