'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { formatPrice, timeAgo } from '@/lib/helpers'
import { Gavel, Clock, Crown, Search } from 'lucide-react'
import type { BidWithUser, AuctionProduct, Product } from '@/types'

interface BidWithProduct extends BidWithUser {
  auction_product?: AuctionProduct & { product?: Product }
}

export default function BuyerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bids, setBids] = useState<BidWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return }
    if (status === 'authenticated' && session.user.role !== 'BUYER') {
      router.push(session.user.role === 'SELLER' ? '/seller' : '/admin')
      return
    }
    if (status === 'authenticated') fetchBids()
  }, [status, session])

  async function fetchBids() {
    const res = await fetch(`/api/bids?buyer_id=${session?.user?.id}`)
    const json = await res.json()
    setBids(json.data ?? [])
    setLoading(false)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  }

  const winningBids = bids.filter((b, index) => {
    const grouped = bids.filter((bid) => bid.auction_product_id === b.auction_product_id)
    return grouped[0]?.id === b.id
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดผู้ซื้อ</h1>
          <p className="text-gray-500 text-sm">สวัสดี, {session?.user.name}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-auction-50 rounded-xl flex items-center justify-center">
                <Gavel className="w-5 h-5 text-auction-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{bids.length}</p>
                <p className="text-sm text-gray-500">การประมูลทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{winningBids.length}</p>
                <p className="text-sm text-gray-500">กำลังนำอยู่</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link href="/marketplace" className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">ค้นหาสินค้า</p>
              <p className="text-sm text-gray-500">ไปยังหน้าตลาด</p>
            </div>
          </Link>
          <Link href="/marketplace?type=AUCTION" className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-auction-50 rounded-xl flex items-center justify-center">
              <Gavel className="w-6 h-6 text-auction-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">ดูการประมูล</p>
              <p className="text-sm text-gray-500">สินค้าประมูลทั้งหมด</p>
            </div>
          </Link>
        </div>

        {/* Bid history */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ประวัติการประมูล</h2>
          {bids.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Gavel className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>คุณยังไม่มีประวัติการประมูล</p>
              <Link href="/marketplace?type=AUCTION" className="text-primary-600 text-sm mt-2 inline-block hover:underline">
                เริ่มประมูลเลย
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {timeAgo(bid.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">ID: {bid.auction_product_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-auction-600">{formatPrice(bid.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
