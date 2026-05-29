'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getCountdown } from '@/lib/helpers'
import { cn } from '@/lib/helpers'

interface Props {
  endAt: string
  compact?: boolean
  onExpire?: () => void
}

export default function AuctionTimer({ endAt, compact = false, onExpire }: Props) {
  const [countdown, setCountdown] = useState(getCountdown(endAt))

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getCountdown(endAt)
      setCountdown(next)
      if (next.isExpired) {
        clearInterval(timer)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endAt, onExpire])

  if (countdown.isExpired) {
    return (
      <div className={cn('flex items-center gap-1 text-red-500', compact ? 'text-xs' : 'text-sm')}>
        <Clock className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span className="font-medium">สิ้นสุดแล้ว</span>
      </div>
    )
  }

  const isUrgent = countdown.days === 0 && countdown.hours < 1

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 text-xs', isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500')}>
        <Clock className="w-3 h-3" />
        {countdown.days > 0 ? (
          <span>{countdown.days}ว {countdown.hours}ช</span>
        ) : (
          <span>
            {String(countdown.hours).padStart(2, '0')}:
            {String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className={cn('text-xs font-medium', isUrgent ? 'text-red-500' : 'text-gray-500')}>
        เวลาที่เหลือ
      </p>
      <div className="flex items-center gap-2">
        {countdown.days > 0 && (
          <TimeBlock value={countdown.days} label="วัน" urgent={isUrgent} />
        )}
        <TimeBlock value={countdown.hours} label="ชั่วโมง" urgent={isUrgent} />
        <TimeBlock value={countdown.minutes} label="นาที" urgent={isUrgent} />
        <TimeBlock value={countdown.seconds} label="วินาที" urgent={isUrgent} />
      </div>
    </div>
  )
}

function TimeBlock({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold',
        urgent ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-800'
      )}
    >
      <span className="text-xl leading-none">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] font-normal text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}
