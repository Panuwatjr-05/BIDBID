'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Gavel, Tag, Eye, ImageOff } from 'lucide-react'
import { formatPrice } from '@/lib/helpers'
import AuctionTimer from './AuctionTimer'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const isAuction = product.type === 'AUCTION'
  const hasImage = product.images.length > 0 && product.images[0] !== ''

  return (
    <Link href={`/marketplace/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {hasImage ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
              <ImageOff className="w-10 h-10" />
            </div>
          )}

          {/* Badge */}
          <div
            className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isAuction ? 'bg-auction-500 text-white' : 'bg-primary-600 text-white'
            }`}
          >
            {isAuction ? <Gavel className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
            {isAuction ? 'ประมูล' : 'ราคาคงที่'}
          </div>

          {product.status === 'ENDED' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">สิ้นสุดแล้ว</span>
            </div>
          )}
          {product.status === 'SOLD' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">ขายแล้ว</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 mb-2">{product.category}</p>

          {isAuction && product.auction_product ? (
            <div>
              <p className="text-xs text-gray-500">ราคาปัจจุบัน</p>
              <p className="text-lg font-bold text-auction-600">
                {formatPrice(product.auction_product.current_bid)}
              </p>
              <div className="mt-2">
                <AuctionTimer endAt={product.auction_product.end_at} compact />
              </div>
            </div>
          ) : product.fixed_product ? (
            <p className="text-lg font-bold text-primary-600">
              {formatPrice(product.fixed_product.price)}
            </p>
          ) : null}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{product.store?.store_name ?? 'ร้านค้า'}</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              {product.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
