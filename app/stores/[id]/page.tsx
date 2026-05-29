'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { MessageCircle, Package, ArrowLeft, Tag, Gavel } from 'lucide-react'
import StoreAvatar from '@/components/StoreAvatar'
import { buildLineUrl } from '@/lib/helpers'
import type { Store as StoreType, Product } from '@/types'

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [store, setStore] = useState<StoreType | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FIXED' | 'AUCTION'>('ALL')

  const load = useCallback(async () => {
    const [storeRes, productsRes] = await Promise.all([
      fetch(`/api/stores/${id}`),
      fetch(`/api/products?store_id=${id}&pageSize=50`),
    ])

    if (!storeRes.ok) { router.push('/stores'); return }

    const storeJson = await storeRes.json()
    const productsJson = await productsRes.json()

    setStore(storeJson.data)
    setProducts(productsJson.data ?? [])
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  const displayed = typeFilter === 'ALL'
    ? products
    : products.filter((p) => p.type === typeFilter)

  if (loading) return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  if (!store) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link href="/stores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> ร้านค้าทั้งหมด
        </Link>

        {/* Store header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <StoreAvatar logoUrl={store.logo_url} storeName={store.store_name} size={100} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{store.store_name}</h1>
              {store.description && (
                <p className="text-gray-500 mt-1">{store.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Package className="w-4 h-4" />
                  {products.length} สินค้า
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${store.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {store.is_active ? 'เปิดให้บริการ' : 'ปิดชั่วคราว'}
                </span>
              </div>
            </div>
            <a
              href={buildLineUrl(store.line_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-[#06C755] hover:bg-[#05b34e] text-white font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              <MessageCircle className="w-5 h-5" />
              ติดต่อทาง LINE
            </a>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-bold text-gray-900 mr-2">สินค้าในร้าน</h2>
          {(['ALL', 'FIXED', 'AUCTION'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === t
                  ? t === 'AUCTION' ? 'bg-auction-500 text-white' : 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t === 'ALL' && 'ทั้งหมด'}
              {t === 'FIXED' && <><Tag className="w-3 h-3" /> ราคาคงที่</>}
              {t === 'AUCTION' && <><Gavel className="w-3 h-3" /> ประมูล</>}
            </button>
          ))}
        </div>

        {/* Products */}
        {displayed.length === 0 ? (
          <div className="card text-center py-16">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ไม่มีสินค้าในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
