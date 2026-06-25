# Mail İletilen Hata Bildirimleri — Kanal Sipariş Hata Listesi (Panel Tanımı)

## 1. Özet

Mail ile iletilen kanal sipariş hatalarının müşteri / operasyon ekipleri tarafından **web panelde** sorgulanması, filtrelenmesi ve detayının görüntülenmesi hedeflenmektedir.

Bu doküman, **CancelPanel** prototipindeki **Kanal Sipariş Hataları** ekranının güncel işleyişini tanımlar. CancelPanel, müşteriye verilecek **asıl ürünün ekran ve kabul kriteri referansıdır**; mock veri ve istemci tarafı filtreleme üretim öncesi davranış örneğidir.

| | |
|---|---|
| **Prototip (kod)** | [github.com/elifayvali/cancelpanel](https://github.com/elifayvali/cancelpanel) |
| **ADO Wiki** | [Mail İletilen Hata Bildirimleri (Kanal Sipariş Hata Listesi)](https://dev.azure.com/ZeniaProjects/Hospitality/_wiki/wikis/OnlineChannels.wiki/2659/Mail-%C4%B0letilen-Hata-Bildirimleri-%28Kanal-Sipari%C5%9F-Hata-Listesi%29) |
| **Wiki metni (kopya)** | [`docs/wiki/Mail-İletilen-Hata-Bildirimleri-(Kanal-Sipariş-Hata-Listesi).md`](wiki/Mail-İletilen-Hata-Bildirimleri-(Kanal-Sipariş-Hata-Listesi).md) |
| **Teams** | Cancelpanel iptal bildirimleri (iş paketi mutabakatı) |

---

## 2. CancelPanel ile asıl işin ilişkisi

- **CancelPanel:** Hedef panelin UI, filtreler, tablo ve detay popup düzeninin somut prototipi.
- **Asıl yapılacak iş:** Gerçek API entegrasyonu, müşteri kimliği/yetkisi, sunucu tarafı sayfalama, audit, loglama ve operasyonel süreçlerin üretime alınması.
- Prototip tek başına “tamamlandı” anlamına gelmez; **ürünün görünür yüzü ve kabul kriterlerinin taşıyıcısıdır**.

---

## 3. Uygulama yapısı (menü)

Sol menü + üst çubuk + ana içerik.

| Menü | Durum |
|------|--------|
| **Kanal Sipariş Hataları** | Aktif — bu dokümanın ana konusu |
| **Restoran Kanal Durumu** | Aktif — kanal açık/kapalı (kapsam daraltılabilir) |
| Dashboard, Sipariş Özeti, Sipariş Arama, … | Yer tutucu (boş panel) |

Menü daraltılabilir. Üst barda örnek kullanıcı bilgisi gösterilir (statik; gerçek oturum yok).

---

## 4. Kanal Sipariş Hataları — ekran işleyişi

### 4.1 Veri kaynağı

- Varsayılan: **mock** veri (`useMock`).
- Canlı API: entegrasyonla açılabilir (`useMock={false}`).
- Metin araması ve türetilmiş alanlar (hata kaynağı vb.) istemci tarafında filtrelenir.

### 4.2 Hata sebebi tipleri

Açılışta **hiçbir hata sebebi seçili değildir** → **tüm tipler** listelenir (marka/kanal ile aynı mantık).

| Teknik id | Ekranda (Hata sebebi) |
|-----------|------------------------|
| `order-inject-error` | Ürün Mutfağa Gönderilemedi |
| `main-product-not-found` | Ana Ürün Eşleşmedi |
| `sub-product-not-found` | Alt ürün/Opsiyon Bulunamadı |
| `remote-code-null` | Kanal Eksik/Hatalı Mapping |

### 4.3 Filtreler

Filtre değişince liste **otomatik güncellenir**. **«Ara» düğmesi yoktur.** **Yenile** ikonu aynı filtrelerle listeyi tekrar yükler.

Tüm çoklu seçim dropdown’larında panel üstünde:

- **Select all** — menüdeki tüm seçenekleri işaretler  
- **Remove all** — tüm seçimleri kaldırır (boş = “tümü” anlamında, marka/kanal/hata sebebi için)

| Filtre | Davranış |
|--------|----------|
| **Hata sebebi** | Çoklu seçim. Boş = tüm sebepler. |
| **Marka** | Çoklu seçim. Boş = tüm markalar. |
| **Kanal** | Çoklu seçim. Boş = tüm kanallar. |
| **Hata kaynağı** | Çoklu seçim: CRM, Platform, Platform / CRM. Boş = tüm kaynaklar. |
| **Ürün kodu** | Metin. Birden fazla kod **virgül** veya **noktalı virgül** ile (ör. `47821;36677`, `33087, 114006`). Çoklu kod: **OR**, tam eşleşme. Tek kod: kısmi arama. ~**400 ms** gecikme. |
| **Hata detaylarında ara** | Metin. Boşlukla ayrılmış kelimelerin **hepsi** şu alanlarda geçmeli: **hata tipi**, **hata kaynağı**, **ürün kodu**, **hata mesajı detayı**. ~**400 ms** gecikme. |
| **Başlangıç / Bitiş** | Tarih aralığı; değişince **anında** uygulanır. |

**Gecikme özeti:** Dropdown, tarih → anında. Ürün kodu ve hata detaylarında ara → ~400 ms (her tuşta istek gitmez).

### 4.4 Sonuç tablosu

| Sütun |
|-------|
| Marka |
| Kanal |
| Hata tipi |
| Hata Kaynağı |
| Ürün Kodu |
| Hata Mesajı Detayı |
| Sipariş tarihi |
| Sipariş Dcid |
| Platform Id |
| Detay (**Detayı görüntüle**) |

- **Sayfalama:** Alt bölüm — sayfa boyutu, önceki/sonraki.
- **Excel:** Filtrelenmiş sonuç kümesi dışa aktarılır.

### 4.5 Hata Detayı popup

**Detayı görüntüle** (ve Restoran Kanal Durumu’nda satır tıklama) ortak **Hata Detayı** düzenini açar:

1. Kırmızı **!** + **Hata Detayı** başlığı, sağ üst **×**
2. **SİPARİŞ DCID**, **PLATFORM ID** (gri pill), **KANAL**, **MARKA**, **SİPARİŞ TARİHİ**
3. Çerçeveli **Hata Mesajı** kutusu (satıra özel)
4. Gri kutu: sabit açıklama + **Hata Sebepleri** (3 madde, kırmızı nokta listesi)

**Kapanma:** dışarı tıklama, **×**, **Esc**.

Kanal Sipariş Hataları satırından alanlar: `orderDcid`, `platformId`, `channel`, `brand`, sipariş tarihi, `buildErrorMessage`.

---

## 5. Restoran Kanal Durumu (kısa)

- Kanal açık/kapalı tablo ve özet widget’lar.
- Çok kelimeli arama; marka, şehir, kanal, durum filtreleri.
- Satır tıklanınca aynı **Hata Detayı** popup.
- Mock: Excel yükleme, tarayıcı **localStorage** (cihaza özel).

---

## 6. Üretim hedefi

| # | Başlık |
|---|--------|
| 1 | Mail / bildirim pipeline ile API veya event entegrasyonu |
| 2 | Müşteri oturumu, rol, marka/şube veri sınırı |
| 3 | Sunucu tarafı sayfalama, audit, loglama, performans |
| 4 | Müşteri dokümantasyonu, eğitim, kabul testleri |

**Üretimde netleştirilecekler:**

- Boş hata sebebi = tüm tipler → API sözleşmesi  
- Çoklu ürün kodu ve metin arama → sunucu sorgu parametreleri  
- Mock yerine yetkili canlı veri  

---

## 7. Prototip değişiklik özeti

| Özellik |
|---------|
| Türkçe hata sebebi başlıkları |
| Hata kaynağı filtresi (CRM / Platform / Platform / CRM) |
| Otomatik filtre; Ara kaldırıldı |
| Ürün kodu: virgül ve `;` ile çoklu arama |
| Dropdown Select all / Remove all |
| Ortak Hata Detayı popup (`HataDetayPanel` + sabit bilgi kutusu) |
| Hata detaylarında ara: yalnızca hata tipi, kaynak, ürün kodu, mesaj |
| Hata sebebi açılışta boş = tüm tipler |

---

*Son güncelleme: CancelPanel `main` dalı — Kanal Sipariş Hataları ekranı.*
