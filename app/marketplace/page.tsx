'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Search, Gavel, Tag, X } from 'lucide-react'
import type { Product } from '@/types'
import { PRODUCT_CATEGORIES } from '@/types'

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>}>
      <MarketplaceContent />
    </Suspense>
  )
}

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 12

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    if (category) params.set('category', category)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))

    const res = await fetch(`/api/products?${params}`)
    const json = await res.json()
    setProducts(json.data ?? [])
    setTotal(json.count ?? 0)
    setLoading(false)
  }, [search, type, category, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  function clearFilters() {
    setSearch('')
    setType('')
    setCategory('')
    setPage(1)
  }

  const hasFilters = search || type || category
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ตลาดซื้อขาย</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total.toLocaleString()} รายการ
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาสินค้า..."
                className="input-field pl-10"
              />
            </div>
            <button type="submit" className="btn-primary px-5">
              ค้นหา
            </button>
          </form>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Type filter */}
            <button
              onClick={() => { setType(''); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => { setType('FIXED'); setPage(1) }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'FIXED' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Tag className="w-3 h-3" /> ราคาคงที่
            </button>
            <button
              onClick={() => { setType('AUCTION'); setPage(1) }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${type === 'AUCTION' ? 'bg-auction-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Gavel className="w-3 h-3" /> ประมูล
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Category filter */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">ทุกหมวดหมู่</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
                <X className="w-3 h-3" /> ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
          <LoadingSpinner className="py-20" size="lg" />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">ไม่พบสินค้า</p>
            <button onClick={clearFilters} className="mt-4 text-primary-600 text-sm hover:underline">
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  ก่อนหน้า
                </button>
                <span className="text-sm text-gray-500">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
