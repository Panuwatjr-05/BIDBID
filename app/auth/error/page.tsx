'use client'

import Link from 'next/link'
import { Gavel, AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาดในการเข้าสู่ระบบ</h1>
        <p className="text-gray-500 mb-8">กรุณาตรวจสอบอีเมลและรหัสผ่านของคุณ</p>
        <Link href="/auth/login" className="btn-primary">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  )
}
