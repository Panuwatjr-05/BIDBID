import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { PlaceBidPayload } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const auctionProductId = searchParams.get('auction_product_id')
    const buyerId = searchParams.get('buyer_id')

    let query = supabaseAdmin
      .from('bids')
      .select('*, user:users(id, name, email)')
      .order('created_at', { ascending: false })

    if (auctionProductId) query = query.eq('auction_product_id', auctionProductId)
    if (buyerId) query = query.eq('buyer_id', buyerId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'เฉพาะผู้ซื้อเท่านั้นที่ประมูลได้' }, { status: 403 })
    }

    const body: PlaceBidPayload = await req.json()
    const { auction_product_id, amount } = body

    if (!auction_product_id || !amount) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
    }

    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auction_products')
      .select('*, product:products(status, store:stores(user_id))')
      .eq('id', auction_product_id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'ไม่พบการประมูล' }, { status: 404 })
    }

    const product = auction.product as { status: string; store: { user_id: string } } | null
    if (product?.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'การประมูลสิ้นสุดแล้ว' }, { status: 400 })
    }

    if (product?.store?.user_id === session.user.id) {
      return NextResponse.json({ error: 'ไม่สามารถประมูลสินค้าของตนเองได้' }, { status: 400 })
    }

    const endAt = new Date(auction.end_at)
    if (endAt < new Date()) {
      return NextResponse.json({ error: 'การประมูลสิ้นสุดแล้ว' }, { status: 400 })
    }

    const minBid = auction.current_bid + auction.min_increment
    if (amount < minBid) {
      return NextResponse.json(
        { error: `ราคาประมูลขั้นต่ำคือ ${minBid.toLocaleString('th-TH')} บาท` },
        { status: 400 }
      )
    }

    const { data: bid, error: bidError } = await supabaseAdmin
      .from('bids')
      .insert({ auction_product_id, buyer_id: session.user.id, amount })
      .select('*, user:users(id, name)')
      .single()

    if (bidError || !bid) {
      return NextResponse.json({ error: 'ประมูลไม่สำเร็จ' }, { status: 500 })
    }

    await supabaseAdmin
      .from('auction_products')
      .update({ current_bid: amount, winner_id: session.user.id })
      .eq('id', auction_product_id)

    return NextResponse.json({ data: bid }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
