-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
CREATE TYPE product_type AS ENUM ('FIXED', 'AUCTION');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'SOLD', 'ENDED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'BUYER',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  line_id TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type product_type NOT NULL,
  images TEXT[] DEFAULT '{}',
  status product_status NOT NULL DEFAULT 'ACTIVE',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixed price products
CREATE TABLE fixed_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 1
);

-- Auction products
CREATE TABLE auction_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  starting_bid NUMERIC(12,2) NOT NULL,
  current_bid NUMERIC(12,2) NOT NULL,
  min_increment NUMERIC(12,2) NOT NULL DEFAULT 1,
  end_at TIMESTAMPTZ NOT NULL,
  winner_id UUID REFERENCES users(id)
);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_product_id UUID REFERENCES auction_products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_auction_products_end_at ON auction_products(end_at);
CREATE INDEX idx_bids_auction_product_id ON bids(auction_product_id);
CREATE INDEX idx_bids_buyer_id ON bids(buyer_id);
CREATE INDEX idx_bids_created_at ON bids(created_at DESC);

-- Function to auto-update auction status when expired
CREATE OR REPLACE FUNCTION update_expired_auctions()
RETURNS void AS $$
BEGIN
  UPDATE products
  SET status = 'ENDED'
  WHERE type = 'AUCTION'
    AND status = 'ACTIVE'
    AND id IN (
      SELECT product_id FROM auction_products
      WHERE end_at < NOW()
    );
END;
$$ LANGUAGE plpgsql;
