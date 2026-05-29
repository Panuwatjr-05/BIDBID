import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        `*, store:stores(id, store_name, line_id, description, logo_url, user_id),
         fixed_product:fixed_products(*),
         auction_product:auction_products(*)`
      )
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 })

    await supabaseAdmin
      .from('products')
      .update({ views: (data.views ?? 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, category, images, price, stock } = body

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, store:stores(user_id)')
      .eq('id', params.id)
      .single()

    if (!product) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 })

    const storeOwner = (product.store as unknown as { user_id: string } | null)?.user_id
    if (storeOwner !== session.user.id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขสินค้านี้' }, { status: 403 })
    }

    const updateFields: Record<string, unknown> = {}
    if (name        !== undefined) updateFields.name        = name
    if (description !== undefined) updateFields.description = description
    if (category    !== undefined) updateFields.category    = category
    if (images      !== undefined) updateFields.images      = images
    if (body.status !== undefined) updateFields.status      = body.status

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (price !== undefined) {
      await supabaseAdmin
        .from('fixed_products')
        .update({ price, stock })
        .eq('product_id', params.id)
    }

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, store:stores(user_id)')
      .eq('id', params.id)
      .single()

    if (!product) return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 })

    const storeOwner = (product.store as unknown as { user_id: string } | null)?.user_id
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = storeOwner === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบสินค้านี้' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('products').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
