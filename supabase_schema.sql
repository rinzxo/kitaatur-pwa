-- Supabase Schema for KitaAtur
-- Jalankan script ini di SQL Editor Supabase Anda

-- 1. Profiles Table (Ekstensi dari auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger untuk membuat profile otomatis saat ada user baru
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Organizations Table
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Organization Members Table
create table public.organization_members (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('head', 'bendahara', 'sekretaris', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(org_id, profile_id)
);

-- 4. Organization Financials Table (Kas)
create table public.organization_financials (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text,
  transaction_date date not null,
  receipt_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Attendance Sessions Table (Sesi Absensi / QR Code)
create table public.attendance_sessions (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  token text not null unique,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(org_id, date)
);

-- 6. Attendance Records Table (Data Kehadiran)
create table public.attendance_records (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.attendance_sessions(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, profile_id)
);

-- Mengaktifkan RLS (Row Level Security) - Opsional namun direkomendasikan
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_financials enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

-- (Tambahkan policies sesuai kebutuhan keamanan jika mengakses langsung via client/frontend)
-- Karena aplikasi ini menggunakan backend Express.js, Anda dapat mengabaikan RLS jika menggunakan Service Role Key di Backend.
