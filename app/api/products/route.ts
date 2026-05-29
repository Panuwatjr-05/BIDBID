import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CreateProductPayload } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const storeId = searchParams.get('store_id')
    const status = searchParams.get('status') ?? 'ACTIVE'
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '12')
    const offset = (page - 1) * pageSize

    let query = supabaseAdmin
      .from('products')
      .select(
        `*, store:stores(id, store_name, line_id, description, logo_url),
         fixed_product:fixed_products(*),
         auction_product:auction_products(*)`,
        { count: 'exact' }
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (type) query = query.eq('type', type)
    if (category) query = query.eq('category', category)
    if (storeId) query = query.eq('store_id', storeId)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, count, page, pageSize })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }

    const body: CreateProductPayload = await req.json()
    const {
      store_id, name, description, category, type, images,
      price, stock, starting_bid, min_increment, end_at,
    } = body

    if (!store_id || !name || !category || !type) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลสินค้าให้ครบ' }, { status: 400 })
    }

    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('id', store_id)
      .eq('user_id', session.user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'ไม่พบร้านค้าของคุณ' }, { status: 403 })
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({ store_id, name, description, category, type, images: images ?? [] })
      .select()
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'สร้างสินค้าไม่สำเร็จ' }, { status: 500 })
    }

    if (type === 'FIXED') {
      if (price === undefined || price === null) {
        await supabaseAdmin.from('products').delete().eq('id', product.id)
        return NextResponse.json({ error: 'กรุณาระบุราคาสินค้า' }, { status: 400 })
      }
      await supabaseAdmin.from('fixed_products').insert({
        product_id: product.id,
        price,
        stock: stock ?? 1,
      })
    } else {
      if (!starting_bid || !end_at) {
        await supabaseAdmin.from('products').delete().eq('id', product.id)
        return NextResponse.json({ error: 'กรุณาระบุราคาเริ่มต้นและวันสิ้นสุดการประมูล' }, { status: 400 })
      }
      await supabaseAdmin.from('auction_products').insert({
        product_id: product.id,
        starting_bid,
        current_bid: starting_bid,
        min_increment: min_increment ?? 1,
        end_at,
      })
    }

    return NextResponse.json({ data: product }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
