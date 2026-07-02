# KitaAtur - SaaS Absensi & Keuangan Organisasi (Multi-Tenancy)

Aplikasi SaaS berbasis web untuk pengelolaan kehadiran (absensi via QR) dan pencatatan keuangan organisasi dengan data terisolasi penuh (Multi-Tenancy).

## Tech Stack
- **Frontend**: Next.js 14/15 (App Router), React, Tailwind CSS, Shadcn UI
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM
- **Database / Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Payment Gateway**: Pakasir.com (Sistem Langganan / Subscription)
- **Media Storage**: Cloudinary (Upload bukti keuangan & avatar)

## Struktur Repositori (Monorepo)
- `/frontend`: Aplikasi Next.js untuk user interface.
- `/backend`: API Gateway Express.js untuk pemrosesan logika bisnis, webhook, dan database query.
- `schema.sql`: Skema database mentah untuk inisialisasi awal di dashboard Supabase.

## Cara Menjalankan Project

### 1. Inisialisasi Database
1. Salin script di berkas `schema.sql` dan jalankan pada **SQL Editor** di dashboard Supabase Anda.
2. Pastikan trigger sinkronisasi profile aktif.

### 2. Konfigurasi Backend
1. Masuk ke direktori `backend/`
2. Salin `.env.example` menjadi `.env` dan lengkapi variabel berikut:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[supabase-ref].supabase.co:5432/postgres"
   SUPABASE_URL="https://[supabase-ref].supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_JWT_SECRET="your-jwt-secret"
   PORT=5000
   ```
3. Jalankan `npm install`
4. Jalankan migrasi Prisma: `npx prisma db pull` (atau `npx prisma db push` jika skema ingin langsung dipush)
5. Jalankan backend: `npm run dev`

### 3. Konfigurasi Frontend
1. Masuk ke direktori `frontend/`
2. Salin `.env.example` menjadi `.env.local` dan lengkapi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://[supabase-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```
3. Jalankan `npm install`
4. Jalankan dev server: `npm run dev`
