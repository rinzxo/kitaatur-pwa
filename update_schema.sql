-- Script untuk mensinkronisasi Database Supabase dengan Prisma
-- Jalankan (Run) seluruh script ini di Supabase Dashboard -> SQL Editor

-- 1. Tambahkan tipe ENUM global_role
DO $$ BEGIN
    CREATE TYPE user_global_role AS ENUM ('developer', 'head', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tambahkan kolom global_role di tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS global_role user_global_role DEFAULT 'user';

-- 3. Tambahkan kolom yang kurang di tabel organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Ubah nama kolom org_id menjadi organization_id agar sesuai dengan Prisma
DO $$ BEGIN
  ALTER TABLE public.organization_members RENAME COLUMN org_id TO organization_id;
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

-- 5. Ubah nama tabel organization_financials menjadi financial_records
DO $$ BEGIN
  ALTER TABLE public.organization_financials RENAME TO financial_records;
EXCEPTION
  WHEN undefined_table THEN null;
END $$;

-- 6. Ubah kolom di financial_records agar sesuai Prisma
DO $$ BEGIN
  ALTER TABLE public.financial_records RENAME COLUMN org_id TO organization_id;
  ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN undefined_column THEN null;
END $$;

-- 7. Tambahkan tabel-tabel baru (attendance, goals, subscriptions) jika belum ada
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'present',
  notes text,
  check_in_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_amount numeric,
  current_amount numeric DEFAULT 0,
  deadline date,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pakasir_subscription_id text UNIQUE,
  status text DEFAULT 'active',
  plan_type text NOT NULL,
  amount_paid numeric,
  starts_at timestamp with time zone NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 8. Jadikan akun Anda saat ini sebagai 'head' (Premium) agar bisa membuat Organisasi!
UPDATE public.profiles SET global_role = 'head';
