import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_PRODUCT_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_AVATAR_SIZE  = 2 * 1024 * 1024  // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const formData = await req.formData()
    const file    = formData.get('file') as File | null
    const type    = (formData.get('type') as string | null) ?? 'product'  // 'product' | 'avatar'

    if (!file) return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'รองรับเฉพาะ JPG, PNG, WebP, GIF' }, { status: 400 })
    }

    const isAvatar  = type === 'avatar'
    const isLogo    = type === 'store-logo'
    const maxSize   = isAvatar || isLogo ? MAX_AVATAR_SIZE : MAX_PRODUCT_SIZE
    const bucket    = isAvatar || isLogo ? 'avatars' : 'product-images'

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `ไฟล์ต้องไม่เกิน ${isAvatar || isLogo ? '2' : '5'}MB` },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()
    let fileName: string
    if (isAvatar) {
      fileName = `${session.user.id}/avatar.${ext}`
    } else if (isLogo) {
      fileName = `stores/${session.user.id}/logo.${ext}`
    } else {
      fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    }

    const buffer = new Uint8Array(await file.arrayBuffer())

    const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: isAvatar || isLogo,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName)
    const url = (isAvatar || isLogo)
      ? `${data.publicUrl}?t=${Date.now()}`
      : data.publicUrl

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
