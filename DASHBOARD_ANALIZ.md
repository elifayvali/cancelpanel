# Online Kanallar Özet — Dashboard veri analizi

Bu belge, `CancelPanel` uygulamasındaki dashboard bileşenlerinin **hangi alanlarda hangi veriyi** kullandığını ve **nasıl hesaplandığını** özetler. Kaynak kod referansları: `channelDashboardModel.js`, `excelImport.js`, `RestaurantChannelStatus.jsx`, `BrandPerformanceCarousel.jsx`, `closeReasonExcelImport.js`.

---

## 1. Veri kaynağı ve satır modeli

### 1.1 Giriş

- Restoran satırları çoğunlukla **Excel birleştirme** ile (`mergeExcelFiles` → `excelImport.js`) üretilir.
- Her satır, panelde `baseRows` olarak tutulur; **Merkez Ofis** tüm satırları, **Grup Müdürü** rolünde yalnızca belirli `equipmentId` öneklerine uyan satırlar kullanılır.

### 1.2 Satır nesnesi (Excel eşlemesinden sonra)

| Alan | Excel / mantık özeti | Dashboard kullanımı |
|------|----------------------|---------------------|
| `id` | `globalId`, `equipment`, `restoran_id`, şehir, marka, `name` vb. birleşiminden türetilen benzersiz anahtar | Satır seçimi, birleştirme |
| `name` | `name`, yoksa marka·şehir, global, vb. | Tablo, arama |
| `globalId` | `global id`, `tbs_global`, … | Tablo, arama |
| `equipmentId` | `equipment`, yoksa `restoran_id` | Grup müdürü kapsamı, kapatma logu eşlemesi |
| `brand` | `marka`, `brand` | Tablo, filtre, **Marka Performans** gruplaması |
| `city` | `il`, `şehir`, `city`, … | Tablo, filtre |
| `homeDelivery` | `evlere servis`, `tbs_home` (0/1 → Hayır/Evet) | Tablo, filtre |
| `channels` | 9 kanal için `open` / `closed` / `na` dizisi (sıra `CHANNEL_LABELS` ile aynı) | Tüm kanal özetleri, tablo hücreleri, donut, kapalı toplamı, marka kartları |
| `kapaliKanalSayisi` | Opsiyonel sayısal sütunlar (`kapali_kanal_sayisi`, …) | **Şu an üst kartta kullanılmıyor**; kapalı toplamı kanal hücrelerinden hesaplanır |
| `satisAcikKanalSayisi`, `satisYapilabilirKanalSayisi` | Opsiyonel Excel sütunları | **Şu an özet donut’ta kullanılmıyor**; donut `buildDashboardJson` hesabına dayanır |
| `detail.closeReasons`, `detail.audit`, `detail.hours` | Kanal nedeni, kullanıcı/tarih, çalışma saatleri | Yardımcı / detay (ana metrikler `channels` üzerinden) |

---

## 2. Sabit kanal listesi

Dosya: `channelLabels.js` — `CHANNEL_LABELS` (sıra sabit, 1…9 indeks):

1. YemekSepeti  
2. YemekSepeti Express  
3. Trendyol  
4. Trendyol Go  
5. Getir  
6. Migros  
7. Sana Gelsin  
8. Gel Al  
9. Ara Gelsin  

Excel’de kanal sütunları bu sırayla eşlenir; başlık eşlemesi `getChannelCell` ve (varsa) `tbs_home` sonrası 9 sütunluk blok ile `extractChannelsNineColumnExport` içinde yapılır.

### 2.1 Hücre değeri → durum (`normalizeChannelState`)

Örnek: `açık` / `acik` / `open` / `evet` / `1` → `open`; `kapalı` / `closed` / `hayır` / `0` → `closed`; boş, `-`, `n/a`, `tanımlı değil` vb. → `na`. Özel metinler (ör. `kanalda_tanimli…`) kodda ayrı kurallarla sınıflandırılır.

