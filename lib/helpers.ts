import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns'
import { th } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: th })
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: th })
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: th })
}

export function getCountdown(endAt: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const total = differenceInSeconds(new Date(endAt), new Date())
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }

  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  return { days, hours, minutes, seconds, isExpired: false }
}

export function getImageUrl(images: string[]): string {
  if (images.length > 0) return images[0]
  return '/placeholder-product.svg'
}

export function buildLineUrl(lineId: string): string {
  // Trim และเอา URL/spaces ออก
  const id = lineId.trim()

  // ถ้าเป็น URL อยู่แล้ว → ใช้ตรงๆ
  if (/^https?:\/\//i.test(id)) return id

  // ถ้าเป็น Official Account (เริ่มด้วย @) → ใช้ /R/ti/p/ พร้อม encode @
  if (id.startsWith('@')) {
    return `https://line.me/R/ti/p/${encodeURIComponent(id)}`
  }

  // Personal ID ปกติ → ใส่ ~ นำหน้า (LINE format สำหรับ add friend)
  return `https://line.me/ti/p/~${id}`
}
