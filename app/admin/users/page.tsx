'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatDate } from '@/lib/helpers'
import { ArrowLeft, Users } from 'lucide-react'
import type { User } from '@/types'

const ROLE_LABELS: Record<string, string> = { ADMIN: 'แอดมิน', SELLER: 'ผู้ขาย', BUYER: 'ผู้ซื้อ' }
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  SELLER: 'bg-green-100 text-green-700',
  BUYER: 'bg-blue-100 text-blue-700',
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>}>
      <AdminUsersContent />
    </Suspense>
  )
}

function AdminUsersContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const roleFilter = searchParams.get('role') ?? ''

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') { router.push('/'); return }
    if (status === 'authenticated') loadUsers()
  }, [status, session, roleFilter])

  async function loadUsers() {
    const params = new URLSearchParams()
    if (roleFilter) params.set('role', roleFilter)
    const res = await fetch(`/api/users?${params}`)
    const json = await res.json()
    setUsers(json.data ?? [])
    setLoading(false)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
            <p className="text-sm text-gray-500">{users.length} คน</p>
          </div>
        </div>

        {/* Role filter */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'ทั้งหมด', value: '' },
            { label: 'ผู้ขาย', value: 'SELLER' },
            { label: 'ผู้ซื้อ', value: 'BUYER' },
            { label: 'แอดมิน', value: 'ADMIN' },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => {
                const url = new URL(window.location.href)
                if (value) url.searchParams.set('role', value); else url.searchParams.delete('role')
                router.push(url.pathname + url.search)
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${roleFilter === value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">ชื่อ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">อีเมล</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">บทบาท</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่พบผู้ใช้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
