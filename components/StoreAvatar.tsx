import { Store } from 'lucide-react'

interface Props {
  logoUrl: string | null
  storeName: string
  size?: number
}

export default function StoreAvatar({ logoUrl, storeName, size = 64 }: Props) {
  const radius = size >= 80 ? 'rounded-3xl' : 'rounded-2xl'

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={storeName}
        width={size}
        height={size}
        className={`${radius} object-cover flex-shrink-0 ring-2 ring-white shadow-md`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // fallback ถ้าโหลดรูปไม่ได้
          const target = e.currentTarget
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) parent.setAttribute('data-fallback', 'true')
        }}
      />
    )
  }

  const initials = storeName.charAt(0).toUpperCase()

  return (
    <div
      className={`${radius} flex-shrink-0 relative overflow-hidden shadow-sm`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-700" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Store
          style={{ width: size * 0.42, height: size * 0.42 }}
          className="text-white/90"
        />
        {size >= 72 && (
          <span
            className="text-white/70 font-bold leading-none"
            style={{ fontSize: size * 0.18 }}
          >
            {initials}
          </span>
        )}
      </div>
    </div>
  )
}
