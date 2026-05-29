export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN'
export type ProductType = 'FIXED' | 'AUCTION'
export type ProductStatus = 'ACTIVE' | 'SOLD' | 'ENDED'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Store {
  id: string
  user_id: string
  store_name: string
  line_id: string
  description: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  owner?: User
}

export interface Product {
  id: string
  store_id: string
  name: string
  description: string | null
  category: string
  type: ProductType
  images: string[]
  status: ProductStatus
  views: number
  created_at: string
  store?: Store
  fixed_product?: FixedProduct
  auction_product?: AuctionProduct
}

export interface FixedProduct {
  id: string
  product_id: string
  price: number
  stock: number
}

export interface AuctionProduct {
  id: string
  product_id: string
  starting_bid: number
  current_bid: number
  min_increment: number
  end_at: string
  winner_id: string | null
  winner?: User
}

export interface Bid {
  id: string
  auction_product_id: string
  buyer_id: string
  amount: number
  created_at: string
  user?: User
}

export interface ProductWithDetails extends Product {
  store: Store
  fixed_product?: FixedProduct
  auction_product?: AuctionProduct
}

export interface BidWithUser extends Bid {
  user: User
}

export interface DashboardStats {
  total_products: number
  active_products: number
  sold_products: number
  total_bids: number
}

export interface AdminStats {
  total_users: number
  total_sellers: number
  total_buyers: number
  total_stores: number
  active_stores: number
  total_products: number
  total_auctions: number
  active_auctions: number
}

export interface CreateProductPayload {
  store_id: string
  name: string
  description: string | null
  category: string
  type: ProductType
  images: string[]
  price?: number
  stock?: number
  starting_bid?: number
  min_increment?: number
  end_at?: string
}

export interface PlaceBidPayload {
  auction_product_id: string
  amount: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export const PRODUCT_CATEGORIES = [
  'อิเล็กทรอนิกส์',
  'แฟชั่นและเครื่องแต่งกาย',
  'บ้านและสวน',
  'กีฬาและกลางแจ้ง',
  'ยานยนต์',
  'ศิลปะและของสะสม',
  'หนังสือและสื่อ',
  'อาหารและเครื่องดื่ม',
  'สุขภาพและความงาม',
  'ของเล่นและเด็ก',
  'เครื่องประดับ',
  'อื่นๆ',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
