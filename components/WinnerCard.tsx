import Image from 'next/image'
import { Crown, Trophy, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/helpers'
import type { AuctionProduct } from '@/types'

interface Props {
  auction: AuctionProduct & {
    winner?: { id: string; name: string; avatar_url: string | null } | null
  }
  currentUserId?: string
}

export default function WinnerCard({ auction, currentUserId }: Props) {
  // ไม่มีคนประมูลเลย
  if (!auction.winner_id || !auction.winner) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="font-medium text-gray-600">การประมูลสิ้นสุดแล้ว</p>
        <p className="text-xs text-gray-400 mt-1">ไม่มีผู้เสนอราคา</p>
      </div>
    )
  }

  const isWinner = currentUserId === auction.winner_id
  const initial = auction.winner.name.charAt(0).toUpperCase()

  return (
    <div className={`rounded-xl p-4 border-2 ${
      isWinner
        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400'
        : 'bg-gradient-to-br from-auction-50 to-orange-50 border-auction-200'
    }`}>
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <Trophy className={`w-4 h-4 ${isWinner ? 'text-yellow-600' : 'text-auction-600'}`} />
        <p className={`font-bold text-sm ${isWinner ? 'text-yellow-700' : 'text-auction-700'}`}>
          {isWinner ? '🎉 คุณคือผู้ชนะ!' : 'การประมูลสิ้นสุดแล้ว'}
        </p>
      </div>

      <div className="bg-white rounded-xl p-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ring-2 ring-yellow-300">
            {auction.winner.avatar_url ? (
              <Image
                src={auction.winner.avatar_url}
                alt={auction.winner.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span className="text-primary-700 font-bold text-lg">{initial}</span>
            )}
          </div>
          <Crown className="absolute -top-1.5 -right-1.5 w-5 h-5 text-yellow-500 fill-yellow-400 drop-shadow-md" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">ผู้ชนะการประมูล</p>
          <p className="font-bold text-gray-900 truncate">{auction.winner.name}</p>
        </div>

        {/* Final price */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">ราคาปิด</p>
          <p className="font-bold text-auction-600">{formatPrice(auction.current_bid)}</p>
        </div>
      </div>

      {isWinner && (
        <p className="text-xs text-yellow-700 text-center mt-3">
          กรุณาติดต่อร้านค้าผ่าน LINE เพื่อนัดรับสินค้า
        </p>
      )}
    </div>
  )
}
