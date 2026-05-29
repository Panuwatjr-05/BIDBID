'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Gavel, Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@/types'

const schema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  role: z.enum(['BUYER', 'SELLER']),
  store_name: z.string().optional(),
  line_id: z.string().optional(),
  store_description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'BUYER' },
  })

  const role = watch('role')

  async function onSubmit(data: FormData) {
    if (data.role === 'SELLER' && (!data.store_name || !data.line_id)) {
      toast.error('กรุณากรอกชื่อร้านและ LINE ID')
      return
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      toast.error(json.error ?? 'สมัครสมาชิกไม่สำเร็จ')
      return
    }

    toast.success('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-2xl">
            <Gavel className="w-7 h-7" />
            BIDBID
          </Link>
          <p className="text-gray-500 mt-2">สร้างบัญชีใหม่</p>
        </div>

        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-6">สมัครสมาชิก</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทบัญชี</label>
              <div className="grid grid-cols-2 gap-3">
                {(['BUYER', 'SELLER'] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      role === r ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input {...register('role')} type="radio" value={r} className="sr-only" />
                    <span className="font-medium text-sm">
                      {r === 'BUYER' ? 'ผู้ซื้อ' : 'ผู้ขาย'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <input {...register('name')} placeholder="ชื่อของคุณ" className="input-field" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input {...register('email')} type="email" placeholder="your@email.com" className="input-field" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Seller fields */}
            {role === 'SELLER' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700">ข้อมูลร้านค้า</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อร้าน *</label>
                  <input {...register('store_name')} placeholder="ชื่อร้านของคุณ" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID *</label>
                  <input {...register('line_id')} placeholder="@your-line-id" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายร้าน</label>
                  <textarea {...register('store_description')} placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." className="input-field h-20 resize-none" />
                </div>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
