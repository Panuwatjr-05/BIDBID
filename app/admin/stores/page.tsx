'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatDate } from '@/lib/helpers'
import { ArrowLeft, Store, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Store as StoreType } from '@/types'

export default function AdminStoresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>}>
      <AdminStoresContent />
    </Suspense>
  )
}

function AdminStoresContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const isActiveFilter = searchParams.get('is_active')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'ADMIN') { router.push('/'); return }
    if (status === 'authenticated') loadStores()
  }, [status, session, isActiveFilter])

  async function loadStores() {
    const params = new URLSearchParams()
    if (isActiveFilter) params.set('is_active', isActiveFilter)
    const res = await fetch(`/api/stores?${params}`)
    const json = await res.json()
    setStores(json.data ?? [])
    setLoading(false)
  }

  async function toggleStore(storeId: string, currentActive: boolean) {
    setToggling(storeId)
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    })
    const json = await res.json()
    if (res.ok) {
      setStores((prev) => prev.map((s) => s.id === storeId ? { ...s, is_active: !currentActive } : s))
      toast.success(!currentActive ? 'เปิดใช้งานร้านค้าสำเร็จ' : 'ระงับร้านค้าสำเร็จ')
    } else {
      toast.error(json.error)
    }
    setToggling(null)
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
            <h1 className="text-2xl font-bold text-gray-900">จัดการร้านค้า</h1>
            <p className="text-sm text-gray-500">{stores.length} ร้านค้า</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'ทั้งหมด', value: null },
            { label: 'เปิดอยู่', value: 'true' },
            { label: 'ถูกระงับ', value: 'false' },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => {
                const url = new URL(window.location.href)
                if (value) url.searchParams.set('is_active', value)
                else url.searchParams.delete('is_active')
                router.push(url.pathname + url.search)
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActiveFilter === value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{store.store_name}</p>
                <p className="text-sm text-gray-500">LINE: {store.line_id}</p>
                {store.description && <p className="text-xs text-gray-400 truncate">{store.description}</p>}
              </div>
              <div className="text-right flex-shrink-0 mr-4">
                <p className="text-xs text-gray-400">{formatDate(store.created_at)}</p>
              </div>
              <button
                onClick={() => toggleStore(store.id, store.is_active)}
                disabled={toggling === store.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${store.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
              >
                {store.is_active ? (
                  <><XCircle className="w-4 h-4" /> ระงับ</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> เปิดใช้งาน</>
                )}
              </button>
            </div>
          ))}

          {stores.length === 0 && (
            <div className="card text-center py-12 text-gray-400">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>ไม่พบร้านค้า</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
