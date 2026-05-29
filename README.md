# BIDBID — ระบบตลาดออนไลน์พร้อมการประมูล

แพลตฟอร์มซื้อขายสินค้าออนไลน์ รองรับทั้งการขายแบบราคาคงที่และการประมูลแบบ Real-time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | NextAuth.js (Credentials) |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |
| Deploy | Vercel |

## เริ่มต้นใช้งาน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

คัดลอก `.env.example` เป็น `.env.local` แล้วกรอกค่า:

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
NEXTAUTH_SECRET=[RANDOM_SECRET]
NEXTAUTH_URL=http://localhost:3000
```

### 3. ตั้งค่า Supabase

1. สร้าง Supabase Project ที่ [supabase.com](https://supabase.com)
2. ไปที่ **SQL Editor** แล้วรัน SQL ตามลำดับ:
   - `supabase/migrations/01_create_tables.sql`
   - `supabase/migrations/02_rls_policies.sql`
   - `supabase/migrations/03_storage_and_seed.sql`
3. ที่ **Authentication > Providers** ปิด Email Confirmations สำหรับ development

### 4. เริ่ม Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## บัญชีทดสอบ

รหัสผ่านทุกบัญชี: `password123`

| บทบาท | อีเมล |
|-------|-------|
| Admin | admin@test.com |
| Seller 1 | seller1@test.com |
| Seller 2 | seller2@test.com |
| Buyer | buyer@test.com |

> หมายเหตุ: Hash รหัสผ่านใน seed data ต้องสร้างใหม่ด้วย bcrypt ก่อนใช้งานจริง

## โครงสร้างไฟล์

```
BIDBID/
├── app/
│   ├── api/
│   │   ├── auth/         # NextAuth + Register
│   │   ├── products/     # CRUD สินค้า
│   │   ├── bids/         # ประมูล
│   │   ├── stores/       # ร้านค้า
│   │   ├── users/        # Admin: ผู้ใช้
│   │   ├── admin/stats/  # Admin: สถิติ
│   │   └── seller/dashboard/ # Seller stats
│   ├── auth/             # Login, Register
│   ├── marketplace/      # หน้าตลาด + Product Detail
│   ├── buyer/            # Buyer Dashboard
│   ├── seller/           # Seller Dashboard + Products
│   └── admin/            # Admin Dashboard
├── components/           # Shared Components
├── lib/                  # Supabase, Auth, Helpers
├── types/                # TypeScript Interfaces
└── supabase/migrations/  # SQL ไฟล์
```

## Features

### ผู้ซื้อ (Buyer)
- ค้นหาและกรองสินค้าตามประเภท/หมวดหมู่
- ดูรายละเอียดสินค้า
- ประมูลสินค้าแบบ Real-time (Supabase Realtime)
- Countdown Timer สำหรับการประมูล
- ติดต่อร้านค้าผ่าน LINE โดยตรง
- ดูประวัติการประมูล

### ผู้ขาย (Seller)
- Dashboard สรุปยอด
- เพิ่ม/แก้ไข/ลบสินค้า (ราคาคงที่และประมูล)
- อัปโหลดรูปสินค้าผ่าน Supabase Storage (สูงสุด 5 รูป)
- จัดการข้อมูลร้านค้า

### แอดมิน (Admin)
- ดูสถิติภาพรวมระบบ
- จัดการร้านค้า (ระงับ/เปิดใช้งาน)
- จัดการสินค้าทั้งหมด (ลบ)
- ดูรายการผู้ใช้ทั้งหมด

## Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. นำเข้าโปรเจกต์ใน Vercel
3. ตั้งค่า Environment Variables ใน Vercel Dashboard
4. Deploy

---

Built with ❤️ using Next.js 14 + Supabase
