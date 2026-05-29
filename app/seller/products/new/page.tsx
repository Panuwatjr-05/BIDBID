'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { ArrowLeft } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/types'
import type { Store } from '@/types'

// Flat schema — conditional validation happens in onSubmit
const schema = z.object({
  name: z.string().min(3, 'ชื่อสินค้าต้องมีอย่างน้อย 3 ตัวอักษร'),
  description: z.string().optional(),
  category: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  price: z.coerce.number().optional(),
  stock: z.coerce.number().int().optional(),
  starting_bid: z.coerce.number().optional(),
  min_increment: z.coerce.number().optional(),
  end_at: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProductPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [productType, setProductType] = useState<'FIXED' | 'AUCTION'>('FIXED')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', category: '', stock: 1, min_increment: 100 },
  })

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SELLER') { router.push('/'); return }
    if (status === 'authenticated') loadStore()
  }, [status, session])

  async function loadStore() {
    const res = await fetch(`/api/stores?user_id=${session?.user?.id}`)
    const json = await res.json()
    setStore(json.data?.[0] ?? null)
  }

  async function onSubmit(data: FormData) {
    if (!store) { toast.error('ไม่พบข้อมูลร้านค้า'); return }

    if (productType === 'FIXED') {
      if (!data.price || data.price < 1) { toast.error('กรุณาระบุราคาสินค้า'); return }
      if (!data.stock || data.stock < 1) { toast.error('กรุณาระบุจำนวนสต็อก'); return }
    } else {
      if (!data.starting_bid || data.starting_bid < 1) { toast.error('กรุณาระบุราคาเริ่มต้น'); return }
      if (!data.end_at) { toast.error('กรุณาเลือกวันสิ้นสุดการประมูล'); return }
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type: productType, store_id: store.id, images }),
    })

    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'เกิดข้อผิดพลาด'); return }

    toast.success('เพิ่มสินค้าสำเร็จ!')
    router.push('/seller/products')
  }

  const minEndAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มสินค้าใหม่</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product type */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-3">ประเภทสินค้า *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['FIXED', 'AUCTION'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProductType(t)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    productType === t
                      ? t === 'AUCTION'
                        ? 'border-auction-500 bg-auction-50'
                        : 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{t === 'FIXED' ? '🏷️ ราคาคงที่' : '🔨 ประมูล'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t === 'FIXED' ? 'ตั้งราคาขาย ลูกค้าซื้อได้ทันที' : 'ลูกค้าเสนอราคาแข่งกัน'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">ข้อมูลสินค้า</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
              <input {...register('name')} placeholder="ชื่อสินค้า" className="input-field" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <textarea {...register('description')} placeholder="รายละเอียดสินค้า..." className="input-field h-24 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ *</label>
              <select {...register('category')} className="input-field">
                <option value="">เลือกหมวดหมู่</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Pricing */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">ราคาและรายละเอียด</h2>
            {productType === 'FIXED' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท) *</label>
                  <input {...register('price')} type="number" min="1" step="0.01" placeholder="0.00" className="input-field" />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนสต็อก *</label>
                  <input {...register('stock')} type="number" min="1" placeholder="1" className="input-field" />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาเริ่มต้น (บาท) *</label>
                    <input {...register('starting_bid')} type="number" min="1" step="0.01" placeholder="0.00" className="input-field" />
                    {errors.starting_bid && <p className="text-red-500 text-xs mt-1">{errors.starting_bid.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ขั้นต่ำการประมูล (บาท) *</label>
                    <input {...register('min_increment')} type="number" min="1" step="0.01" placeholder="100" className="input-field" />
                    {errors.min_increment && <p className="text-red-500 text-xs mt-1">{errors.min_increment.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุดการประมูล *</label>
                  <input {...register('end_at')} type="datetime-local" min={minEndAt} className="input-field" />
                  {errors.end_at && <p className="text-red-500 text-xs mt-1">{errors.end_at.message}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">รูปภาพสินค้า</h2>
            {session?.user?.id && (
              <ImageUpload sellerId={session.user.id} value={images} onChange={setImages} maxImages={5} />
            )}
          </div>

          <div className="flex gap-3">
            <Link href="/seller/products" className="btn-secondary flex-1 text-center">ยกเลิก</Link>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
