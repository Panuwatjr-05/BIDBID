'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  sellerId: string
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUpload({ value, onChange, maxImages = 5 }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) throw new Error(json.error ?? 'อัปโหลดไม่สำเร็จ')
    return json.url as string
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = maxImages - value.length
    if (remaining <= 0) {
      toast.error(`อัปโหลดได้สูงสุด ${maxImages} รูป`)
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} มีขนาดเกิน 5MB`)
          continue
        }
        const url = await uploadFile(file)
        uploaded.push(url)
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded])
        toast.success(`อัปโหลด ${uploaded.length} รูปสำเร็จ`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(url: string) {
    onChange(value.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative w-24 h-24 group">
              <Image
                src={url}
                alt={`รูปที่ ${index + 1}`}
                fill
                className="object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X className="w-3 h-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  หลัก
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors w-full justify-center"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span>กำลังอัปโหลด...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span>เพิ่มรูปภาพ ({value.length}/{maxImages})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
