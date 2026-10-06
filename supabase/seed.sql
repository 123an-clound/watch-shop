-- =====================================================================
-- Seed data — demo catalog. Images are Unsplash placeholders (full URLs in
-- storage_path); replace via the admin panel with real product photos.
-- =====================================================================

insert into public.lw_site_settings (
  id, store_name, hero_image_path, hero_title_vi, hero_title_en,
  hero_subtitle_vi, hero_subtitle_en, contact_email, contact_phone, address,
  social_links, shipping_fee, free_shipping_threshold
) values (
  1, 'Luxe Watch',
  'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=2000&h=1250&fit=crop&q=80&auto=format',
  'Thời gian, được chế tác tinh xảo',
  'Time, masterfully crafted',
  'Đồng hồ Thụy Sĩ & Nhật Bản chính hãng. Bảo hành 5 năm, thanh toán khi nhận hàng.',
  'Authentic Swiss & Japanese watches. 5-year warranty, cash on delivery.',
  'hello@luxewatch.vn', '0901234567', '12 Đồng Khởi, Phường Sài Gòn, TP. Hồ Chí Minh',
  '{"facebook": "https://facebook.com/", "instagram": "https://instagram.com/"}'::jsonb,
  30000, 5000000
) on conflict (id) do nothing;

insert into public.lw_categories (slug, name_vi, name_en, sort_order) values
  ('dong-ho-nam', 'Đồng hồ nam', 'Men''s watches', 1),
  ('dong-ho-nu', 'Đồng hồ nữ', 'Women''s watches', 2),
  ('dong-ho-the-thao', 'Thể thao & lặn', 'Sport & dive', 3),
  ('dong-ho-co-dien', 'Cổ điển & dress', 'Classic & dress', 4)
on conflict (slug) do nothing;

insert into public.lw_brands (slug, name, description_vi, description_en) values
  ('rolex', 'Rolex',
   'Biểu tượng của sự chính xác và đẳng cấp từ Genève, Thụy Sĩ, từ năm 1905.',
   'The Geneva icon of precision and prestige since 1905.'),
  ('omega', 'Omega',
   'Nhà sản xuất đồng hồ Thụy Sĩ đồng hành cùng các sứ mệnh không gian và Thế vận hội.',
   'Swiss watchmaker trusted on the Moon and at the Olympic Games.'),
  ('tissot', 'Tissot',
   'Đồng hồ Thụy Sĩ truyền thống từ Le Locle, kết hợp chất lượng và giá trị.',
   'Swiss tradition from Le Locle, pairing quality with value.'),
  ('seiko', 'Seiko',
   'Thương hiệu Nhật Bản tiên phong, nổi tiếng với bộ máy tự sản xuất bền bỉ.',
   'Japanese pioneer renowned for robust in-house movements.'),
  ('longines', 'Longines',
   'Sự thanh lịch vượt thời gian từ Saint-Imier, Thụy Sĩ, từ năm 1832.',
   'Timeless elegance from Saint-Imier, Switzerland, since 1832.'),
  ('tag-heuer', 'TAG Heuer',
   'Tinh thần đua xe thể thao và đồng hồ bấm giờ chính xác từ năm 1860.',
   'Motorsport spirit and precision chronographs since 1860.')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
