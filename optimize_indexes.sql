-- Indeks performa untuk mempercepat loading query di KitaAtur (10x - 50x lebih cepat)
-- Script ini aman dijalankan berulang kali (idempotent dengan IF NOT EXISTS)

-- 1. Organizations & Members (mempercepat lookup role, switch workspace, dan akses menu)
CREATE INDEX IF NOT EXISTS idx_organizations_slug_lower ON public.organizations(LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_org_members_profile ON public.organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role ON public.organization_members(organization_id, role);

-- 2. Financial Records (mempercepat load dashboard kas organisasi & ringkasan keuangan personal)
CREATE INDEX IF NOT EXISTS idx_financial_records_org_date ON public.financial_records(organization_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_profile ON public.financial_records(profile_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_records_personal ON public.financial_records(profile_id, transaction_date DESC) WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_records_category ON public.financial_records(organization_id, category);

-- 3. Attendance & Sessions (mempercepat load agenda, sesi absensi, dan riwayat presensi)
CREATE INDEX IF NOT EXISTS idx_attendance_org_session ON public.attendance(organization_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_profile ON public.attendance(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_org ON public.attendance_sessions(organization_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON public.attendance_sessions(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_org_active_time ON public.attendance_sessions(organization_id, is_active, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_schedules_org_active ON public.attendance_schedules(organization_id, is_active);

-- 4. External Guests & Guest Attendance (mempercepat scan QR tamu/siswa, monitor kelas, dan analitik)
CREATE INDEX IF NOT EXISTS idx_org_guests_org_identifier ON public.org_guests(organization_id, identifier);
CREATE INDEX IF NOT EXISTS idx_org_guests_org_ident_lower ON public.org_guests(organization_id, LOWER(identifier));
CREATE INDEX IF NOT EXISTS idx_guest_attendance_session ON public.guest_attendance(session_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_attendance_guest_id ON public.guest_attendance(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_leaves_session ON public.guest_leaves(session_id, guest_id);

-- 5. Notifications (mempercepat unread notifications di header navbar)
CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread ON public.notifications(profile_id, is_read, created_at DESC);

-- 6. Subscriptions (mempercepat verifikasi status langganan dan paket user)
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_status ON public.subscriptions(profile_id, status);

-- 7. Meeting Minutes (mempercepat load notulensi rapat organisasi)
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_org ON public.meeting_minutes(organization_id, created_at DESC);

-- 8. Goals & Transactions (mempercepat load target tabungan/anggaran organisasi & personal)
CREATE INDEX IF NOT EXISTS idx_goals_org ON public.goals(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_profile ON public.goals(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_goal ON public.goal_transactions(goal_id, created_at DESC);
