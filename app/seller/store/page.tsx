'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import StoreAvatar from '@/components/StoreAvatar'
import { ArrowLeft, Camera } from 'lucide-react'
import type { Store as StoreType } from '@/types'

interface StoreForm {
  store_name: string
  line_id: string
  description: string
}

export default function SellerStorePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [store, setStore]       = useState<StoreType | null>(null)
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading]   = useState(true)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<StoreForm>()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SELLER') { router.push('/'); return }
    if (status === 'authenticated') loadStore()
  }, [status, session])

  async function loadStore() {
    const res  = await fetch(`/api/stores?user_id=${session?.user?.id}`)
    const json = await res.json()
    const s: StoreType | null = json.data?.[0] ?? null
    setStore(s)
    setLogoUrl(s?.logo_url ?? null)
    if (s) reset({ store_name: s.store_name, line_id: s.line_id, description: s.description ?? '' })
    setLoading(false)
  }

  async function handleLogoUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) { toast.error('รูปต้องไม่เกิน 2MB'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'store-logo')
      const res  = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      // Save logo_url to store
      await fetch(`/api/stores/${store!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: json.url }),
      })
      setLogoUrl(json.url)
      toast.success('อัปโหลดโลโก้ร้านสำเร็จ')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    if (!store) return
    await fetch(`/api/stores/${store.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: null }),
    })
    setLogoUrl(null)
    toast.success('ลบโลโก้แล้ว')
  }

  async function onSubmit(data: StoreForm) {
    if (!store) return
    const res  = await fetch(`/api/stores/${store.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'เกิดข้อผิดพลาด'); return }
    toast.success('บันทึกข้อมูลร้านสำเร็จ')
    setStore(json.data)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">จัดการร้านค้า</h1>
        </div>

        <div className="space-y-5">
          {/* Logo upload */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">โลโก้ร้านค้า</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                <StoreAvatar logoUrl={logoUrl} storeName={store?.store_name ?? ''} size={96} />
                <label className={`absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera className="w-3.5 h-3.5" />
                  }
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">อัปโหลดโลโก้ร้าน</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP ขนาดไม่เกิน 2MB</p>
                <p className="text-xs text-gray-400">แนะนำ: รูปสี่เหลี่ยมจัตุรัส 200×200px</p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-xs text-red-500 hover:text-red-700 mt-2 underline"
                  >
                    ลบโลโก้
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Store info form */}
          <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
            <h2 className="font-semibold text-gray-900">ข้อมูลร้านค้า</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน *</label>
              <input {...register('store_name', { required: 'กรุณากรอกชื่อร้าน' })} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อ LINE *</label>
              <input
                {...register('line_id', { required: 'กรุณากรอกข้อมูลติดต่อ LINE' })}
                placeholder="https://line.me/ti/p/xxxxx หรือ @your-line-id"
                className="input-field"
              />
              <div className="mt-3 space-y-2">
                {/* Format options */}
                <div className="grid sm:grid-cols-3 gap-2">
                  <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                    <span className="absolute -top-2 left-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-semibold">แนะนำ</span>
                    <p className="text-xs font-semibold text-green-700 mt-1">ลิงก์เชิญ</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1 break-all leading-tight">line.me/ti/p/...</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-700">Official Account</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">@yourshop</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-700">LINE ID ส่วนตัว</p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">yourname</p>
                  </div>
                </div>

                {/* How-to */}
                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-base leading-none">💡</span>
                  <p>
                    วิธีหาลิงก์: เปิด <span className="font-semibold text-gray-700">LINE</span> → <span className="font-semibold text-gray-700">Settings</span> → <span className="font-semibold text-gray-700">Profile</span> → กด <span className="font-semibold text-gray-700">แชร์ลิงก์เชิญ</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายร้าน</label>
              <textarea {...register('description')} placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." className="input-field h-24 resize-none" />
            </div>

            {store && (
              <div className={`text-sm font-medium px-3 py-2 rounded-xl text-center ${store.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                สถานะร้าน: {store.is_active ? '● เปิดให้บริการ' : '● ถูกระงับโดยแอดมิน'}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลร้าน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
