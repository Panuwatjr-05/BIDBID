import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('id, user_id, store_name, line_id, description, logo_url, is_active, created_at, owner:users(id, name, email)')
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'ไม่พบร้านค้า' }, { status: 404 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const body = await req.json()

    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('user_id')
      .eq('id', params.id)
      .single()

    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = store?.user_id === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
    }

    const allowedFields = isAdmin
      ? ['store_name', 'line_id', 'description', 'logo_url', 'is_active']
      : ['store_name', 'line_id', 'description', 'logo_url']

    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }

    const { data, error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