with data (slug, sku, name_vi, name_en, description_vi, description_en, price, compare_at_price,
           stock, category_slug, brand_slug, features, is_featured) as (
  values
  ('rolex-submariner-date-126610ln', 'RLX-126610LN',
   'Rolex Submariner Date 41mm', 'Rolex Submariner Date 41mm',
   'Huyền thoại đồng hồ lặn với vành bezel Cerachrom đen, bộ máy Calibre 3235 và khả năng chống nước 300m.',
   'The archetypal dive watch with a black Cerachrom bezel, Calibre 3235 and 300m water resistance.',
   395000000, null::bigint, 2, 'dong-ho-the-thao', 'rolex',
   '{"movement":"Automatic","case_size":"41mm","case_material":"Oystersteel","water_resistance":"300m","crystal":"Sapphire","strap_material":"Oyster bracelet"}', true),
  ('rolex-datejust-41-126334', 'RLX-126334',
   'Rolex Datejust 41 mặt chocolate', 'Rolex Datejust 41 Chocolate Dial',
   'Datejust kinh điển với vành khía Fluted, mặt số chocolate đính kim cương và dây Jubilee.',
   'The classic Datejust with fluted bezel, diamond-set chocolate dial and Jubilee bracelet.',
   365000000, null, 1, 'dong-ho-co-dien', 'rolex',
   '{"movement":"Automatic","case_size":"41mm","case_material":"Oystersteel & gold","water_resistance":"100m","crystal":"Sapphire","strap_material":"Jubilee bracelet"}', true),
  ('rolex-explorer-224270', 'RLX-224270',
   'Rolex Explorer 40mm', 'Rolex Explorer 40mm',
   'Thiết kế tối giản cho nhà thám hiểm: mặt đen 3-6-9, bộ máy chống từ và độ bền vượt trội.',
   'A pared-back explorer''s watch: 3-6-9 black dial, antimagnetic movement, exceptional robustness.',
   245000000, null, 3, 'dong-ho-nam', 'rolex',
   '{"movement":"Automatic","case_size":"40mm","case_material":"Oystersteel","water_resistance":"100m","crystal":"Sapphire","strap_material":"Oyster bracelet"}', false),
  ('omega-seamaster-planet-ocean-600m', 'OMG-PO600-43',
   'Omega Seamaster Planet Ocean 600M', 'Omega Seamaster Planet Ocean 600M',
   'Đồng hồ lặn chuyên nghiệp với bộ máy Co-Axial Master Chronometer, chống nước 600m và chi tiết cam nổi bật.',
   'Professional diver with Co-Axial Master Chronometer movement, 600m water resistance and orange accents.',
   185000000, 198000000, 4, 'dong-ho-the-thao', 'omega',
   '{"movement":"Automatic","case_size":"43.5mm","case_material":"Stainless steel","water_resistance":"600m","crystal":"Sapphire","strap_material":"Steel bracelet"}', true),
  ('omega-constellation-41', 'OMG-CON-41',
   'Omega Constellation 41mm', 'Omega Constellation 41mm',
   'Biểu tượng với "móng vuốt" đặc trưng, mặt số xám tinh tế và bộ máy Master Chronometer.',
   'Signature "claws", a refined grey dial and Master Chronometer certification.',
   168000000, null, 3, 'dong-ho-nam', 'omega',
   '{"movement":"Automatic","case_size":"41mm","case_material":"Stainless steel","water_resistance":"50m","crystal":"Sapphire","strap_material":"Steel bracelet"}', false),
  ('tissot-chemin-des-tourelles-chronograph', 'TIS-CDT-CHR',
   'Tissot Chemin des Tourelles Chronograph', 'Tissot Chemin des Tourelles Chronograph',
   'Chronograph tự động với vỏ mạ vàng hồng, mặt số champagne và dây da nâu.',
   'Automatic chronograph in a rose-gold PVD case with champagne dial and brown leather strap.',
   42500000, 47000000, 6, 'dong-ho-co-dien', 'tissot',
   '{"movement":"Automatic","case_size":"42mm","case_material":"Rose gold PVD steel","water_resistance":"50m","crystal":"Sapphire","strap_material":"Leather"}', true),
  ('tissot-everytime-lady', 'TIS-EVT-L34',
   'Tissot Everytime Lady 34mm', 'Tissot Everytime Lady 34mm',
   'Thiết kế thanh mảnh, mặt trắng tối giản với vỏ vàng hồng — lựa chọn thanh lịch hằng ngày.',
   'Slim, minimal white dial in a rose-gold case — an elegant everyday choice.',
   8900000, null, 12, 'dong-ho-nu', 'tissot',
   '{"movement":"Quartz","case_size":"34mm","case_material":"Rose gold PVD steel","water_resistance":"30m","crystal":"Sapphire","strap_material":"Leather"}', false),
  ('tissot-le-locle-powermatic-80', 'TIS-LL-P80',
   'Tissot Le Locle Powermatic 80', 'Tissot Le Locle Powermatic 80',
   'Bộ máy Powermatic 80 trữ cót 80 giờ, mặt số guilloché và dây da xanh.',
   'Powermatic 80 movement with 80-hour reserve, guilloché dial and blue leather strap.',
   19800000, 22000000, 8, 'dong-ho-co-dien', 'tissot',
   '{"movement":"Automatic","case_size":"39.3mm","case_material":"Stainless steel","water_resistance":"30m","crystal":"Sapphire","strap_material":"Leather"}', false),
  ('seiko-presage-cocktail-time', 'SEI-SRPB43',
   'Seiko Presage Cocktail Time', 'Seiko Presage Cocktail Time',
   'Lấy cảm hứng từ những ly cocktail Tokyo, mặt số ánh kim độc đáo với bộ máy tự động 4R35.',
   'Inspired by Tokyo cocktails, with a lustrous dial and automatic 4R35 movement.',
   12500000, null, 10, 'dong-ho-co-dien', 'seiko',
   '{"movement":"Automatic","case_size":"40.5mm","case_material":"Stainless steel","water_resistance":"50m","crystal":"Hardlex","strap_material":"Leather"}', true),
  ('seiko-prospex-diver', 'SEI-SRPE93',
   'Seiko Prospex Diver 200m', 'Seiko Prospex Diver 200m',
   'Đồng hồ lặn chuẩn ISO với dạ quang LumiBrite, vỏ thép bền bỉ và giá trị vượt trội.',
   'ISO-rated diver with LumiBrite lume, rugged steel case and outstanding value.',
   14900000, null, 9, 'dong-ho-the-thao', 'seiko',
   '{"movement":"Automatic","case_size":"42.4mm","case_material":"Stainless steel","water_resistance":"200m","crystal":"Hardlex","strap_material":"Silicone"}', false),
  ('seiko-5-sports-field', 'SEI-SRPH29',
   'Seiko 5 Sports Field', 'Seiko 5 Sports Field',
   'Phong cách quân đội cổ điển, bộ máy tự động 4R36 và dây da bền chắc.',
   'Classic field style, automatic 4R36 movement and a durable leather strap.',
   7200000, 8500000, 15, 'dong-ho-nam', 'seiko',
   '{"movement":"Automatic","case_size":"39.4mm","case_material":"Stainless steel","water_resistance":"100m","crystal":"Hardlex","strap_material":"Leather"}', false),
  ('longines-master-collection', 'LNG-L2909',
   'Longines Master Collection 40mm', 'Longines Master Collection 40mm',
   'Sự thanh lịch truyền thống: mặt số xanh sunray, kim xanh nhiệt và bộ máy tự động L888.',
   'Traditional elegance: sunray blue dial, heat-blued hands and L888 automatic movement.',
   58000000, null, 5, 'dong-ho-co-dien', 'longines',
   '{"movement":"Automatic","case_size":"40mm","case_material":"Stainless steel","water_resistance":"30m","crystal":"Sapphire","strap_material":"Leather"}', true),
  ('longines-conquest-41', 'LNG-L3830',
   'Longines Conquest 41mm', 'Longines Conquest 41mm',
   'Đồng hồ thể thao thanh lịch, chống nước 100m và bộ máy tự động chống từ.',
   'Elegant sports watch with 100m water resistance and an antimagnetic automatic movement.',
   48500000, null, 6, 'dong-ho-nam', 'longines',
   '{"movement":"Automatic","case_size":"41mm","case_material":"Stainless steel","water_resistance":"100m","crystal":"Sapphire","strap_material":"Steel bracelet"}', false),
  ('longines-la-grande-classique', 'LNG-L4709',
   'Longines La Grande Classique 29mm', 'Longines La Grande Classique 29mm',
   'Mỏng nhẹ và tinh tế, mặt số đen với cọc số La Mã — biểu tượng thanh lịch cho phái nữ.',
   'Ultra-slim and refined, black dial with Roman numerals — an icon of feminine elegance.',
   39000000, null, 4, 'dong-ho-nu', 'longines',
   '{"movement":"Quartz","case_size":"29mm","case_material":"Stainless steel","water_resistance":"30m","crystal":"Sapphire","strap_material":"Leather"}', false),
  ('tag-heuer-carrera-chronograph', 'TAG-CBN2A1B',
   'TAG Heuer Carrera Chronograph', 'TAG Heuer Carrera Chronograph',
   'Chronograph lấy cảm hứng đua xe với bộ máy Heuer 02 trữ cót 80 giờ.',
   'Racing-inspired chronograph powered by the Heuer 02 with an 80-hour power reserve.',
   152000000, null, 2, 'dong-ho-the-thao', 'tag-heuer',
   '{"movement":"Automatic","case_size":"44mm","case_material":"Stainless steel","water_resistance":"100m","crystal":"Sapphire","strap_material":"Leather"}', true),
  ('tag-heuer-autavia-chronograph', 'TAG-AUT-CHR',
   'TAG Heuer Autavia Chronograph', 'TAG Heuer Autavia Chronograph',
   'Phong cách chronograph cổ điển thập niên 60, mặt panda và vành tachymeter.',
   '1960s-style chronograph with a panda dial and tachymeter bezel.',
   118000000, 129000000, 0, 'dong-ho-nam', 'tag-heuer',
   '{"movement":"Automatic","case_size":"42mm","case_material":"Stainless steel","water_resistance":"100m","crystal":"Sapphire","strap_material":"Leather"}', false)
)
insert into public.lw_products (
  slug, sku, name_vi, name_en, description_vi, description_en, price, compare_at_price,
  stock, category_id, brand_id, features, is_featured, is_active,
  seo_title_vi, seo_title_en, seo_description_vi, seo_description_en
)
select
  d.slug, d.sku, d.name_vi, d.name_en, d.description_vi, d.description_en, d.price, d.compare_at_price,
  d.stock, c.id, b.id, d.features::jsonb, d.is_featured, true,
  d.name_vi || ' chính hãng', d.name_en || ' — authentic',
  left(d.description_vi, 300), left(d.description_en, 300)
