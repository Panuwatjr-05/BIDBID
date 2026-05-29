import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'เฉพาะ Admin เท่านั้น' }, { status: 403 })
    }

    const [
      { count: totalUsers },
      { count: totalSellers },
      { count: totalBuyers },
      { count: totalStores },
      { count: activeStores },
      { count: totalProducts },
      { count: totalAuctions },
      { count: activeAuctions },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'SELLER'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'BUYER'),
      supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('type', 'AUCTION'),
      supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'AUCTION')
        .eq('status', 'ACTIVE'),
    ])

    return NextResponse.json({
      data: {
        total_users: totalUsers ?? 0,
        total_sellers: totalSellers ?? 0,
        total_buyers: totalBuyers ?? 0,
        total_stores: totalStores ?? 0,
        active_stores: activeStores ?? 0,
        total_products: totalProducts ?? 0,
        total_auctions: totalAuctions ?? 0,
        active_auctions: activeAuctions ?? 0,
      },
    })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
