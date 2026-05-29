'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice } from '@/lib/helpers'
import {
  Package, ShoppingBag, Gavel, Plus,
  Eye, CheckCircle, XCircle, Tag
} from 'lucide-react'
import StoreAvatar from '@/components/StoreAvatar'
import type { Product, Store as StoreType } from '@/types'

interface SellerStats {
  total_products: number
  active_products: number
  sold_products: number
  ended_products: number
  total_bids: number
  fixed_count: number
  auction_count: number
}

export default function SellerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [store, setStore] = useState<StoreType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SELLER') {
      router.push(session.user.role === 'BUYER' ? '/buyer' : '/admin'); return
    }
    if (status === 'authenticated') loadData()
  }, [status, session])

  async function loadData() {
    const [statsRes, storeRes] = await Promise.all([
      fetch('/api/seller/dashboard'),
      fetch(`/api/stores?user_id=${session?.user?.id}`),
    ])
    const statsJson = await statsRes.json()
    const storeJson = await storeRes.json()

    const myStore: StoreType | null = storeJson.data?.[0] ?? null
    setStore(myStore)
    setStats(statsJson.data)

    if (myStore) {
      // ดึงทุก status ไม่กรองเฉพาะ ACTIVE
      const [activeRes, soldRes, endedRes] = await Promise.all([
        fetch(`/api/products?store_id=${myStore.id}&pageSize=20&status=ACTIVE`),
        fetch(`/api/products?store_id=${myStore.id}&pageSize=20&status=SOLD`),
        fetch(`/api/products?store_id=${myStore.id}&pageSize=20&status=ENDED`),
      ])
      const [activeJson, soldJson, endedJson] = await Promise.all([
        activeRes.json(), soldRes.json(), endedRes.json(),
      ])
      const all = [
        ...(activeJson.data ?? []),
        ...(endedJson.data ?? []),
        ...(soldJson.data ?? []),
      ]
      setRecentProducts(all)
    }
    setLoading(false)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  const statCards = [
    {
      label: 'สินค้าทั้งหมด', value: stats?.total_products ?? 0,
      icon: Package, color: 'text-primary-600 bg-primary-50',
      sub: `${stats?.fixed_count ?? 0} คงที่  •  ${stats?.auction_count ?? 0} ประมูล`
    },
    {
      label: 'กำลังขายอยู่', value: stats?.active_products ?? 0,
      icon: CheckCircle, color: 'text-green-600 bg-green-50',
      sub: 'สินค้าที่แสดงในตลาด'
    },
    {
      label: 'ขายหมด / ปิดแล้ว', value: (stats?.sold_products ?? 0) + (stats?.ended_products ?? 0),
      icon: XCircle, color: 'text-gray-500 bg-gray-100',
      sub: `ขายแล้ว ${stats?.sold_products ?? 0}  •  ปิดขาย ${stats?.ended_products ?? 0}`
    },
    {
      label: 'การเสนอราคาทั้งหมด', value: stats?.total_bids ?? 0,
      icon: Gavel, color: 'text-auction-500 bg-auction-50',
      sub: 'จากสินค้าประมูลทั้งหมด'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดผู้ขาย</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {store ? store.store_name : 'ยินดีต้อนรับ'} · {session?.user.name}
            </p>
          </div>
          <Link href="/seller/products/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มสินค้า
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="stat-card">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* All products */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">สินค้าทั้งหมด ({recentProducts.length})</h2>
              <Link href="/seller/products" className="text-sm text-primary-600 hover:underline">
                จัดการทั้งหมด →
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มีสินค้าที่กำลังขาย</p>
                <Link href="/seller/products/new" className="text-primary-600 text-sm mt-1 inline-block hover:underline">
                  เพิ่มสินค้าแรก
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/seller/products/${p.id}/edit`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          p.type === 'AUCTION' ? 'bg-auction-100 text-auction-700' : 'bg-primary-100 text-primary-700'
                        }`}>
                          {p.type === 'AUCTION' ? <Gavel className="w-2.5 h-2.5" /> : <Tag className="w-2.5 h-2.5" />}
                          {p.type === 'AUCTION' ? 'ประมูล' : 'คงที่'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          p.status === 'ACTIVE' ? 'bg-green-100 text-green-700'
                          : p.status === 'SOLD'  ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status === 'ACTIVE' ? 'เปิดขาย' : p.status === 'SOLD' ? 'ขายหมด' : 'ปิดขาย'}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate group-hover:text-primary-600 max-w-xs">
                        {p.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {p.fixed_product && (
                        <p className="font-bold text-primary-600 text-sm">{formatPrice(p.fixed_product.price)}</p>
                      )}
                      {p.auction_product && (
                        <p className="font-bold text-auction-600 text-sm">{formatPrice(p.auction_product.current_bid)}</p>
                      )}
                      <p className="flex items-center gap-1 text-[10px] text-gray-400 justify-end mt-0.5">
                        <Eye className="w-3 h-3" /> {p.views} ครั้ง
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Store + quick actions */}
          <div className="space-y-4">
            {/* Store card */}
            <div className="card text-center">
              <div className="flex justify-center mb-3">
                <StoreAvatar logoUrl={store?.logo_url ?? null} storeName={store?.store_name ?? ''} size={72} />
              </div>
              {store ? (
                <>
                  <p className="font-bold text-gray-900">{store.store_name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{store.line_id}</p>
                  {store.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{store.description}</p>
                  )}
                  <div className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-full font-medium ${
                    store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {store.is_active ? '● เปิดให้บริการ' : '● ถูกระงับ'}
                  </div>
                  <Link href="/seller/store" className="btn-secondary w-full block text-center text-sm mt-3">
                    แก้ไขข้อมูลร้าน
                  </Link>
                </>
              ) : (
                <p className="text-gray-400 text-sm">ไม่พบข้อมูลร้านค้า</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="card space-y-2">
              <p className="font-semibold text-gray-900 text-sm mb-3">เมนูด่วน</p>
              {[
                { href: '/seller/products/new',          label: 'เพิ่มสินค้าใหม่',      icon: Plus,        color: 'text-primary-600' },
                { href: '/seller/products',              label: 'จัดการสินค้าทั้งหมด',   icon: Package,     color: 'text-gray-600' },
                { href: `/stores/${store?.id ?? ''}`,    label: 'ดูร้านในตลาด',          icon: ShoppingBag, color: 'text-green-600' },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link key={label} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                  <span className="text-sm text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