from data d
join public.lw_categories c on c.slug = d.category_slug
join public.lw_brands b on b.slug = d.brand_slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Product images (4:5, 1200×1500)
-- ---------------------------------------------------------------------
with img (product_slug, photo_id, sort_order) as (
  values
  ('rolex-submariner-date-126610ln', '1594534475808-b18fc33b045e', 0),
  ('rolex-submariner-date-126610ln', '1526045431048-f857369baa09', 1),
  ('rolex-datejust-41-126334', '1600003014755-ba31aa59c4b6', 0),
  ('rolex-datejust-41-126334', '1619134778706-7015533a6150', 1),
  ('rolex-explorer-224270', '1587836374828-4dbafa94cf0e', 0),
  ('omega-seamaster-planet-ocean-600m', '1548171915-e79a380a2a4b', 0),
  ('omega-constellation-41', '1547996160-81dfa63595aa', 0),
  ('tissot-chemin-des-tourelles-chronograph', '1522312346375-d1a52e2b99b3', 0),
  ('tissot-everytime-lady', '1524592094714-0f0654e20314', 0),
  ('tissot-le-locle-powermatic-80', '1585123334904-845d60e97b29', 0),
  ('seiko-presage-cocktail-time', '1612817159949-195b6eb9e31a', 0),
  ('seiko-prospex-diver', '1614164185128-e4ec99c436d7', 0),
  ('seiko-5-sports-field', '1495856458515-0637185db551', 0),
  ('longines-master-collection', '1620625515032-6ed0c1790c75', 0),
  ('longines-conquest-41', '1533139502658-0198f920d8e8', 0),
  ('longines-la-grande-classique', '1518131672697-613becd4fab5', 0),
  ('tag-heuer-carrera-chronograph', '1609587312208-cea54be969e7', 0),
  ('tag-heuer-autavia-chronograph', '1539874754764-5a96559165b0', 0)
)
insert into public.lw_product_images (product_id, storage_path, alt_vi, alt_en, sort_order, width, height)
select
  p.id,
  'https://images.unsplash.com/photo-' || i.photo_id || '?w=1200&h=1500&fit=crop&q=80&auto=format',
  'Đồng hồ ' || p.name_vi,
  p.name_en || ' watch',
  i.sort_order,
  1200,
  1500
from img i
join public.lw_products p on p.slug = i.product_slug
where not exists (
  select 1 from public.lw_product_images x where x.product_id = p.id and x.sort_order = i.sort_order
);
