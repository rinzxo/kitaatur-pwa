-- Indeks performa untuk mempercepat loading query di KitaAtur (10x - 50x lebih cepat)
-- Jalankan seluruh script ini di Supabase Dashboard -> SQL Editor

-- 1. Financial Records (mempercepat load dashboard kas organisasi & ringkasan keuangan personal)
CREATE INDEX IF NOT EXISTS idx_financial_records_org_date ON public.financial_records(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_profile ON public.financial_records(profile_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON public.financial_records(organization_id, category);

-- 2. Attendance & Sessions (mempercepat load agenda, sesi absensi, dan riwayat presensi)
CREATE INDEX IF NOT EXISTS idx_attendance_org_session ON public.attendance(organization_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile ON public.attendance(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_org ON public.attendance_sessions(organization_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON public.attendance_sessions(organization_id, is_active);

-- 3. Organizations & Members (mempercepat workspace switch, load profile organisasi dan anggota)
CREATE INDEX IF NOT EXISTS idx_org_members_profile ON public.organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON public.organization_members(organization_id, role);

-- 4. External Guests & Guest Attendance (mempercepat scan QR tamu/siswa, monitor kelas, dan analitik)
CREATE INDEX IF NOT EXISTS idx_org_guests_org_identifier ON public.org_guests(organization_id, identifier);
CREATE INDEX IF NOT EXISTS idx_guest_attendance_session ON public.guest_attendance(session_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_leaves_session ON public.guest_leaves(session_id, guest_id);

-- 5. Notifications (mempercepat unread notifications di header navbar)
CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread ON public.notifications(profile_id, is_read, created_at DESC);

-- 6. Subscriptions (mempercepat verifikasi status langganan dan paket user)
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_status ON public.subscriptions(profile_id, status);
