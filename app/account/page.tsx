'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import AvatarUpload from '@/components/AvatarUpload'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatDate } from '@/lib/helpers'
import { User, Mail, ShieldCheck, Calendar, Lock, Store, Eye, EyeOff } from 'lucide-react'
import type { User as UserType } from '@/types'

const profileSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'กรุณากรอกรหัสผ่านเดิม'),
  new_password: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'รหัสผ่านใหม่ไม่ตรงกัน',
  path: ['confirm_password'],
})

type ProfileForm   = z.infer<typeof profileSchema>
type PasswordForm  = z.infer<typeof passwordSchema>

const ROLE_LABEL: Record<string, string> = { BUYER: 'ผู้ซื้อ', SELLER: 'ผู้ขาย', ADMIN: 'แอดมิน' }
const ROLE_COLOR: Record<string, string> = {
  BUYER:  'bg-blue-100 text-blue-700',
  SELLER: 'bg-green-100 text-green-700',
  ADMIN:  'bg-red-100 text-red-700',
}

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [user, setUser]     = useState<UserType | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPwd,  setShowPwd]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showConf, setShowConf] = useState(false)

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated') loadUser()
  }, [status])

  async function loadUser() {
    const res  = await fetch('/api/users/me')
    const json = await res.json()
    if (res.ok) {
      setUser(json.data)
      setAvatar(json.data.avatar_url ?? null)
      profileForm.reset({ name: json.data.name })
    }
    setLoading(false)
  }

  async function handleAvatarUpload(url: string) {
    setAvatar(url)
    await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    await update()
  }

  async function onProfileSubmit(data: ProfileForm) {
    const res  = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error); return }
    setUser(json.data)
    await update({ name: data.name })
    toast.success('อัปเดตชื่อสำเร็จ')
  }

  async function onPasswordSubmit(data: PasswordForm) {
    const res  = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error); return }
    toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
    passwordForm.reset()
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าบัญชี</h1>

        {/* ── Profile card ── */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-5">โปรไฟล์</h2>

          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
            <AvatarUpload
              currentUrl={avatar}
              name={user.name}
              size={96}
              onUpload={handleAvatarUpload}
            />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLOR[user.role]}`}>
                {ROLE_LABEL[user.role]}
              </span>
            </div>
          </div>

          {/* Edit name form */}
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อที่แสดง</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...profileForm.register('name')}
                  className="input-field pl-10"
                  placeholder="ชื่อของคุณ"
                />
              </div>
              {profileForm.formState.errors.name && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="btn-primary w-full sm:w-auto px-8"
            >
              {profileForm.formState.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกชื่อ'}
            </button>
          </form>
        </div>

        {/* ── Account info ── */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">ข้อมูลบัญชี</h2>
          <div className="space-y-3">
            {[
              { icon: Mail,        label: 'อีเมล',        value: user.email },
              { icon: ShieldCheck, label: 'บทบาท',        value: ROLE_LABEL[user.role] },
              { icon: Calendar,    label: 'สมัครสมาชิกเมื่อ', value: formatDate(user.created_at) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Change password ── */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> เปลี่ยนรหัสผ่าน
          </h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {/* Current */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านเดิม</label>
              <div className="relative">
                <input
                  {...passwordForm.register('current_password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>

            {/* New */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  {...passwordForm.register('new_password')}
                  type={showNew ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  {...passwordForm.register('confirm_password')}
                  type={showConf ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowConf(!showConf)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="btn-primary w-full sm:w-auto px-8"
            >
              {passwordForm.formState.isSubmitting ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        </div>

        {/* ── Seller shortcut ── */}
        {user.role === 'SELLER' && (
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">ตั้งค่าร้านค้า</p>
                <p className="text-xs text-gray-400">แก้ไขชื่อร้าน LINE ID คำอธิบาย</p>
              </div>
            </div>
            <Link href="/seller/store" className="btn-secondary text-sm px-4 py-2">
              จัดการร้าน
            </Link>
          </div>
        )}

        {/* ── Danger zone ── */}
        <div className="card border-red-100">
          <h2 className="font-bold text-red-600 mb-3">โซนอันตราย</h2>
          <p className="text-sm text-gray-500 mb-4">ออกจากระบบจากทุกอุปกรณ์</p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-danger text-sm px-6 py-2"
          >
            ออกจากระบบ
          </button>
        </div>

      </div>
    </div>
  )
}
