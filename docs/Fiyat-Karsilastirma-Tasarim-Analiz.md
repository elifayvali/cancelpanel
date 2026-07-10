# Fiyat Karşılaştırma Modülü — Tasarım ve Çalışma Mantığı Analizi

Bu doküman, CancelPanel uygulamasındaki **Fiyat Karşılaştırma** modülünün güncel tasarımını, iş akışlarını, veri modelini ve teknik mimarisini kapsamlı biçimde açıklar.

**Son güncelleme:** Temmuz 2026  
**Kapsam:** Restoran Tanımla · Platform Fiyat Karşılaştırma

---

## 1. Modül Özeti

Fiyat Karşılaştırma modülü iki alt ekrandan oluşur:

| Ekran | Amaç |
|-------|------|
| **Restoran Tanımla** | Restoranın kanal ID, marka, ülke ve fiyat bandı bilgilerini kaydetmek |
| **Platform Fiyat Karşılaştırma** | Seçilen restoran için Kanal ↔ CCS ürün ve opsiyon fiyatlarını karşılaştırmak |

```
CancelPanel
└── Fiyat Karşılaştırma (menü grubu)
    ├── Restoran Tanımla
    └── Platform Fiyat Karşılaştırma
```

Her iki ekran da ortak **CancelPanel tasarım dili** (`--cp-*` token'ları, `PriceComparison.css`) ve paylaşılan UI bileşenlerini (`PriceSelect`, `BRANDS`) kullanır.

---

## 2. Tasarım Dili

### 2.1 Renk paleti

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--cp-primary` | `rgb(76, 190, 217)` | Birincil butonlar, Kanal fiyatları, vurgular |
| `--cp-ccs` | Mor karışım | CCS fiyatları |
| `--cp-danger` | `rgb(223, 71, 71)` | Fiyat farkı pill badge'leri |
| `--cp-success` | `rgb(27, 201, 128)` | Başarı durumları |
| `--cp-heading` | `#1c2748` | Başlık metinleri |
| `--cp-text` | `rgb(101, 109, 129)` | Gövde metni |
| `--cp-muted` | `#7a849c` | İkincil metin |
| `--cp-bg` | `#f7f9fc` | Sayfa arka planı |
| `--cp-surface` | `#ffffff` | Kart ve tablo yüzeyleri |
| `--cp-border` | `#e2e8f0` | Çerçeveler |

### 2.2 Ortak UI bileşenleri

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| `PriceSelect` | `priceComparisonUi.jsx` | Özel dropdown (Marka, Ülke, Ürün Grubu vb.) |
| `pc-card` | `PriceComparison.css` | Ana içerik kartı |
| `pc-card__desc` | `PriceComparison.css` | Başlık altı açıklama (tek satır) |
| `pc-btn--primary` | `PriceComparison.css` | Turkuaz birincil buton |
| `pc-input` | `PriceComparison.css` | Metin giriş alanı |
| `pc-toggle` | `PriceComparison.css` | İki seçenekli toggle (Restoranda / Paket) |

### 2.3 Sayfa düzeni

```
┌─────────────────────────────────────────┐
│ Header: Fiyat Karşılaştırma             │
│ Breadcrumb: Dashboard / [Alt ekran]     │
├─────────────────────────────────────────┤
│ Kart başlığı                            │
│ Açıklama cümlesi (tek satır)            │
│                                         │
│ [Form / Toolbar]                        │
│ [Sonuç alanı]                           │
└─────────────────────────────────────────┘
```

---

## 3. Restoran Tanımla

### 3.1 Amaç

Bir restoranın kanal sistemi ile fiyat bandı eşleştirmesini kaydetmek. Bu kayıt, Platform Fiyat Karşılaştırma ekranında kullanılacak restoran/kanal bilgisinin temelini oluşturur.

**Açıklama metni:** *Marka, kanal ve fiyat bandı bilgilerini eşleştirerek restoran kaydı oluşturun.*

### 3.2 Form alanları

| Sıra | Alan | Tip | Zorunlu | Varsayılan | Not |
|------|------|-----|---------|------------|-----|
| 1 | **Ülke** | Dropdown | Evet | Türkiye | Türkiye, Kıbrıs |
| 2 | **Marka** | Dropdown | Evet | — | Burger King, Popeyes, Arby's |
| 3 | **Kanal ID** | Metin + autocomplete | Evet | — | Harf/rakam; öneri listesi |
| 4 | **Ürün Grubu** | Dropdown | Evet | — | 1001, 2000, 3000 bantları |
| 5 | **Fiyat Bandı** | Dropdown | Evet | — | Seçilen gruba bağlı |
| 6 | **Fiyat Bandı Tipi** | Toggle | Evet | **Paket** | Restoranda / Paket |

**Kaydet** butonu formu gönderir (eski adı: Eşleştir).

### 3.3 Bağımlı alan mantığı

```
Ürün Grubu seçilir
       │
       ▼
Fiyat Bandı listesi filtrelenir (groupId eşleşmesi)
       │
       ▼
Ürün Grubu değişirse uyumsuz Fiyat Bandı sıfırlanır
```

**Ürün grupları:**

| ID | Etiket |
|----|--------|
| 1001 | 1001 bant inline |
| 2000 | 2000 bant avm |
| 3000 | 3000 bant avm 1 |

**Fiyat bandları** (gruba göre):

| ID | Grup | Etiket |
|----|------|--------|
| 1002 | 1001 | 1002 paket 1 |
| 1003 | 1001 | 1003 paket 2 |
| 2002 | 2000 | 2002 paket 1 |
| 2003 | 2000 | 2003 paket 2 |
| 3002 | 3000 | 3002 paket 1 |
| 3003 | 3000 | 3003 paket 2 |

### 3.4 Kanal ID autocomplete

Kanal ID alanına odaklanıldığında öneri listesi açılır:

- **Boşken:** İlk 5 kayıtlı restoran
- **Yazarken:** Kanal ID, marka veya caption içinde arama (max 6 sonuç)
- **Seçimde:** Marka, ürün grubu, fiyat bandı, band tipi otomatik doldurulur

Veri kaynağı: mock restoran havuzu + `localStorage` kayıtları.

### 3.5 Kayıt akışı

```
[Kaydet] tıkla
    │
    ▼
Validasyon (tüm zorunlu alanlar)
    │
    ▼
localStorage'a kaydet (max 50 kayıt)
    │
    ▼
Toast: "Restoran eşleştirmesi kaydedildi."
```

**localStorage anahtarı:** `price-comparison-restaurant-matches`

Kaydedilen alanlar: `country`, `brand`, `channelId`, `productGroup`, `priceBand`, `bandType`, etiketler, `savedAt`.

### 3.6 Ekran akış diyagramı

```
┌──────────────┐
│ Form açılır  │
│ Ülke: TR     │◄── varsayılan
│ Band tipi:   │◄── Paket varsayılan
│   Paket      │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────┐
│ Alanları     │────►│ Kanal ID    │
│ doldur       │     │ autocomplete│
└──────┬───────┘     └─────────────┘
       │
       ▼
   [Kaydet]
       │
       ▼
┌──────────────┐
│ localStorage │
│ + toast      │
└──────────────┘
```

---

## 4. Platform Fiyat Karşılaştırma

### 4.1 Amaç

Seçilen kanal restoranı ve marka için **Kanal** (sipariş platformu) ile **CCS** (merkezi fiyat sistemi) arasındaki ürün ve opsiyon fiyatlarını karşılaştırmak. Yalnızca fiyat farkı olan kayıtlar listelenir.

**Açıklama metni:** *Kanal restoranı ve markasını seçerek, kanal ile CCS arasındaki ürün ve opsiyon fiyatlarını karşılaştırın.*

### 4.2 Aşamalı arayüz

Ekran iki aşamada çalışır:

#### Aşama 1 — Sorgu (Kontrol Et öncesi)

| Alan | Zorunlu |
|------|---------|
| Restoran Kanal ID | Evet |
| Marka | Evet |

Görünür: Kanal ID, Marka, **Kontrol Et** butonu  
Gizli: Ürün İsmi, NCR ID filtreleri  
Mesaj: *Kanal ID ve marka girip Kontrol Et ile karşılaştırmayı başlatın.*

#### Aşama 2 — Sonuç (Kontrol Et sonrası)

Ek olarak görünür:
- Ürün İsmi filtresi
- NCR ID filtresi
- Eşleşmeyen ürün bilgisi kutusu
- Sonuç tablosu
- Sayfalama + Dosya indir

### 4.3 Kontrol Et akışı

```
[Kontrol Et]
     │
     ├─ Kanal ID boş? ──► Hata mesajı
     ├─ Marka seçilmedi? ──► Hata mesajı
     │
     ▼
Mock katalog yükle (markaya göre)
     │
     ▼
filterDiffRows() — yalnızca farklı ürünler
     │
     ▼
baseRows = sonuç listesi
checked = true
     │
     ▼
Eşleşmeyen ürün modalı otomatik açılır
Filtre satırı görünür hale gelir
```

**Sıfırlama:** Kanal ID veya marka değiştiğinde sonuçlar temizlenir (`checked = false`, `baseRows = null`).

### 4.4 Filtreleme kuralları

| Filtre | Ne zaman aktif | Kural |
|--------|----------------|-------|
| **Ürün İsmi** | Kontrol Et sonrası | Herhangi bir karakter; kısmi eşleşme; büyük/küçük harf duyarsız |
| **NCR ID** | Kontrol Et sonrası | Min. 3 rakam; yalnızca rakam girişi; rakam eşleşmesi |

Filtreler istemci tarafında anlık çalışır; yeniden sorgu gerekmez.

```
baseRows
    │
    ├─ filterProductRows(productName, ncrId)
    │
    ▼
rows (filtrelenmiş)
    │
    ├─ slice(page, pageSize)
    │
    ▼
paginatedRows (ekranda görünen)
```

### 4.5 Hangi ürünler listelenir?

`filterDiffRows` iki koşuldan birini sağlayan ürünleri dahil eder:

1. **Ana ürün farkı:** `channelPrice ≠ ccsPrice`
2. **Opsiyon farkı:** Genişletilebilir ürün (WHOPPER / WHOPPER MENÜ) ve en az bir opsiyonunda fiyat farkı var

Bu sayede ana fiyatı eşit ama opsiyonları farklı ürünler (ör. WHOPPER) listede kalır.

### 4.6 Sonuç tablosu

Dört sütunlu grid:

| Sütun | Renk | Açıklama |
|-------|------|----------|
| Ürün Adı | Koyu gri | Ana ürün; genişletilebilirlerde ok ikonu |
| Kanalda Tanımlı Fiyat | Turkuaz (`--cp-primary`) | Kanal tarafı fiyat |
| CCS'te Tanımlı Fiyat | Mor (`--cp-ccs`) | CCS tarafı fiyat |
| Fiyat Farkı | Kırmızı pill | Mutlak fark değeri |

**Grid oranı:** `2fr 3fr 3fr 2fr`

### 4.7 Fiyat farkı hesabı

```
fark = |kanalFiyatı − ccsFiyatı|
```

| Durum | Gösterim | Renk |
|-------|----------|------|
| Fark var | `8 TL`, `3 TL` | Kırmızı |
| Fark yok | `—` | Gri |
| Ana eşit, opsiyon farklı | `—` | Kırmızı (`highlightOnly`) |

Artı/eksi işareti kullanılmaz; yalnızca mutlak değer gösterilir.

### 4.8 Genişletilebilir ürünler

| Ürün | Koşul | Opsiyon kaynağı |
|------|-------|-----------------|
| WHOPPER | Tam ad eşleşmesi | `WHOPPER_OPTIONS` |
| WHOPPER MENÜ | Adında "WHOPPER MENÜ" geçenler | `WHOPPER_MENU_OPTIONS` |

Satıra tıklanınca opsiyonlar açılır. **Yalnızca fiyat farkı olan opsiyonlar** listelenir.

#### WHOPPER opsiyonları

| Opsiyon | Kanal | CCS | Fark |
|---------|-------|-----|------|
| Ranch Sos | 10,00₺ | 2,00₺ | 8 TL |
| Ayran (Büyük - 300ml) | 55,00₺ | 50,00₺ | 5 TL |

#### WHOPPER MENÜ opsiyonları

Yan ürün, içecek, promosyon grupları altında tanımlıdır. Kategori başlıkları UI'da gösterilmez; yalnızca farkı olan opsiyonlar düz liste halinde görünür.

### 4.9 Mock veri — özel ürün fiyatları

| Ürün | Kanal | CCS | Not |
|------|-------|-----|-----|
| AYRAN | 53 TL | 50 TL | Sabit |
| WHOPPER | 199 TL | 199 TL | Eşit; opsiyonlarda fark |
| WHOPPER MENÜ* | 299 TL | 299 TL | Eşit; menü opsiyonlarında fark |
| Diğer ürünler | Formül | Formül | Genelde farklı |

NCR ID örnekleri: `1001`, `3001`, `1002`, `3002`, `2001`, `3003`

### 4.10 Sayfalama ve Excel

**Sayfalama:**
- Varsayılan 10 sonuç/sayfa (10, 25, 50)
- Filtre veya sayfa boyutu değişince sayfa 1'e döner
- Sayfa değişince açık genişletilmiş ürün kapanır

**Dosya indir:**
- Filtrelenmiş **tüm** satırları Excel'e aktarır
- Genişletilebilir ürünlerin opsiyonları girintili alt satır olarak eklenir
- NCR ID'lerden harf ve özel karakterler temizlenir (yalnızca rakam)
- Dosya adı: `platform-fiyat-karsilastirma-{tarih-saat}.xlsx`

### 4.11 Eşleşmeyen ürün bilgisi

Kontrol Et sonrası tablonun üstünde bilgi kutusu görünür. Tıklanınca modal açılır.

Mock örnek: *"Double Cheeseburger CCS'te bulunamadı"*

Bu alan kanalda olup CCS'te eşleşmeyen ürünleri bildirmek içindir.

### 4.12 Ekran akış diyagramı

```
┌─────────────────┐
│ Kanal ID + Marka│
└────────┬────────┘
         │
    [Kontrol Et]
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ baseRows        │────►│ Eşleşmeyen ürün  │
│ (farklı ürünler)│     │ bilgisi kutusu   │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Filtre satırı   │◄── Kontrol Et sonrası görünür
│ Ürün İsmi       │
│ NCR ID          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4 sütunlu tablo │
│ + genişletme    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sayfalama       │
│ Dosya indir     │
└─────────────────┘
```

---

## 5. Modüller Arası İlişki

```
Restoran Tanımla                    Platform Fiyat Karşılaştırma
─────────────────                   ────────────────────────────
Ülke, Marka, Kanal ID        ──►     Kanal ID + Marka (sorgu)
Ürün Grubu, Fiyat Bandı              Ürün fiyat karşılaştırması
Band Tipi (Paket/Restoranda)
        │
        ▼
  localStorage kayıt
        │
        ▼
  Kanal ID autocomplete havuzu
```

Şu an iki ekran **doğrudan veri paylaşmaz**; Restoran Tanımla kayıtları yalnızca Kanal ID autocomplete havuzuna katkı sağlar. Platform karşılaştırma mock katalog kullanır.

---

## 6. Teknik Mimari

### 6.1 Dosya yapısı

```
src/
├── DefineRestaurant.jsx           # Restoran Tanımla ekranı
├── PlatformPriceComparison.jsx    # Platform karşılaştırma ana ekranı
├── PlatformComparisonToolbar.jsx  # Sorgu formu + filtre satırı
├── PlatformProductResults.jsx     # 4 sütunlu tablo + opsiyon satırları
├── PlatformResultsPagination.jsx  # Sayfalama + Dosya indir
├── PlatformMissingInfo.jsx        # Eşleşmeyen ürün kutusu/modal
├── platformPriceComparisonMock.js # Mock katalog, filtreler
├── platformPriceExport.js         # Excel dışa aktarma
├── priceDiff.js                   # Fark hesabı
├── whopperMenuOptionsData.js      # WHOPPER opsiyon verileri
├── priceComparisonUi.jsx          # Paylaşılan UI (PriceSelect, BRANDS)
└── PriceComparison.css            # Tasarım token'ları ve stiller
```

### 6.2 State özeti — Platform Karşılaştırma

| State | Açıklama |
|-------|----------|
| `channelId`, `brand` | Zorunlu sorgu parametreleri |
| `productName`, `ncrId` | Opsiyonel anlık filtreler |
| `baseRows` | Kontrol Et sonrası farklı tüm ürünler |
| `rows` | baseRows + filtre |
| `paginatedRows` | Ekranda görünen sayfa |
| `expandedProduct` | Açık genişletilebilir ürün |
| `checked` | Kontrol Et yapıldı mı |

### 6.3 State özeti — Restoran Tanımla

| State | Varsayılan | Açıklama |
|-------|------------|----------|
| `country` | Türkiye | Ülke seçimi |
| `brand` | — | Marka |
| `channelId` | — | Kanal ID |
| `productGroup` | — | Ürün grubu |
| `priceBand` | — | Fiyat bandı |
| `bandType` | paket | Restoranda / Paket |

### 6.4 Veri kaynağı durumu

| Ekran | Veri kaynağı | API |
|-------|--------------|-----|
| Restoran Tanımla | Mock + localStorage | Hayır |
| Platform Karşılaştırma | Mock katalog | Hayır |
| Eşleşmeyen ürünler | Sabit mock liste | Hayır |

---

## 7. Validasyon Kuralları Özeti

### Restoran Tanımla

| Alan | Kural |
|------|-------|
| Ülke | Seçilmeli |
| Marka | Seçilmeli |
| Kanal ID | Boş olamaz; harf/rakam |
| Ürün Grubu | Seçilmeli |
| Fiyat Bandı | Seçilmeli; gruba uygun |
| Fiyat Bandı Tipi | Seçilmeli; varsayılan Paket |

### Platform Karşılaştırma

| Alan | Kural |
|------|-------|
| Restoran Kanal ID | Boş olamaz; harf/rakam |
| Marka | Seçilmeli |
| Ürün İsmi | Opsiyonel; anlık filtre |
| NCR ID | Opsiyonel; min 3 rakam; yalnızca rakam |

---

## 8. Kullanıcı Senaryoları

### Senaryo A — Restoran kaydı

1. **Restoran Tanımla** ekranını aç
2. Ülke: **Türkiye** (varsayılan), Band tipi: **Paket** (varsayılan)
3. Marka: **Burger King**, Kanal ID: **172002**
4. Ürün Grubu: **1001 bant inline**, Fiyat Bandı: **1002 paket 1**
5. **Kaydet** → Toast mesajı

### Senaryo B — Fiyat karşılaştırma

1. **Platform Fiyat Karşılaştırma** ekranını aç
2. Kanal ID: **172002**, Marka: **Burger King** → **Kontrol Et**
3. Eşleşmeyen ürün modalını kapat
4. Tabloda AYRAN (**3 TL** fark), WHOPPER (kırmızı **—**) görünür
5. WHOPPER satırını genişlet → Ranch Sos (**8 TL**), Ayran 300ml (**5 TL**)
6. Ürün İsmi: `whop` yaz → filtrele
7. NCR ID: `1001` yaz → filtrele
8. **Dosya indir** → Excel'e aktar

### Senaryo C — Kanal ID autocomplete

1. Restoran Tanımla'da Kanal ID alanına tıkla
2. Öneri listesinden **172015 · Popeyes · Ataşehir** seç
3. Marka, ürün grubu, fiyat bandı otomatik dolar
4. **Kaydet**

---

## 9. Geliştirme ve Entegrasyon Notları

### 9.1 API entegrasyonu (planlanan)

| Nokta | Mevcut | Hedef |
|-------|--------|-------|
| Restoran kayıt | localStorage | Backend REST API |
| Fiyat kataloğu | Mock | Kanal ID + Marka ile API sorgusu |
| Eşleşmeyen ürünler | Sabit liste | API yanıtından |
| Excel export | İstemci tarafı | Aynı kalabilir |

### 9.2 Hata yönetimi

Platform Fiyat Karşılaştırma ekranı `RestaurantChannelErrorBoundary` ile sarılıdır; render hatalarında kullanıcıya anlamlı mesaj gösterilir.

### 9.3 Geliştirme ortamı

```bash
cd CancelPanel
npm run dev
# → http://localhost:8080/
```

---

## 10. İlgili Dokümanlar

| Doküman | İçerik |
|---------|--------|
| `docs/Fiyat-Karsilastirma-Tasarim-Analiz.md` | Bu doküman — kapsamlı tasarım analizi |
| `docs/Platform-Fiyat-Karsilastirma.md` | Platform ekranı teknik detayları |

---

*CancelPanel · Fiyat Karşılaştırma Modülü · Tasarım Analizi*
