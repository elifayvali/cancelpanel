# Platform Fiyat Karşılaştırma — Çalışma Mantığı

Bu doküman, CancelPanel uygulamasındaki **Platform Fiyat Karşılaştırma** ekranının iş akışını, veri modelini ve teknik mimarisini açıklar.

---

## 1. Amaç

Restoran kanal ID ve marka seçilerek, **Kanal** (platform/sipariş kanalı) ile **CCS** (merkezi fiyat sistemi) arasındaki ürün fiyatlarını karşılaştırmak. Yalnızca fiyat farkı olan ürünler listelenir; menü/burger gibi genişletilebilir ürünlerde opsiyon fiyatları da incelenebilir.

---

## 2. Ekran Akışı

```
[Kullanıcı girişi]
     │
     ▼
Restoran Kanal ID + Marka (zorunlu)
     │
     ▼
[Kontrol Et] ──► Validasyon ──► Mock katalog yükle ──► Fark filtresi uygula
     │                                              │
     │                                              ▼
     │                                    baseRows (tüm farklı ürünler)
     │                                              │
     ▼                                              ▼
Eşleşmeyen ürün bilgisi kutusu          Ürün İsmi / NCR ID filtresi (opsiyonel)
     │                                              │
     ▼                                              ▼
Modal (detay)                           rows (filtrelenmiş liste)
                                                       │
                                                       ▼
                                              Sayfalama + Tablo + Excel indir
```

### 2.1 Başlangıç durumu

- Kanal ID veya marka değiştiğinde sonuçlar sıfırlanır (`checked = false`, `baseRows = null`).
- Kullanıcıya *"Kanal ID ve marka girip Kontrol Et ile karşılaştırmayı başlatın"* mesajı gösterilir.

### 2.2 Kontrol Et

Zorunlu alanlar:

