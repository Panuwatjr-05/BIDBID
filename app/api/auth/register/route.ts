import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { UserRole } from '@/types'

interface RegisterBody {
  email: string
  password: string
  name: string
  role: UserRole
  store_name?: string
  line_id?: string
  store_description?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json()
    const { email, password, name, role, store_name, line_id, store_description } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    // Security: only allow BUYER or SELLER signup. ADMIN must be promoted manually
    if (role !== 'BUYER' && role !== 'SELLER') {
      return NextResponse.json({ error: 'ประเภทบัญชีไม่ถูกต้อง' }, { status: 400 })
    }

    // Basic input validation
    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 })
    }

    if (role === 'SELLER' && (!store_name || !line_id)) {
      return NextResponse.json({ error: 'ผู้ขายต้องระบุชื่อร้านและ LINE ID' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({ email, password: hashedPassword, name, role })
      .select('id, email, name, role')
      .single()

    if (userError || !newUser) {
      return NextResponse.json({ error: 'สร้างบัญชีไม่สำเร็จ' }, { status: 500 })
    }

    if (role === 'SELLER' && store_name && line_id) {
      const { error: storeError } = await supabaseAdmin.from('stores').insert({
        user_id: newUser.id,
        store_name,
        line_id,
        description: store_description ?? null,
      })

      if (storeError) {
        await supabaseAdmin.from('users').delete().eq('id', newUser.id)
        return NextResponse.json({ error: 'สร้างร้านค้าไม่สำเร็จ' }, { status: 500 })
      }
    }

    return NextResponse.json({ data: newUser }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}
