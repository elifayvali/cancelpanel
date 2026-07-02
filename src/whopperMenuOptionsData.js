/** WHOPPER MENÜ opsiyon grupları ve alt ürünler (mock) */

export function formatSalePrice(amount) {
  const value = Number(amount ?? 0)
  return (
    value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '₺'
  )
}

function item(name, channelPrice = 0, ccsPrice = channelPrice) {
  return { name, channelPrice, ccsPrice }
}

export const WHOPPER_MENU_OPTIONS = [
  {
    id: 'yan-urun',
    name: 'Yan Ürün',
    items: [
      item('Fırında Patates'),
      item('Parça Çikolatalı Kurabiye'),
      item('Duble Çikolatalı Kurabiye'),
      item('Üzümlü Yulaflı Kurabiye'),
      item('Yer Fıstıklı Kurabiye'),
      item('Winterberry Kurabiye'),
      item('Limonlu Hindistan Cevizli Kurabiye'),
    ],
  },
  {
    id: 'icecek',
    name: 'İçecek Seçimi',
    items: [
      item('Coca - Cola Zero Sugar (33 cl.)'),
      item('Coca - Cola (33 cl.)'),
      item('Coca - Cola Light (33 cl.)'),
      item('Fanta (33 cl.)'),
      item('Ayran (30 cl.)', 0, 5),
      item('Soda (20 cl.)'),
      item('Sprite (33 cl.)'),
      item('Cappy Şeftali (33 cl.)'),
      item('Cappy Karışık (33 cl.)'),
      item('Ice Tea Şeftali (33 cl.)'),
      item('Ice Tea Limon (33 cl.)'),
      item('Milkshake Çikolata', 0, 10),
      item('Milkshake Vanilya'),
      item('Su (33 cl.)'),
      item('Powerade (50 cl.)', 0, 8),
      item('Fuse Tea Mango Ananas'),
      item('Limonata (33 cl.)'),
    ],
  },
  {
    id: 'promo-yan',
    name: 'Promosyon Yan Ürün',
    items: [
      item('Promosyon Yan Ürün İstemiyorum'),
      item('Fırında Patates', 65, 60),
      item('Parça Çikolatalı Kurabiye', 55, 55),
      item('Yer Fıstıklı Kurabiye', 55, 50),
      item('Üzümlü Yulaflı Kurabiye', 55, 55),
      item('Duble Çikolatalı Kurabiye', 55, 52),
      item('Antep Fıstıklı Kruvasan', 90, 85),
      item('Winterberry Kurabiye', 55, 55),
      item('Limonlu Hindistan Cevizli Kurabiye', 55, 48),
    ],
  },
  {
    id: 'promo-dondurma',
    name: 'Promosyon Dondurma',
    items: [
      item('Promosyon Dondurma İstemiyorum'),
      item("Algida Carte d'Or Mini Cup Meyve Rüyası (110 ml.)", 55, 55),
      item("Algida Carte d'Or Çikolata Rüyası Cup (110 ml.)", 55, 50),
      item('Algida Maraş Usulü Cup Dondurma (100 ml.)', 55, 55),
      item('Algida Magnum Mini Badem (58 ml.)', 65, 60),
    ],
  },
  {
    id: 'promo-canta',
    name: 'Promosyon Taşıma Çantası',
    items: [
      item('Promosyon Çanta İstemiyorum'),
      item('Subway® Termal Taşıma Çantası', 20, 18),
    ],
  },
].map((group) => ({
  ...group,
  count: group.items.length,
}))
