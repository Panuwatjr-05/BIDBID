import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('id', session.user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const body = await req.json()
    const { name, avatar_url, current_password, new_password } = body

    const updateData: Record<string, unknown> = {}

    if (name && name.trim().length >= 2) {
      updateData.name = name.trim()
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url
    }

    // Change password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'กรุณาระบุรหัสผ่านเดิม' }, { status: 400 })
      }
      if (new_password.length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
      }

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('password')
        .eq('id', session.user.id)
        .single()

      if (!user) return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 })

      const isValid = await bcrypt.compare(current_password, user.password)
      if (!isValid) return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 })

      updateData.password = await bcrypt.hash(new_password, 10)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องอัปเดต' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id, email, name, role, avatar_url, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
