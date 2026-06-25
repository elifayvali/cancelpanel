# Mail İletilen Hata Bildirimleri (Kanal Sipariş Hata Listesi)

[[_TOC_]]

## Amaç

Kanal sipariş süreçlerinde oluşan ve **mail ile bildirilen** hataların web panel üzerinden sorgulanması, filtrelenmesi ve detayının görüntülenmesi.

**CancelPanel** prototipi bu ekranın referansıdır. [Kaynak kod](https://github.com/elifayvali/cancelpanel)

---

## Hata sebebi tipleri

Açılışta seçim yok → **tüm tipler** listelenir.

| Teknik id | Ekranda |
|-----------|---------|
| `order-inject-error` | Ürün Mutfağa Gönderilemedi |
| `main-product-not-found` | Ana Ürün Eşleşmedi |
| `sub-product-not-found` | Alt ürün/Opsiyon Bulunamadı |
| `remote-code-null` | Kanal Eksik/Hatalı Mapping |

---

## Filtreler

Otomatik güncelleme; **Ara yok**. **Yenile** ile tekrar yükleme.

Tüm çoklu seçim menülerinde: **Select all** / **Remove all**.

| Filtre | Davranış |
|--------|----------|
| Hata sebebi | Çoklu; boş = tümü |
| Marka | Çoklu; boş = tümü |
| Kanal | Çoklu; boş = tümü |
| Hata kaynağı | CRM, Platform, Platform / CRM |
| Ürün kodu | `,` veya `;` ile çoklu kod (OR, tam eşleşme); ~400 ms |
| Hata detaylarında ara | Hata tipi, kaynak, ürün kodu, mesaj; ~400 ms |
| Tarih aralığı | Anında |

---

## Tablo ve detay

**Sütunlar:** Marka, Kanal, Hata tipi, Hata Kaynağı, Ürün Kodu, Hata Mesajı Detayı, Sipariş tarihi, Dcid, Platform Id, Detay.

**Hata Detayı popup:** DCID, Platform ID, Kanal, Marka, Tarih, Hata Mesajı, sabit bilgi kutusu (Hata Sebepleri listesi).

Sayfalama ve Excel dışa aktarma mevcuttur.

---

## Üretim hedefi

API entegrasyonu, kimlik/yetki, sunucu sayfalama, audit — CancelPanel = UI referansı, asıl iş = üretim entegrasyonu.

---

## Değişiklik geçmişi

- Türkçe hata sebebi başlıkları  
- Hata kaynağı filtresi  
- Otomatik filtre (Ara kaldırıldı)  
- Çoklu ürün kodu (virgül / noktalı virgül)  
- Select all / Remove all  
- Ortak Hata Detayı popup  

---

*ADO wiki ile senkron: `docs/MUSTERI_IPTAL_PANELI.md`*
