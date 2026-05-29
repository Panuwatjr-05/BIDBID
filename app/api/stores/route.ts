import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('stores')
      .select('id, user_id, store_name, line_id, description, logo_url, is_active, created_at, owner:users(id, name, email, role)')
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)
    if (isActive !== null) query = query.eq('is_active', isActive === 'true')

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
    if (!session || session.user.role !== 'SELLER') {
      return NextResponse.json({ error: 'เฉพาะผู้ขายเท่านั้น' }, { status: 403 })
    }

    const body = await req.json()
    const { store_name, line_id, description } = body

    if (!store_name || !line_id) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อร้านและ LINE ID' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert({ user_id: session.user.id, store_name, line_id, description })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
