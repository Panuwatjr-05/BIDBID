import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'เฉพาะ Seller เท่านั้น' }, { status: 403 })
    }

    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('user_id', session.user.id)

    const storeIds = (stores ?? []).map((s) => s.id)

    if (storeIds.length === 0) {
      return NextResponse.json({
        data: {
          total_products: 0, active_products: 0, sold_products: 0,
          ended_products: 0, total_bids: 0, fixed_count: 0, auction_count: 0,
        },
      })
    }

    const [
      { count: total },
      { count: active },
      { count: sold },
      { count: ended },
      { count: fixed },
      { count: auction },
    ] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds).eq('status', 'ACTIVE'),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds).eq('status', 'SOLD'),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds).eq('status', 'ENDED'),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds).eq('type', 'FIXED'),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).in('store_id', storeIds).eq('type', 'AUCTION'),
    ])

    // Count bids from auction products in this store
    const { data: auctionProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .in('store_id', storeIds)
      .eq('type', 'AUCTION')

    const auctionIds = (auctionProducts ?? []).map((p) => p.id)
    let totalBids = 0

    if (auctionIds.length > 0) {
      const { data: auctionDetails } = await supabaseAdmin
        .from('auction_products')
        .select('id')
        .in('product_id', auctionIds)

      const apIds = (auctionDetails ?? []).map((a) => a.id)
      if (apIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .in('auction_product_id', apIds)
        totalBids = count ?? 0
      }
    }

    return NextResponse.json({
      data: {
        total_products:  total   ?? 0,
        active_products: active  ?? 0,
        sold_products:   sold    ?? 0,
        ended_products:  ended   ?? 0,
        total_bids:      totalBids,
        fixed_count:     fixed   ?? 0,
        auction_count:   auction ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
