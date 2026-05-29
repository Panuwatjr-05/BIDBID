'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice, getImageUrl } from '@/lib/helpers'
import { ArrowLeft, Trash2, Package, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>}>
      <AdminProductsContent />
    </Suspense>
  )
}

function AdminProductsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const typeFilter = searchParams.get('type') ?? ''
  const statusFilter = searchParams.get('status') ?? 'ACTIVE'

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') { router.push('/'); return }
    if (status === 'authenticated') loadProducts()
  }, [status, session, typeFilter, statusFilter])

  async function loadProducts() {
    const params = new URLSearchParams({ pageSize: '50', status: statusFilter })
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/products?${params}`)
    const json = await res.json()
    setProducts(json.data ?? [])
    setTotal(json.count ?? 0)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบสินค้านี้?')) return
    setDeleting(id)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
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
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้า</h1>
            <p className="text-sm text-gray-500">{total} รายการ</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: 'ทั้งหมด', type: '', status: 'ACTIVE' },
            { label: 'ราคาคงที่', type: 'FIXED', status: 'ACTIVE' },
            { label: 'ประมูล', type: 'AUCTION', status: 'ACTIVE' },
            { label: 'ขายแล้ว', type: '', status: 'SOLD' },
            { label: 'สิ้นสุด', type: '', status: 'ENDED' },
          ].map(({ label, type, status: s }) => {
            const isActive = typeFilter === type && statusFilter === s
            return (
              <button
                key={label}
                onClick={() => {
                  const url = new URL(window.location.href)
                  if (type) url.searchParams.set('type', type); else url.searchParams.delete('type')
                  url.searchParams.set('status', s)
                  router.push(url.pathname + url.search)
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                <Image
                  src={getImageUrl(product.images)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg' }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{product.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.type === 'AUCTION' ? 'bg-auction-100 text-auction-700' : 'bg-primary-100 text-primary-700'}`}>
                    {product.type === 'AUCTION' ? 'ประมูล' : 'คงที่'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">ร้าน: {product.store?.store_name}</p>
              </div>

              <div className="text-right flex-shrink-0">
                {product.fixed_product && (
                  <p className="font-bold text-primary-600 text-sm">{formatPrice(product.fixed_product.price)}</p>
                )}
                {product.auction_product && (
                  <p className="font-bold text-auction-600 text-sm">{formatPrice(product.auction_product.current_bid)}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                  <Eye className="w-3 h-3" /> {product.views}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link href={`/marketplace/${product.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                  <Eye className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deleting === product.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่พบสินค้า</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