| Alan | Kural |
|------|-------|
| Restoran Kanal ID | Boş olamaz; yalnızca harf ve rakam kabul edilir |
| Marka | Seçilmeli (Burger King, Popeyes, Arby's) |

Başarılı doğrulamada:

1. Seçilen markaya göre ürün kataloğu alınır (`getCatalogForBrand`).
2. Yalnızca fiyat farkı olan satırlar filtrelenir (`filterDiffRows`).
3. Sonuç tablosu ve sayfalama gösterilir.
4. Eşleşmeyen ürün bilgisi modalı otomatik açılır.

### 2.3 Sonradan filtreleme

**Ürün İsmi** ve **NCR ID** alanları, Kontrol Et sonrası anlık filtre olarak çalışır (yeniden sorgu gerekmez):

- Her iki alan için minimum **3 karakter** gerekir.
- Kısmi eşleşme (içerir) mantığı kullanılır; büyük/küçük harf duyarsızdır.

---

## 3. Veri Kaynağı (Mock)

> **Not:** Mevcut sürüm gerçek API çağrısı yapmaz; tüm fiyatlar `platformPriceComparisonMock.js` içindeki mock katalogdan gelir.

### 3.1 Ürün kataloğu

`MOCK_PRODUCT_NAMES` listesindeki ürünler için kanal ve CCS fiyatları üretilir. Özel tanımlar:

| Ürün | Kanal fiyatı | CCS fiyatı | Not |
|------|--------------|------------|-----|
| AYRAN | 53 TL | 50 TL | Sabit |
| WHOPPER | 199 TL | 199 TL | Eşit; opsiyonlarda fark var |
| WHOPPER MENÜ* | 299 TL | 299 TL | Eşit; menü opsiyonlarında fark olabilir |
| Diğer ürünler | Formülle üretilir | Formülle üretilir | Genelde farklı |

\* WHOPPER MENÜ BÜYÜK, ÇİFT, KİNG, JR dahil

Her ürüne bir **NCR ID** atanır (`NCR-10021`, `NCR-10035`, … döngüsel).

### 3.2 Hangi ürünler listelenir?

`filterDiffRows` iki koşuldan birini sağlayan ürünleri dahil eder:

1. **Ana ürün farkı:** `channelPrice ≠ ccsPrice`
2. **Opsiyon farkı:** Ürün genişletilebilir (WHOPPER / WHOPPER MENÜ) ve en az bir opsiyonunda fiyat farkı var

Bu sayede WHOPPER gibi ana fiyatı eşit ama Ranch Sos gibi opsiyonları farklı ürünler de listede kalır.

---

## 4. Tablo Yapısı

Dört sütunlu grid düzeni:

| Sütun | Açıklama |
|-------|----------|
| Ürün Adı | Ana ürün adı; genişletilebilir ürünlerde ok ikonu |
| Kanalda Tanımlı Fiyat | Kanal tarafı fiyat (turkuaz) |
| CCS'te Tanımlı Fiyat | CCS tarafı fiyat (mor ton) |
| Fiyat Farkı | Mutlak fark, kırmızı pill badge |

### 4.1 Fiyat farkı hesabı

`priceDiff.js` → `diffLabel()`:

```
fark = |kanalFiyatı − ccsFiyatı|
```

- Gösterim: **`8 TL`**, **`5 TL`** (artı/eksi işareti yok, mutlak değer)
- Fark yoksa: **`—`** (gri veya kırmızı bağlama göre)

**Özel durum — `highlightOnly`:** Ana ürün fiyatları eşit ama opsiyonlarda fark varsa (ör. WHOPPER), ana satırda fark sütununda kırmızı **`—`** gösterilir. Bu, "ana ürün eşit, alt seçeneklerde sorun var" anlamına gelir.

### 4.2 Genişletilebilir ürünler

| Ürün tipi | Koşul | Opsiyon kaynağı |
|-----------|-------|-----------------|
| WHOPPER | Tam ad eşleşmesi | `WHOPPER_OPTIONS` |
| WHOPPER MENÜ | Adında "WHOPPER MENÜ" geçenler | `WHOPPER_MENU_OPTIONS` |

Satıra tıklanınca opsiyonlar açılır. **Yalnızca fiyat farkı olan opsiyonlar** gösterilir (`optionHasPriceDiff`).

#### WHOPPER opsiyonları (örnek)

| Opsiyon | Kanal | CCS | Fark |
|---------|-------|-----|------|
| Ranch Sos | 10,00₺ | 2,00₺ | 8 TL |
| Ayran (Büyük - 300ml) | 55,00₺ | 50,00₺ | 5 TL |

#### WHOPPER MENÜ opsiyonları

Yan ürün, içecek, promosyon grupları altında onlarca seçenek tanımlıdır. Kategoriler UI'da gösterilmez; yalnızca farkı olanlar düz liste halinde listelenir.

---

## 5. Sayfalama ve Dışa Aktarma

### 5.1 Sayfalama

- Varsayılan: **10** sonuç/sayfa (10, 25, 50 seçenekleri)
- Filtre veya sayfa boyutu değişince sayfa **1**'e döner
- Sayfa değişince açık genişletilmiş ürün kapanır

### 5.2 Dosya indir

Pagination alanındaki **Dosya indir** butonu:

- **Filtrelenmiş tüm satırları** Excel'e aktarır (yalnızca görünen sayfa değil)
- Genişletilebilir ürünlerin opsiyonları ana satırın altına girintili eklenir
- Dosya adı: `platform-fiyat-karsilastirma-{tarih-saat}.xlsx`

---

## 6. Eşleşmeyen Ürün Bilgisi

Kontrol Et sonrası üstte bilgi kutusu görünür. Tıklanınca modal açılır.

Mock veri örneği: *"Double Cheeseburger CCS'te bulunamadı"*

Bu alan, kanalda olup CCS'te eşleşmeyen ürünleri kullanıcıya bildirmek için ayrılmıştır (şu an sabit mock liste).

---

## 7. Dosya Yapısı

```
src/
├── PlatformPriceComparison.jsx    # Ana ekran, state yönetimi
├── PlatformComparisonToolbar.jsx  # Form ve filtre alanları
├── PlatformProductResults.jsx     # 4 sütunlu tablo + opsiyon satırları
├── PlatformResultsPagination.jsx  # Sayfalama + Dosya indir butonu
├── PlatformMissingInfo.jsx        # Eşleşmeyen ürün kutusu ve modal
├── platformPriceComparisonMock.js # Mock katalog, filtreler, ürün tipi kontrolleri
├── platformPriceExport.js         # Excel dışa aktarma
├── priceDiff.js                   # Fark hesabı ve etiket üretimi
├── whopperMenuOptionsData.js      # WHOPPER / WHOPPER MENÜ opsiyon verileri
└── PriceComparison.css            # CancelPanel tasarım token'ları (--cp-*)
```

---

## 8. State Özeti

| State | Açıklama |
|-------|----------|
| `channelId`, `brand` | Zorunlu sorgu parametreleri |
| `productName`, `ncrId` | Opsiyonel anlık filtreler |
| `baseRows` | Kontrol Et sonrası farklı tüm ürünler |
| `rows` | `baseRows` + isim/NCR filtresi |
| `paginatedRows` | Ekranda görünen sayfa dilimi |
| `expandedProduct` | Açık olan genişletilebilir ürün adı |
| `checked` | En az bir kez Kontrol Et yapıldı mı |

---

## 9. Tasarım Dili

CancelPanel `--cp-*` renk paleti kullanılır:

| Token | Kullanım |
|-------|----------|
| `--cp-primary` | Kanal fiyatları, vurgular |
| `--cp-ccs` | CCS fiyatları |
| `--cp-danger` | Fiyat farkı pill'leri |
| `--cp-heading`, `--cp-text` | Metin renkleri |

---

## 10. Geliştirme Notları

- **API entegrasyonu:** `handleCheck` içinde `getCatalogForBrand` yerine gerçek endpoint çağrısı yapılabilir; filtre ve tablo mantığı aynı kalır.
- **Hata yönetimi:** `App.jsx` içinde `RestaurantChannelErrorBoundary` ile sarılmıştır.
- **Geliştirme sunucusu:** `npm run dev` → `http://localhost:8080/`

---

## 11. Örnek Kullanıcı Senaryosu

1. Kanal ID: `172002`, Marka: `Burger King` → **Kontrol Et**
2. Listede AYRAN (53 / 50 → **3 TL**), WHOPPER (199 / 199 → kırmızı **—**) görünür
3. WHOPPER satırına tıkla → Ranch Sos (**8 TL**), Ayran 300ml (**5 TL**) listelenir
4. Ürün İsmi: `whop` yaz → WHOPPER ve WHOPPER MENÜ varyantları filtrelenir
5. **Dosya indir** → Tüm filtrelenmiş sonuçlar Excel'e aktarılır
