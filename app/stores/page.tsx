'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Store, Package, Search } from 'lucide-react'
import StoreAvatar from '@/components/StoreAvatar'
import type { Store as StoreType } from '@/types'

export default function StoresPage() {
  const [stores, setStores] = useState<StoreType[]>([])
  const [filtered, setFiltered] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/stores?is_active=true')
      .then((r) => r.json())
      .then((j) => {
        setStores(j.data ?? [])
        setFiltered(j.data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!search.trim()) { setFiltered(stores); return }
    setFiltered(
      stores.filter((s) =>
        s.store_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    )
  }, [search, stores])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ร้านค้าทั้งหมด</h1>
          <p className="text-gray-500 mt-1">{stores.length} ร้านค้าในระบบ</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาร้านค้า..."
            className="input-field pl-11 max-w-md"
          />
        </div>

        {loading ? (
          <LoadingSpinner className="py-24" size="lg" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Store className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg">ไม่พบร้านค้า</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col gap-4"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <StoreAvatar logoUrl={store.logo_url} storeName={store.store_name} size={72} />
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {store.store_name}
                    </h2>
                    <p className="text-sm text-gray-400">{store.line_id}</p>
                  </div>
                </div>

                {store.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{store.description}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    ดูสินค้า
                  </span>
                  <span className="text-xs text-primary-600 font-medium group-hover:underline">
                    เข้าร้าน →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
