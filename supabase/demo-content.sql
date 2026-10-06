-- =====================================================================
-- DEMO CONTENT — clearly labelled sample data for showcasing the store.
-- Replace or delete in the admin panel (Đánh giá / Cài đặt) before launch.
-- Images: Unsplash (free licence). Texts: written for this demo.
-- =====================================================================

update public.lw_site_settings set
  team_image_path = 'https://images.unsplash.com/photo-1788125856697-04067c752525?w=1600&h=1067&fit=crop&q=80&auto=format',
  team_caption_vi = 'Ảnh minh họa xưởng bảo dưỡng (nguồn: Unsplash) — thay bằng ảnh đội ngũ thật.',
  team_caption_en = 'Illustrative workshop photo (source: Unsplash) — replace with a real team photo.'
where id = 1;

with demo (slug, author_name, rating, body) as (
  values
  ('seiko-presage-cocktail-time', 'Minh Anh (mẫu)', 5,
   'Mặt số ánh xanh rất đẹp ngoài nắng, đeo đi làm hằng ngày vẫn thanh lịch. Nhân viên gọi xác nhận đơn nhanh.'),
  ('tissot-le-locle-powermatic-80', 'Quốc Bảo (mẫu)', 5,
   'Trữ cót lâu thật sự, bỏ cuối tuần thứ Hai vẫn chạy. Hộp và sổ bảo hành đầy đủ.'),
  ('omega-seamaster-planet-ocean-600m', 'Hoàng Long (mẫu)', 4,
   'Đồng hồ nặng tay, hoàn thiện rất tốt. Giao hàng ở Đà Nẵng mất 3 ngày, đóng gói kỹ.'),
  ('longines-master-collection', 'Thu Hà (mẫu)', 5,
   'Mua làm quà cho chồng, được kiểm tra hàng trước khi thanh toán nên rất yên tâm.'),
  ('seiko-5-sports-field', 'Đức Huy (mẫu)', 4,
   'Giá hợp lý cho đồng hồ cơ đầu tiên, dây da hơi cứng lúc đầu nhưng đeo vài ngày là mềm.'),
  ('tag-heuer-carrera-chronograph', 'Thanh Tùng (mẫu)', 5,
   'Bấm giờ mượt, mặt kính sapphire không lóa. Tư vấn chọn size cổ tay rất nhiệt tình.')
)
insert into public.lw_reviews (product_id, user_id, author_name, rating, body, status, is_demo)
select p.id, null, d.author_name, d.rating, d.body, 'approved', true
from demo d
join public.lw_products p on p.slug = d.slug
where not exists (
  select 1 from public.lw_reviews r where r.product_id = p.id and r.is_demo and r.author_name = d.author_name
);
