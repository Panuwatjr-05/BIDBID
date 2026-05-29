'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  currentUrl: string | null
  name: string
  size?: number
  onUpload: (url: string) => void
}

export default function AvatarUpload({ currentUrl, name, size = 96, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) { toast.error('รูปต้องไม่เกิน 2MB'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const res  = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      onUpload(json.url)
      toast.success('อัปโหลดรูปโปรไฟล์สำเร็จ')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const initials = name.charAt(0).toUpperCase()

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Avatar */}
      <div
        className="w-full h-full rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ring-4 ring-white shadow-md"
      >
        {currentUrl ? (
          <Image src={currentUrl} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-primary-700 font-bold" style={{ fontSize: size * 0.4 }}>
            {initials}
          </span>
        )}
      </div>

      {/* Camera button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
        title="เปลี่ยนรูปโปรไฟล์"
      >
        {uploading
          ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <Camera className="w-3.5 h-3.5" />
        }
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
