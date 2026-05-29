'use client'

import { formatPrice, timeAgo } from '@/lib/helpers'
import type { BidWithUser } from '@/types'
import { Crown } from 'lucide-react'

interface Props {
  bids: BidWithUser[]
}

export default function BidList({ bids }: Props) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>ยังไม่มีการประมูล เป็นคนแรก!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {bids.map((bid, index) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between p-3 rounded-xl ${
            index === 0 ? 'bg-auction-50 border border-auction-200' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {index === 0 && <Crown className="w-4 h-4 text-auction-500" />}
            <div>
              <p className="font-medium text-sm text-gray-900">{bid.user?.name ?? 'ผู้ประมูล'}</p>
              <p className="text-xs text-gray-400">{timeAgo(bid.created_at)}</p>
            </div>
          </div>
          <p className={`font-bold ${index === 0 ? 'text-auction-600 text-base' : 'text-gray-700 text-sm'}`}>
            {formatPrice(bid.amount)}
          </p>
        </div>
      ))}
    </div>
  )
}
