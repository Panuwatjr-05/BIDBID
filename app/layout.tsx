import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import SessionProvider from '@/components/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'BIDBID - ตลาดออนไลน์พร้อมการประมูล',
  description: 'แพลตฟอร์มซื้อขายสินค้าออนไลน์ ทั้งแบบราคาคงที่และการประมูล',
  keywords: 'ประมูลออนไลน์, ซื้อขายออนไลน์, marketplace, auction, bidbid',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontFamily: 'Noto Sans Thai, sans-serif' },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
