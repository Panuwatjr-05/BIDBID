import Link from 'next/link'
import { Gavel, Tag, Shield, MessageCircle, TrendingUp, Star } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface SiteStats {
  products: number
  auctions: number
  stores: number
  users: number
}

async function getSiteStats(): Promise<SiteStats> {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/stats`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error()
    return res.json()
  } catch {
    return { products: 0, auctions: 0, stores: 0, users: 0 }
  }
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+`
  if (n === 0)   return '0'
  return n.toLocaleString('th-TH')
}

export default async function HomePage() {
  const stats = await getSiteStats()

  const statItems = [
    { label: 'สินค้าทั้งหมด',   value: stats.products, icon: Tag },
    { label: 'ประมูลสดตอนนี้',  value: stats.auctions, icon: Gavel },
    { label: 'ร้านค้าในระบบ',  value: stats.stores,   icon: Star },
    { label: 'สมาชิก',          value: stats.users,    icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Gavel className="w-4 h-4" />
            ประมูลแบบ Real-time
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            ตลาดออนไลน์<br />
            <span className="text-yellow-300">ที่คุณไว้ใจได้</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            ซื้อขายสินค้าทุกประเภท ทั้งแบบราคาคงที่และระบบประมูลออนไลน์แบบ Real-time
            พร้อมการติดต่อผ่าน LINE โดยตรง
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/marketplace" className="bg-white text-primary-700 hover:bg-gray-50 font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg">
              เริ่มช้อปปิ้ง
            </Link>
            <Link href="/marketplace?type=AUCTION" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold px-8 py-4 rounded-xl transition-colors text-lg shadow-lg flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              ดูการประมูล
            </Link>
          </div>
        </div>
      </section>

      {/* Stats — ตัวเลขจริงจาก DB */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {statItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-center">
                <Icon className="w-8 h-8 text-primary-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatStat(value)}</p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          ทำไมต้องใช้ BIDBID?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Gavel,
              title: 'ประมูล Real-time',
              desc: 'เสนอราคาและดูผลการประมูลแบบทันทีทันใด พร้อม Countdown Timer',
              color: 'text-auction-500 bg-auction-50',
            },
            {
              icon: Shield,
              title: 'ปลอดภัยและเชื่อถือได้',
              desc: 'ระบบยืนยันตัวตนและรีวิวร้านค้า มั่นใจทุกการซื้อขาย',
              color: 'text-green-500 bg-green-50',
            },
            {
              icon: MessageCircle,
              title: 'ติดต่อง่ายผ่าน LINE',
              desc: 'คลิกเดียวเพื่อติดต่อร้านค้าผ่าน LINE ได้เลย ไม่ต้องค้นหาเอง',
              color: 'text-primary-500 bg-primary-50',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card text-center hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">เริ่มต้นขายสินค้าวันนี้</h2>
          <p className="text-gray-400 mb-8">
            ลงทะเบียนเป็นผู้ขาย ตั้งร้านและวางขายสินค้าได้ฟรี ไม่มีค่าธรรมเนียม
          </p>
          <Link href="/auth/register" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-lg">
            สมัครเป็นผู้ขาย
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2025 BIDBID — ตลาดออนไลน์พร้อมการประมูล</p>
        </div>
      </footer>
    </div>
  )
}
