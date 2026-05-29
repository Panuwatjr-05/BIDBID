-- ============================
-- Storage Bucket Setup
-- ============================
-- สร้าง bucket ชื่อ product-images แบบ Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "storage_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "storage_update_owner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND auth.uid()::text = owner::text
  );

CREATE POLICY "storage_delete_owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND auth.uid()::text = owner::text
  );

-- ============================
-- Seed Data
-- หมายเหตุ: password ที่ใช้คือ "password123" hash ด้วย bcryptjs
-- ให้สร้าง hash จริงผ่าน Node.js: bcrypt.hashSync('password123', 10)
-- ============================
INSERT INTO users (id, email, password, name, role) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@test.com',
    '$2a$10$foJqC01VgT86utDcsgygneX/WPNCuIE3/7aX6Z.Aoha2u79qeksIe',
    'แอดมิน ระบบ',
    'ADMIN'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'seller1@test.com',
    '$2a$10$foJqC01VgT86utDcsgygneX/WPNCuIE3/7aX6Z.Aoha2u79qeksIe',
    'ร้านแรก อิเล็กทรอนิกส์',
    'SELLER'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'seller2@test.com',
    '$2a$10$foJqC01VgT86utDcsgygneX/WPNCuIE3/7aX6Z.Aoha2u79qeksIe',
    'ร้านสอง แฟชั่น',
    'SELLER'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'buyer@test.com',
    '$2a$10$foJqC01VgT86utDcsgygneX/WPNCuIE3/7aX6Z.Aoha2u79qeksIe',
    'ผู้ซื้อทดสอบ',
    'BUYER'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Stores
INSERT INTO stores (id, user_id, store_name, line_id, description) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Tech Hub Store',
    '@techhub',
    'ร้านขายอุปกรณ์อิเล็กทรอนิกส์คุณภาพสูง'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Fashion World',
    '@fashionworld',
    'เสื้อผ้าแฟชั่นทันสมัย ราคาเข้าถึงได้'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Fixed Products
INSERT INTO products (id, store_id, name, description, category, type, images, status) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'iPhone 15 Pro Max 256GB',
    'สมาร์ทโฟนรุ่นใหม่ล่าสุด ชิป A17 Pro กล้อง 48MP',
    'อิเล็กทรอนิกส์',
    'FIXED',
    '{}',
    'ACTIVE'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'MacBook Pro 14 M3',
    'แล็ปท็อปสำหรับมืออาชีพ ชิป M3 แบตฯ ยาวนาน 22 ชม.',
    'อิเล็กทรอนิกส์',
    'FIXED',
    '{}',
    'ACTIVE'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'เดรสแฟชั่นลายดอก',
    'เดรสผ้าฝ้ายลายดอกไม้ สวมใส่สบาย เหมาะทุกโอกาส',
    'แฟชั่นและเครื่องแต่งกาย',
    'FIXED',
    '{}',
    'ACTIVE'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO fixed_products (product_id, price, stock) VALUES
  ('20000000-0000-0000-0000-000000000001', 49900.00, 5),
  ('20000000-0000-0000-0000-000000000002', 69900.00, 3),
  ('20000000-0000-0000-0000-000000000003', 890.00, 20)
ON CONFLICT (product_id) DO NOTHING;

-- Seed Auction Products
INSERT INTO products (id, store_id, name, description, category, type, images, status) VALUES
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'iPad Pro 12.9" M2 (มือสอง)',
    'iPad Pro สภาพดีมาก ใช้งานน้อย มาพร้อม Apple Pencil',
    'อิเล็กทรอนิกส์',
    'AUCTION',
    '{}',
    'ACTIVE'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'กระเป๋า Louis Vuitton แท้',
    'กระเป๋าหนังแท้ สภาพใหม่ มีการ์ดรับรอง',
    'แฟชั่นและเครื่องแต่งกาย',
    'AUCTION',
    '{}',
    'ACTIVE'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auction_products (product_id, starting_bid, current_bid, min_increment, end_at) VALUES
  (
    '20000000-0000-0000-0000-000000000004',
    15000.00,
    15000.00,
    500.00,
    NOW() + INTERVAL '3 days'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    5000.00,
    5000.00,
    200.00,
    NOW() + INTERVAL '5 days'
  )
ON CONFLICT (product_id) DO NOTHING;
