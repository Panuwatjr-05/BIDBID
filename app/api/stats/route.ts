import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const revalidate = 60 // cache 60 วินาที

export async function GET() {
  try {
    const [
      { count: products },
      { count: auctions },
      { count: stores },
      { count: users },
    ] = await Promise.all([
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'AUCTION')
        .eq('status', 'ACTIVE'),
      supabaseAdmin
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      products: products ?? 0,
      auctions: auctions ?? 0,
      stores:   stores   ?? 0,
      users:    users    ?? 0,
    })
  } catch {
    return NextResponse.json({ products: 0, auctions: 0, stores: 0, users: 0 })
  }
}
