'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice, getImageUrl } from '@/lib/helpers'
import { Plus, Edit, Trash2, Eye, Gavel, Tag, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product, Store } from '@/types'

export default function SellerProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'SELLER') { router.push('/'); return }
    if (status === 'authenticated') loadData()
  }, [status, session])

  async function loadData() {
    const storeRes = await fetch(`/api/stores?user_id=${session?.user?.id}`)
    const storeJson = await storeRes.json()
    const myStore: Store | null = storeJson.data?.[0] ?? null

    if (myStore) {
      const res = await fetch(`/api/products?store_id=${myStore.id}&pageSize=100`)
      const json = await res.json()
      setProducts(json.data ?? [])
    }
    setLoading(false)
  }

  async function handleDelete(productId: string) {
    if (!confirm('ต้องการลบสินค้านี้?')) return
    setDeleting(productId)
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success('ลบสินค้าสำเร็จ')
    } else {
      toast.error('ลบสินค้าไม่สำเร็จ')
    }
    setDeleting(null)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
            <p className="text-sm text-gray-500">{products.length} รายการ</p>
          </div>
          <Link href="/seller/products/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มสินค้า
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="card text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">ยังไม่มีสินค้า</p>
            <p className="text-gray-400 text-sm mb-6">เริ่มต้นขายสินค้าชิ้นแรกของคุณ</p>
            <Link href="/seller/products/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มสินค้าแรก
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {/* Image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <Image
                    src={getImageUrl(product.images)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg' }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${product.type === 'AUCTION' ? 'bg-auction-100 text-auction-700' : 'bg-primary-100 text-primary-700'}`}>
                      {product.type === 'AUCTION' ? <><Gavel className="w-3 h-3" /> ประมูล</> : <><Tag className="w-3 h-3" /> คงที่</>}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.status === 'ACTIVE' ? 'ขายอยู่' : product.status === 'SOLD' ? 'ขายแล้ว' : 'สิ้นสุด'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.category}</p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {product.fixed_product && (
                    <p className="font-bold text-primary-600">{formatPrice(product.fixed_product.price)}</p>
                  )}
                  {product.auction_product && (
                    <>
                      <p className="font-bold text-auction-600">{formatPrice(product.auction_product.current_bid)}</p>
                      <p className="text-xs text-gray-400">ราคาปัจจุบัน</p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/marketplace/${product.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="ดูสินค้า"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