Panel tarafında eksik indeksler `normalizeChannels` ile `na` tamamlanır (`RestaurantChannelStatus.jsx`).

---

## 3. `buildDashboardJson` (channelDashboardModel.js)

Tüm `rows` üzerinde:

- Her restoran için `channels` normalize edilir.
- **Satılabilir kanal sayısı (`satilabilir`)**: `na` **olmayan** her kanal hücresi 1 kez sayılır.
- **Açık kanal sayısı (`acik`)**: durumu `open` olan satılabilir hücreler.
- **Yüzde (`yuzde`)**: `satilabilir === 0` ise `0`; değilse `(acik / satilabilir) * 100`, **bir ondalık basamağa** yuvarlanır: `Math.round((acik / satilabilir) * 1000) / 10`.

Çıktı: `ozet.satisaAcikKanalSayisi.{ acik, satilabilir, yuzde }`, `kanal.etiketler`, `kanalEntegrasyonDurumlari.restoranlar` (ham satırlar).

---

## 4. Üst bant bileşenleri

### 4.1 Satışa Açık Kanal Oranı (donut)

- **Veri:** `dashboardJson.ozet.satisaAcikKanalSayisi.yuzde` (yukarıdaki formül).
- **Görsel:** SVG halka doluluğu yüzde ile orantılı; renk sınıfları yüzde eşiklerine göre (ör. ≥85 / ≥50 / altı — sınıf adları `rkd-stat-result--*`).
- **Not:** Donut, Excel’deki `Satis_Acik_Kanal_Sayisi` sütunlarından **doğrudan** okunmaz; her zaman kanal dizisinden türetilen özet kullanılır.

### 4.2 Toplam Kapalı Kanallar

- **Birincil veri:** Excel’deki **`Kapali_Kanal_Sayisi`** (ve `excelImport.js` içindeki alias’lar) ile satırlara yazılan **`kapaliKanalSayisi`** alanlarının **toplamı** (`baseRows` üzerinden).
- **Eksik sütun:** Hiçbir satırda `kapaliKanalSayisi` sayı olarak yoksa (ör. eski mock veri), **yedek:** tüm satırlarda kanal hücrelerinden `closed` sayımı (önceki davranış).
- **Alarm:** `totalClosedChannels >= 1000` iken kartta yanıp sönen kırmızı çerçeve (metin yok).

### 4.3 Marka Performans Analizi (carousel)

- **Gruplama:** `brand` alanı (boşsa `—`).
- **Her marka için:**
  - `sellable`: `na` olmayan kanal hücresi sayısı (tüm satırlar toplamı).
  - `open` / `closed`: ilgili durumların toplamı.
  - **Açık % (`openPct`):** `sellable === 0` → 0; değilse `(open / sellable) * 100`, bir ondalık: `Math.round((open/sellable)*1000)/10`.
  - **Kapalı sayı:** `closed` toplamı (kartta “Kapalı Sayı” olarak gösterilir).
- **Sıralama:** Önce `closedCount` azalan, eşitlikte marka adı (Türkçe locale).
- **Otomatik kaydırma:** Çok sayfalıysa 5 sn’de bir sonraki grup (`prefers-reduced-motion` açıksa kapalı).

### 4.4 Kanal Detayları — özet kartları

- **Kapsam satırları (`rowsForChannelSummary`):** `baseRows` + isim/globalId/marka/şehir/evlere servis filtreleri. **Kanal seçimi veya kanal durum filtresi bu özete uygulanmaz** (yorum satırında belirtildiği gibi özet, tablo kanal filtresinden bağımsız tutulur).
- **Seçili kanallar:** `selectedChannelIndices` (1 tabanlı), her kanal için:
  - `acik`: seçili kanal indeksinde `open` olan satır sayısı.
  - `kapali`: `closed` olan satır sayısı.
  - `tanimliDegil`: `na` (veya diğer) olan satır sayısı.
