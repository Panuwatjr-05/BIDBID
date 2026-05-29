'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  MessageCircle, Eye, Tag, Gavel, ArrowLeft,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import StoreAvatarComp from '@/components/StoreAvatar'
import Navbar from '@/components/Navbar'
import AuctionTimer from '@/components/AuctionTimer'
import BidList from '@/components/BidList'
import LoadingSpinner from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { formatPrice, buildLineUrl } from '@/lib/helpers'
import type { ProductWithDetails, BidWithUser } from '@/types'

interface BidForm {
  amount: number
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()

  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [bids, setBids] = useState<BidWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImg, setCurrentImg] = useState(0)
  const [auctionEnded, setAuctionEnded] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<BidForm>()

  const fetchProduct = useCallback(async () => {
    const res = await fetch(`/api/products/${id}`)
    if (!res.ok) { router.push('/marketplace'); return }
    const json = await res.json()
    setProduct(json.data)
    setLoading(false)
  }, [id, router])

  const fetchBids = useCallback(async (auctionProductId: string) => {
    const res = await fetch(`/api/bids?auction_product_id=${auctionProductId}`)
    const json = await res.json()
    setBids(json.data ?? [])
  }, [])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    if (!product?.auction_product) return
    fetchBids(product.auction_product.id)

    // Subscribe to real-time bid updates
    const channel = supabase
      .channel(`auction-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: `auction_product_id=eq.${product.auction_product.id}`,
      }, (payload) => {
        const newBid = payload.new as BidWithUser
        setBids((prev) => [newBid, ...prev])
        setProduct((prev) => {
          if (!prev?.auction_product) return prev
          return {
            ...prev,
            auction_product: {
              ...prev.auction_product,
              current_bid: newBid.amount,
            },
          }
        })
        toast.success('มีการเสนอราคาใหม่!')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [product?.auction_product?.id, id, fetchBids])

  async function onBid(data: BidForm) {
    if (!session) { router.push('/auth/login'); return }

    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auction_product_id: product?.auction_product?.id,
        amount: Number(data.amount),
      }),
    })

    const json = await res.json()
    if (!res.ok) { toast.error(json.error); return }

    toast.success('ประมูลสำเร็จ!')
    reset()
    fetchBids(product?.auction_product?.id ?? '')
  }

  if (loading) return <div className="min-h-screen"><Navbar /><LoadingSpinner className="py-40" size="lg" /></div>
  if (!product) return null

  const isAuction = product.type === 'AUCTION'
  const images = product.images.length > 0 ? product.images : ['/placeholder-product.svg']
  const minNextBid = product.auction_product
    ? product.auction_product.current_bid + product.auction_product.min_increment
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/marketplace" className="hover:text-primary-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> กลับไปตลาด
          </Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Image
                src={images[currentImg]}
                alt={product.name}
                fill
                className="object-contain p-4"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.svg' }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImg((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImg((p) => (p + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === currentImg ? 'border-primary-500' : 'border-gray-200'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Badge + Category */}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${isAuction ? 'bg-auction-100 text-auction-700' : 'bg-primary-100 text-primary-700'}`}>
                {isAuction ? <><Gavel className="w-3.5 h-3.5" /> ประมูล</> : <><Tag className="w-3.5 h-3.5" /> ราคาคงที่</>}
              </span>
              <span className="text-sm text-gray-500">{product.category}</span>
              <span className="ml-auto flex items-center gap-1 text-sm text-gray-400">
                <Eye className="w-4 h-4" /> {product.views} ครั้ง
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Fixed price */}
            {!isAuction && product.fixed_product && (
              <div className="card">
                <p className="text-3xl font-bold text-primary-600">
                  {formatPrice(product.fixed_product.price)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  เหลือ {product.fixed_product.stock} ชิ้น
                </p>
              </div>
            )}

            {/* Auction */}
            {isAuction && product.auction_product && (
              <div className="card space-y-4">
                <div>
                  <p className="text-sm text-gray-500">ราคาปัจจุบัน</p>
                  <p className="text-3xl font-bold text-auction-600">
                    {formatPrice(product.auction_product.current_bid)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    เริ่มต้นที่ {formatPrice(product.auction_product.starting_bid)} •{' '}
                    เพิ่มขั้นต่ำ {formatPrice(product.auction_product.min_increment)}
                  </p>
                </div>

                {!auctionEnded && product.status === 'ACTIVE' && (
                  <AuctionTimer endAt={product.auction_product.end_at} onExpire={() => setAuctionEnded(true)} />
                )}

                {auctionEnded || product.status === 'ENDED' ? (
                  <div className="bg-red-50 text-red-700 rounded-xl p-3 text-center font-medium">
                    การประมูลสิ้นสุดแล้ว
                  </div>
                ) : session?.user.role === 'BUYER' ? (
                  <form onSubmit={handleSubmit(onBid)} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        ราคาของคุณ (ขั้นต่ำ {formatPrice(minNextBid)})
                      </label>
                      <input
                        {...register('amount', {
                          required: true,
                          min: minNextBid,
                          valueAsNumber: true,
                        })}
                        type="number"
                        step="1"
                        min={minNextBid}
                        placeholder={String(minNextBid)}
                        className="input-field"
                      />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-auction w-full">
                      {isSubmitting ? 'กำลังประมูล...' : `ประมูลเลย`}
                    </button>
                  </form>
                ) : !session ? (
                  <Link href="/auth/login" className="btn-auction block text-center w-full">
                    เข้าสู่ระบบเพื่อประมูล
                  </Link>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
                    บัญชี <span className="font-semibold text-gray-700">ผู้ขาย</span> ไม่สามารถประมูลได้
                    <br />
                    <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
                      เข้าสู่ระบบด้วยบัญชีผู้ซื้อ
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Contact via LINE */}
            {product.store && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <StoreAvatarComp logoUrl={product.store.logo_url} storeName={product.store.store_name} size={56} />
                  <div>
                    <Link
                      href={`/stores/${product.store.id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {product.store.store_name}
                    </Link>
                    {product.store.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{product.store.description}</p>
                    )}
                  </div>
                </div>
                <a
                  href={buildLineUrl(product.store.line_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] hover:bg-[#05b34e] text-white font-semibold rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  ติดต่อทางร้าน (LINE)
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bid history */}
        {isAuction && (
          <div className="mt-8 card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">ประวัติการประมูล ({bids.length} รายการ)</h2>
            <BidList bids={bids} />
          </div>
        )}
      </div>
    </div>
  )
}
