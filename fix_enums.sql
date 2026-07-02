-- Script untuk memperbaiki Prisma Enum types di Supabase
-- Jalankan (Run) seluruh script ini di Supabase Dashboard -> SQL Editor

-- 1. Buat tipe ENUM sesuai Prisma
DO $$ BEGIN
    CREATE TYPE org_member_role AS ENUM ('head', 'bendahara', 'sekretaris', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE financial_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Ubah kolom role di organization_members
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.organization_members ALTER COLUMN role TYPE org_member_role USING role::org_member_role;
ALTER TABLE public.organization_members ALTER COLUMN role SET DEFAULT 'member'::org_member_role;

-- 3. Ubah kolom type di financial_records
ALTER TABLE public.financial_records DROP CONSTRAINT IF EXISTS organization_financials_type_check;
ALTER TABLE public.financial_records DROP CONSTRAINT IF EXISTS financial_records_type_check;
ALTER TABLE public.financial_records ALTER COLUMN type TYPE financial_type USING type::financial_type;

-- 4. Ubah kolom status di attendance
ALTER TABLE public.attendance ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.attendance ALTER COLUMN status TYPE attendance_status USING status::attendance_status;
ALTER TABLE public.attendance ALTER COLUMN status SET DEFAULT 'present'::attendance_status;

-- 5. Ubah kolom status di goals
ALTER TABLE public.goals ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.goals ALTER COLUMN status TYPE goal_status USING status::goal_status;
ALTER TABLE public.goals ALTER COLUMN status SET DEFAULT 'active'::goal_status;

-- 6. Ubah kolom status di subscriptions
ALTER TABLE public.subscriptions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.subscriptions ALTER COLUMN status TYPE subscription_status USING status::subscription_status;
ALTER TABLE public.subscriptions ALTER COLUMN status SET DEFAULT 'active'::subscription_status;
