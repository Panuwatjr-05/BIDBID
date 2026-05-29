-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- ============================
-- Users policies
-- ============================
CREATE POLICY "users_select_all" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_service" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================
-- Stores policies
-- ============================
CREATE POLICY "stores_select_all" ON stores
  FOR SELECT USING (true);

CREATE POLICY "stores_insert_own" ON stores
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "stores_update_own" ON stores
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "stores_delete_own" ON stores
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- ============================
-- Products policies
-- ============================
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_seller" ON products
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "products_update_seller" ON products
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "products_delete_seller" ON products
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id::text = auth.uid()::text
    )
  );

-- ============================
-- Fixed products policies
-- ============================
CREATE POLICY "fixed_products_select_all" ON fixed_products
  FOR SELECT USING (true);

CREATE POLICY "fixed_products_insert" ON fixed_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "fixed_products_update" ON fixed_products
  FOR UPDATE USING (true);

CREATE POLICY "fixed_products_delete" ON fixed_products
  FOR DELETE USING (true);

-- ============================
-- Auction products policies
-- ============================
CREATE POLICY "auction_products_select_all" ON auction_products
  FOR SELECT USING (true);

CREATE POLICY "auction_products_insert" ON auction_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auction_products_update" ON auction_products
  FOR UPDATE USING (true);

CREATE POLICY "auction_products_delete" ON auction_products
  FOR DELETE USING (true);

-- ============================
-- Bids policies
-- ============================
CREATE POLICY "bids_select_all" ON bids
  FOR SELECT USING (true);

CREATE POLICY "bids_insert_buyer" ON bids
  FOR INSERT WITH CHECK (auth.uid()::text = buyer_id::text);
