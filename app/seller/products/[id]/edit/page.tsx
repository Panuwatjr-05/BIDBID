'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ArrowLeft, CheckCircle, XCircle, ShoppingBag } from 'lucide-react'
import { PRODUCT_CATEGORIES } from '@/types'
import type { ProductWithDetails, ProductStatus } from '@/types'

interface EditForm {
  name: string
  description: string
  category: string
  price?: number
  stock?: number
}

const STATUS_OPTIONS: { value: ProductStatus; label: string; desc: string; color: string; icon: typeof CheckCircle }[] = [
  { value: 'ACTIVE', label: 'เปิดขาย',      desc: 'สินค้าแสดงในตลาด ลูกค้าซื้อได้',    color: 'border-green-500 bg-green-50 text-green-700',  icon: CheckCircle },
  { value: 'ENDED',  label: 'ปิดการขาย',    desc: 'ซ่อนจากตลาด ยังเปิดได้ใหม่ในภายหลัง', color: 'border-gray-400 bg-gray-50 text-gray-600',     icon: XCircle },
  { value: 'SOLD',   label: 'ขายหมดแล้ว',  desc: 'ทำเครื่องหมายว่าขายออกไปแล้ว',      color: 'border-blue-500 bg-blue-50 text-blue-700',    icon: ShoppingBag },
]

export default function EditProductPage() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const { id }  = useParams<{ id: string }>()

  const [product,  setProduct]  = useState<ProductWithDetails | null>(null)
  const [images,   setImages]   = useState<string[]>([])
  const [prodStatus, setProdStatus] = useState<ProductStatus>('ACTIVE')
  const [savingStatus, setSavingStatus] = useState(false)
  const [loading,  setLoading]  = useState(true)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditForm>()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated') loadProduct()
  }, [status, id])

  async function loadProduct() {
    const res = await fetch(`/api/products/${id}`)
    if (!res.ok) { router.push('/seller/products'); return }
    const json = await res.json()
    const p: ProductWithDetails = json.data
    setProduct(p)
    setImages(p.images)
    setProdStatus(p.status)
    reset({
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      price: p.fixed_product?.price,
      stock: p.fixed_product?.stock,
    })
    setLoading(false)
  }

  async function onSubmit(data: EditForm) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, images }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'เกิดข้อผิดพลาด'); return }
    toast.success('บันทึกการเปลี่ยนแปลงสำเร็จ')
    router.push('/seller/products')
  }

  async function changeStatus(newStatus: ProductStatus) {
    if (newStatus === prodStatus) return
    setSavingStatus(true)
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'เปลี่ยนสถานะไม่สำเร็จ') }
    else {
      setProdStatus(newStatus)
      toast.success(`เปลี่ยนเป็น "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" แล้ว`)
    }
    setSavingStatus(false)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller/products" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขสินค้า</h1>
            <p className="text-sm text-gray-400 truncate max-w-xs">{product?.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── สถานะการขาย ── */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-1">สถานะการขาย</h2>
            <p className="text-xs text-gray-400 mb-4">เปลี่ยนสถานะทันทีโดยไม่ต้องกดบันทึก</p>
            <div className="grid grid-cols-3 gap-3">
              {STATUS_OPTIONS.map(({ value, label, desc, color, icon: Icon }) => {
                const active = prodStatus === value
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={savingStatus}
                    onClick={() => changeStatus(value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center disabled:opacity-60 ${
                      active ? color + ' shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current opacity-70" />
                    )}
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm leading-tight">{label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Current status banner */}
            {prodStatus === 'ENDED' && (
              <div className="mt-4 flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                สินค้าถูกปิดการขายอยู่ — ลูกค้าไม่เห็นสินค้านี้ในตลาด
              </div>
            )}
            {prodStatus === 'SOLD' && (
              <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700">
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                ทำเครื่องหมายว่าขายออกไปแล้ว
              </div>
            )}
          </div>

          {/* ── ข้อมูลสินค้า ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900">ข้อมูลสินค้า</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า *</label>
                <input {...register('name', { required: 'กรุณากรอกชื่อสินค้า' })} className="input-field" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea {...register('description')} className="input-field h-24 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่ *</label>
                <select {...register('category', { required: 'กรุณาเลือกหมวดหมู่' })} className="input-field">
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {product?.type === 'FIXED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                    <input {...register('price', { valueAsNumber: true })} type="number" min="1" step="0.01" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สต็อก</label>
                    <input {...register('stock', { valueAsNumber: true })} type="number" min="0" className="input-field" />
                  </div>
                </div>
              )}

              {product?.type === 'AUCTION' && (
                <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700">
                  สินค้าประมูลไม่สามารถแก้ไขราคาและวันสิ้นสุดได้หลังจากเริ่มแล้ว
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-3">รูปภาพสินค้า</h2>
              {session?.user?.id && (
                <ImageUpload sellerId={session.user.id} value={images} onChange={setImages} maxImages={5} />
              )}
            </div>

            <div className="flex gap-3">
              <Link href="/seller/products" className="btn-secondary flex-1 text-center">ยกเลิก</Link>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