- Sayfa başına **3** kanal (`CHANNEL_SUMMARY_PAGE_SIZE`).

### 4.5 Üst bant yükseklik eşitleme

Sol sütun (donut + kapalı kart) yüksekliği ölçülür; Marka ve Kanal kartlarına CSS değişkeni ile aynı yükseklik verilir (taşmada içeride kaydırma).

---

## 5. Ana tablo (KANAL · entegrasyon durumları)

### 5.1 Kolonlar ve veri alanları

| Kolon | Veri kaynağı |
|--------|----------------|
| Restoran adı | `row.name` |
| Marka | `row.brand` |
| Şehir | `row.city` |
| Evlere servis | `row.homeDelivery` |
| Kanal 1…N | `normalizeChannels(row.channels)[i]` → durum ikonu (`open` / `closed` / `na`) |

Sütun genişlikleri `TABLE_COL_DEFAULT` + kullanıcı sürükleyerek değiştirilebilir (`ch0`, `ch1`, … anahtarları).

### 5.2 Tabloya uygulanan filtreler (`filteredRows`)

1. **Kanal seçimi boşsa:** satır gösterilmez (performans için).
2. **Tüm kanallar seçili değilse:** En az bir seçili kanalda durum `na` olmayan satırlar.
3. **Kanal durumu (`channelStatusFilter`):** Seçili kanalların (veya tümünün) alt kümesinde `open` / `closed` / `na` eşleşmesi.
4. Üstteki `rowsForChannelSummary` filtreleri (isim, global id, marka, şehir, evlere servis) tabloya da temel küme olarak girer.

---

## 6. Kapatma sebepleri (ayrı veri akışı)

- Olaylar `closeReasonEvents` (Excel import veya mock depolama) ile gelir; alanlar: `date`, `channelIndex`, `reason`, `equipmentId`, `closedBy`, vb.
- **Bloklar:** Tarih aralığı (`closeReasonRange`), seçili kanal filtresi ve rol kapsamı (grup müdüründe `baseRows` içindeki equipment’lar) ile süzülür.
- Kanal başına sebep sayımları; özet donut ilk 4 sebep + “Diğer”.
- Satır seçildiğinde kapatma logu popup’ı: aynı `equipmentId` olayları, kolonlar Tarih / Kanal / Kapama sebebi / Kapamayı yapan.

Detaylı Excel kolon eşlemesi: `closeReasonExcelImport.js`.

---

## 7. JSON dışa aktarım

`dashboardJsonToString(buildDashboardJson(baseRows))` ile mevcut `baseRows` için model JSON metin olarak üretilir (indirme / API benzeri kullanım).

---

## 8. Özet tablo: “Hangi metrik nereden?”

| Dashboard alanı | Hesaplama özü |
|-------------------|----------------|
| Donut % | Tüm satırlarda, `na` hariç kanallar üzerinden `açık / satılabilir` |
| Toplam kapalı | Tüm satırlarda `closed` kanal hücresi sayısı |
| Marka kartı açık % | Markaya göre gruplanmış aynı oran |
| Marka kartı kapalı | Markaya göre `closed` toplamı |
| Kanal özet kartları | Filtrelenmiş satır kümesinde, seçili kanal indeksine göre open/closed/na sayıları |
| Tablo hücreleri | Satırın `channels[i]` durumu |

**Kullanılmayan (şu an) Excel özet sütunları:** `kapali_kanal_sayisi`, `Satis_Acik_Kanal_Sayisi`, `Satis_Yapilabilir_Kanal_Sayisi` — modelde okunur ve satırda durur; üst özet grafikleri bunlara bağlı değildir.

---

*Belge, kodun anlık haline göre üretilmiştir; davranış değişirse `buildDashboardJson`, `totalClosedChannels`, `brandPerformanceSlides`, `channelSelectionSummary` ve `filteredRows` hesaplarını güncelleyin.*
