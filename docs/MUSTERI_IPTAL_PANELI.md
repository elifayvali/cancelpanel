# Müşteri İptal / Kanal Hata Paneli — Çalışma Tanımı

## Referans

İş paketi ve bağlam için Teams görüşmesi / sohbet bağlantısı:

[Teams — Cancelpanel iptal bildirimleri (chat bağlantısı)](https://teams.microsoft.com/l/message/19:7e6b13fc-6709-4b9f-83bb-60bf2f0302e8_c05bb300-c823-456a-9029-d63ae37d8684@unq.gbl.spaces/1778768414868?context=%7B%22contextType%22%3A%22chat%22%7D)

Bu bağlantıdaki mutabakat doğrultusunda, **belirtilen yapıda mail ile gönderilen iptaller** (ve ilişkili kanal sipariş hataları) için müşteriye teslim edilecek **self-servis / operasyon paneli** tanımlanmaktadır.

## Bu panel neyi temsil ediyor?

- **Hedef ürün:** Müşterinin, iptal ve kanal sipariş hata süreçlerini kendi tarafında takip edebileceği, filtreleyebileceği ve detay görebileceği **web paneli**.
- **Veri kaynağı:** İptal ve hata bildirimleri, anılan mail / bildirim mimarisi ile üretilen kayıtlarla uyumlu olacak şekilde beslenecektir (mock veri yerine üretim API’leri ve yetkilendirme).

## Bu repodaki CancelPanel ile ilişki

Bu depodaki **CancelPanel** uygulaması (Vite + React), yukarıdaki hedefe göre:

- **Yapılacak asıl çalışmanın ekran ve akış referansıdır** — yani müşteriye verilecek panelin işlev ve bilgi mimarisinin somutlaştırılmış halidir.
- Şu anki sürümde **mock veri**, **yerel Excel yükleme** ve **istemci tarafı filtreleme** gibi geliştirme kolaylıkları bulunur; bunlar üretim panelinin **davranış prototipi** olarak düşünülmelidir.
- **Asıl yapılacak iş**, bu arayüzün arkasına gerçek servislerin bağlanması, müşteri kimliği / yetkisi, gözlemlenebilirlik, SLA ve operasyonel süreçlerin netleştirilmesidir — tek başına bu repo “bitti” anlamına gelmez; **ürünün görünür yüzü ve kabul kriterlerinin taşıyıcısıdır**.

Özet cümle: **CancelPanel = müşteri panelinin yapılacak işe göre şekillendirilmiş UI ve kullanım senaryosu örneği; teslim edilecek “asıl iş” ise bu deneyimin güvenli, ölçeklenebilir ve entegre bir ürün olarak hayata geçirilmesidir.**

## Panelde öne çıkan işlev alanları (referans)

Aşağıdakiler, müşteri paneli kapsamı için **referans ekranlar** olarak ele alınmalıdır (detaylar kod ve ekranlarla evrilebilir):

| Alan | Açıklama |
|------|----------|
| Kanal sipariş hataları | Hata sebebi, marka, kanal, hata kaynağı, ürün kodu, tarih aralığı ve metin araması ile listeleme; satır detayında **Hata Detayı** popup düzeni. |
| Restoran kanal durumu | Kanal açık/kapalı özetleri, mock/Excel ile beslenen operasyon görünümü (müşteri ihtiyacına göre kapsam daraltılabilir veya ayrı modül olabilir). |
| Hata detayı | Sabit açıklama metinleri ve sipariş bağlamı (DCID, platform, kanal, marka, tarih, hata mesajı) ile tutarlı gösterim. |

## Ekranın nasıl çalıştığı (mevcut CancelPanel uygulaması)

### Genel yerleşim ve menü

- Uygulama **sol menü + üst çubuk + ana içerik** düzenindedir.
- Sol menüde birçok başlık (Dashboard, Sipariş Özeti, Sipariş Arama vb.) bulunur; **şu an gerçek panel içeriği yalnızca iki menüde açılır:**
  - **Restoran Kanal Durumu** → restoran / kanal durumu ekranı.
  - **Kanal Sipariş Hataları** → kanal sipariş hata listesi ve filtreler.
- Diğer menü öğelerine tıklandığında ana alan **boş / yer tutucu** panel olarak kalır (ileride doldurulabilir veya müşteri kapsamında gizlenebilir).
- Menü **daraltılabilir** (hamburger); üst barda örnek kullanıcı bilgisi gösterilir (statik; gerçek oturum yoktur).

### Kanal Sipariş Hataları ekranı

1. **Veri kaynağı:** Varsayılan olarak **mock** üretilmiş veri kullanılır. Uygulama `ChannelOrderErrors` bileşeninde `useMock` ile kontrol edilir; canlı API kullanımı entegrasyonla açılabilir.
2. **Filtreler (üst bant):** Değerleri seçip yazdıktan sonra sonuçların güncellenmesi için **«Ara»** düğmesine basılır (yazarken anında sunucuya gitmez; uygulanan filtre ile liste yenilenir). Yanındaki **yenile** ikonu aynı filtrelerle veriyi tekrar yükler.
   - **Hata sebebi:** Çoklu seçim; her kutu Türkçe başlıkla bir hata tipini temsil eder (ör. Ürün Mutfağa Gönderilemedi, Ana Ürün Eşleşmedi, …).
   - **Marka / Kanal / Hata kaynağı:** Çoklu seçim listeleri; hiç seçilmezse o eksende filtre uygulanmaz (tümü anlamında).
   - **Ürün kodu:** Metin; ilgili hata tipindeki ürün kodu alanında **içerir** araması (Türkçe büyük/küçük harf duyarsız).
   - **Hata detaylarında ara:** Boşlukla ayrılan kelimelerin **hepsi**, satırda yalnızca **hata tipi adı, hata kaynağı rozeti metni, ürün kodu ve hata mesajı detayı** birleşiminde geçmelidir (marka / DCID / platform gibi alanlarda aramaz).
   - **Başlangıç–Bitiş tarihi:** Tarih aralığına göre kayıtlar süzülür.
3. **Liste:** Tabloda marka, kanal, hata tipi, hata kaynağı, ürün kodu, mesaj, sipariş tarihi, DCID, platform id ve **Detayı görüntüle** bağlantısı yer alır.
4. **Detay:** Satırdaki **Detayı görüntüle** veya ilgili eylem, tam ekran üstü **Hata Detayı** penceresini açar: sipariş alanları, kırmızı başlıklı **Hata Mesajı** kutusu ve altta **sabit** bilgilendirme metni (hata sebepleri maddeleri). Dışarı tıklama, **×** veya **Esc** ile kapanır.
5. **Sayfalama:** Alt bölümde sayfa boyutu ve önceki/sonraki sayfa ile gezinilir.
6. **Excel:** Mevcut filtrelenmiş sonuç kümesi dışa aktarılabilir.

### Restoran Kanal Durumu ekranı

1. **Amaç:** Restoranların kanallara göre açık/kapalı (ve özet) durumlarının tabloda ve üst özet widget’larda izlenmesi.
2. **Arama ve filtreler:** İsim / global id ve diğer görünür alanlarda **çok kelimeli** arama; marka, şehir, kanal seçimi ve kanal durumu filtreleri birlikte çalışır. Kanal seçimi yoksa tablo bilinçli olarak boşaltılır (performans için).
3. **Satır tıklama:** Bir restoran satırına tıklanınca **Hata Detayı** popup’ı açılır; içerik son kapama kaydından ve satır alanlarından türetilir (sipariş DCID, platform, kanal, marka, tarih, mesaj + aynı sabit alt metin).
4. **Mock veri:** Excel ile örnek restoran verisi yüklenebilir; kapama sebepleri için ayrı mock yükleme alanları vardır. Veriler tarayıcı **localStorage** ile saklanabilir (cihaza özeldir).

### Üretim paneline taşırken dikkat

- Bugünkü davranış **istemci tarafında birleşik filtreleme ve mock** ağırlıklıdır; müşteri panelinde **sunucu tarafı yetki, sayfalama ve audit** netleştirilmelidir.
- Menüde görünen ama içi boş olan maddeler, müşteri sözleşmesine göre ya geliştirilecek ya da gizlenecek şekilde ürünleştirilmelidir.

## Önerilen “asıl çalışma” başlıkları (ürün / mühendislik)

1. **Entegrasyon:** Mail / bildirim pipeline’ı ile aynı şemada API veya event tüketimi.
2. **Kimlik ve yetki:** Müşteri kullanıcıları için oturum, rol ve veri sınırı (yalnızca kendi marka/şube verisi vb.).
3. **Üretim kalitesi:** Hata yönetimi, loglama, performans, sayfalama ve gerçek tarih aralığı sorguları.
4. **Teslim:** Müşteri dokümantasyonu, eğitim ve kabul testleri (bu MD + Teams bağlamı ile hizalanmış kabul kriterleri).

---

*Bu dosya, Teams’teki Cancelpanel sohbeti ile depodaki mevcut panel arasında köprü kurmak ve “panel = yapılacak işin görünür tanımı” ilkesini netleştirmek için oluşturulmuştur.*
