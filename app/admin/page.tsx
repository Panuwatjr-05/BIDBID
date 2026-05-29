'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Users, Store, Package, Gavel, TrendingUp, Shield, UserCheck, UserX } from 'lucide-react'
import type { AdminStats } from '@/types'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') { router.push('/'); return }
    if (status === 'authenticated') loadStats()
  }, [status, session])

  async function loadStats() {
    const res = await fetch('/api/admin/stats')
    const json = await res.json()
    setStats(json.data)
    setLoading(false)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats?.total_users ?? 0, icon: Users, color: 'text-primary-500 bg-primary-50', href: '/admin/users' },
    { label: 'ผู้ขาย', value: stats?.total_sellers ?? 0, icon: UserCheck, color: 'text-green-500 bg-green-50', href: '/admin/users?role=SELLER' },
    { label: 'ผู้ซื้อ', value: stats?.total_buyers ?? 0, icon: Users, color: 'text-blue-500 bg-blue-50', href: '/admin/users?role=BUYER' },
    { label: 'ร้านค้าทั้งหมด', value: stats?.total_stores ?? 0, icon: Store, color: 'text-purple-500 bg-purple-50', href: '/admin/stores' },
    { label: 'ร้านที่เปิดอยู่', value: stats?.active_stores ?? 0, icon: Shield, color: 'text-emerald-500 bg-emerald-50', href: '/admin/stores?is_active=true' },
    { label: 'สินค้าทั้งหมด', value: stats?.total_products ?? 0, icon: Package, color: 'text-orange-500 bg-orange-50', href: '/admin/products' },
    { label: 'การประมูลทั้งหมด', value: stats?.total_auctions ?? 0, icon: Gavel, color: 'text-auction-500 bg-auction-50', href: '/admin/products?type=AUCTION' },
    { label: 'ประมูลที่ดำเนินอยู่', value: stats?.active_auctions ?? 0, icon: TrendingUp, color: 'text-red-500 bg-red-50', href: '/admin/products?type=AUCTION&status=ACTIVE' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดแอดมิน</h1>
          <p className="text-gray-500 text-sm">ภาพรวมระบบ BIDBID</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="stat-card hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 group-hover:text-primary-600 transition-colors">{label}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'จัดการร้านค้า', desc: 'ดู ระงับ หรือเปิดใช้งานร้านค้า', href: '/admin/stores', icon: Store, color: 'bg-purple-500' },
            { title: 'จัดการสินค้า', desc: 'ดูและลบสินค้าทั้งหมดในระบบ', href: '/admin/products', icon: Package, color: 'bg-orange-500' },
            { title: 'จัดการผู้ใช้', desc: 'ดูรายการผู้ใช้ทั้งหมด', href: '/admin/users', icon: Users, color: 'bg-primary-500' },
          ].map(({ title, desc, href, icon: Icon, color }) => (
            <Link key={title} href={href} className="card hover:shadow-md transition-shadow flex items-center gap-4">
              <div className={`w-12 h-12 ${color} text-white rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
