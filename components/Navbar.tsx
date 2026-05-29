'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { ShoppingBag, Gavel, LogOut, Menu, X, ChevronDown, Store, User, Settings } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null)

  const role         = session?.user?.role
  const dashboardHref = role === 'SELLER' ? '/seller' : role === 'ADMIN' ? '/admin' : '/buyer'

  // Fetch avatar on session change
  useEffect(() => {
    if (!session) { setAvatarUrl(null); return }
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((j) => setAvatarUrl(j.data?.avatar_url ?? null))
      .catch(() => {})
  }, [session])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl">
            <Gavel className="w-6 h-6" />
            <span>BIDBID</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/marketplace" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              ตลาดซื้อขาย
            </Link>
            <Link href="/marketplace?type=AUCTION" className="text-gray-600 hover:text-auction-600 font-medium transition-colors flex items-center gap-1">
              <Gavel className="w-4 h-4" /> การประมูล
            </Link>
            <Link href="/stores" className="text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-1">
              <Store className="w-4 h-4" /> ร้านค้า
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium"
                >
                  {/* Avatar circle */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ring-2 ring-primary-100 flex-shrink-0">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" width={32} height={32} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <span className="text-primary-700 font-bold text-sm">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="max-w-[110px] truncate">{session.user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link href={dashboardHref} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                      <ShoppingBag className="w-4 h-4" /> แดชบอร์ด
                    </Link>
                    <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                      <Settings className="w-4 h-4" /> ตั้งค่าบัญชี
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 font-medium">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/auth/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>

          {/* Mobile button */}
          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link href="/marketplace" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>ตลาดซื้อขาย</Link>
          <Link href="/marketplace?type=AUCTION" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>การประมูล</Link>
          <Link href="/stores" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>ร้านค้า</Link>
          {session ? (
            <>
              <Link href={dashboardHref} className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>แดชบอร์ด</Link>
              <Link href="/account" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>ตั้งค่าบัญชี</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full text-left py-2 text-red-600 font-medium">ออกจากระบบ</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2 text-gray-700 font-medium" onClick={() => setMenuOpen(false)}>เข้าสู่ระบบ</Link>
              <Link href="/auth/register" className="block py-2 text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>สมัครสมาชิก</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
