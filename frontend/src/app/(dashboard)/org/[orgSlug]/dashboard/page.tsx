'use client'
import { useEffect, useState, useRef } from 'react'
import { api, getApiCachedData } from '@/lib/api'
import { useDashboardStore } from '@/lib/dashboard-store'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Wallet, 
  QrCode, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  GearSix as Settings, 
  Bell, 
  Info, 
  CaretRight as ChevronRight, 
  CaretUp as ChevronUp, 
  CaretDown as ChevronDown, 
  ClockCounterClockwise as History, 
  WarningCircle as AlertCircle, 
  CheckCircle as CheckCircle2, 
  CalendarDots as Calendar, 
  Clock,
  ChartBar as BarChart3, 
  UserCheck, 
  CalendarDots as CalendarDays, 
  Coins, 
  SlidersHorizontal, 
  Check, 
  X, 
  Plus,
  ListChecks,
  Compass
} from '@phosphor-icons/react'
import QuickOnboardingWizard from '@/components/dashboard/QuickOnboardingWizard'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

interface Goal {
  id: string
  title: string
  target_amount: string | null
  current_amount: string | null
  deadline: string | null
  status: 'active' | 'completed' | 'failed'
}

interface FinancialRecord {
  id: string
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
  profile: {
    full_name: string
    email: string
  }
}

export default function OrgDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const store = useDashboardStore()

  const [goals, setGoals] = useState<Goal[]>([])
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [financialSummary, setFinancialSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [myTunggakan, setMyTunggakan] = useState<number>(0)
  const [targetAmount, setTargetAmount] = useState<number>(0)
  const [agendas, setAgendas] = useState<any[]>([])
  const [activeHero, setActiveHero] = useState<number>(0)
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState<number>(0)
  const [membersCount, setMembersCount] = useState<number>(0)
  const [orgLogoError, setOrgLogoError] = useState(false)
  const [userAvatarError, setUserAvatarError] = useState(false)

  // Role-based shortcuts state
  const [currentUserRole, setCurrentUserRole] = useState<'head' | 'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'>('member')
  const [customShortcuts, setCustomShortcuts] = useState<string[] | null>(null)
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false)
  const [slotFullNotice, setSlotFullNotice] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  // Load custom shortcuts from localStorage
  useEffect(() => {
    if (!orgSlug) return
    try {
      const saved = localStorage.getItem(`kitaatur_shortcuts_${orgSlug}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= 4) {
          setCustomShortcuts(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to parse saved shortcuts', e)
    }
  }, [orgSlug])

  // Derive shared data from store
  const userName = store.user?.name || 'Pengguna'
  const userAvatar = store.user?.avatar_url || null
  const isVerified = store.isVerified
  const hasSchoolPlan = store.hasSchoolPlan
  const unreadNotifs = store.unreadNotifs
  const currentOrg = store.orgs.find(o => o.slug === orgSlug)
  const orgData = currentOrg || { name: orgSlug, logo_url: null }

  const [showTour, setShowTour] = useState(false)

  const dashboardTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-hero-slider"]',
      title: 'Ringkasan Kas & Agenda',
      description: 'Pantau saldo kas organisasi, status keuangan real-time, dan agenda kegiatan terdekat dalam satu kartu ringkas.'
    },
    {
      target: '[data-tour="tour-shortcut-attendance_bantu"]',
      title: 'Bantu Absen (1 HP)',
      description: 'Fitur utama untuk presensi cepat di sekolah: sekretaris mendata kehadiran siswa sekaligus dalam 1 HP tanpa siswa wajib bawa gawai.'
    },
    {
      target: '[data-tour="tour-shortcut-financial_dues"]',
      title: 'Uang Kas & Tagihan WA',
      description: 'Kelola catatan iuran kas anggota. Anda bisa mengirimkan pengingat tagihan otomatis ke WhatsApp anggota dengan 1-klik.'
    },
    {
      target: '[data-tour="tour-shortcut-attendance_sessions"]',
      title: 'Pusat Alat Presensi',
      description: 'Buka sesi rapat/latihan instan dalam 15 detik, validasi surat izin dokter, dan kelola jadwal otomatis mingguan.'
    }
  ]

  const formatRupiah = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const applyOverviewData = (data: any) => {
    if (!data) return
    setGoals(data.goals || [])
    setFinancialSummary(data.financialSummary || { income: 0, expense: 0, balance: 0 })
    setRecords(data.records || [])
    setMembersCount(data.membersCount || 0)
    
    // Process agenda for THIS org
    let orgAgendas: any[] = []
    if (data.agendas && data.agendas.length > 0) {
      const orgName = currentOrg?.name || orgSlug
      orgAgendas = data.agendas.map((a: any) => ({
        ...a,
        orgSlug: orgSlug,
        orgName: orgName
      }))
      orgAgendas.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }
    setAgendas(orgAgendas)

    const targetAmt = data.org?.dues_target_amount ? parseFloat(data.org.dues_target_amount) : 0
    setTargetAmount(targetAmt)

    const detectedRole = data.role || 'member'
    setCurrentUserRole(detectedRole)
    setMyTunggakan(data.myTunggakan || 0)

    // Check if onboarding should be shown for this leader
    const isOrgLeader = detectedRole === 'head' || detectedRole === 'vice_head' || detectedRole === 'bendahara'
    const hasCompletedOnboarding = localStorage.getItem(`kitaatur_onboarding_completed_${orgSlug}`) === 'true'
    const isDismissedOnboarding = localStorage.getItem(`kitaatur_onboarding_dismissed_${orgSlug}`) === 'true'
    const isBrandNewOrg = targetAmt === 0 && orgAgendas.length === 0

    if (isOrgLeader && isBrandNewOrg && !hasCompletedOnboarding && !isDismissedOnboarding) {
      setShowOnboarding(true)
    }
  }

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      const cacheUrl = `/org/${orgSlug}/overview`
      const cached = getApiCachedData<any>(cacheUrl)
      if (cached && isMounted) {
        applyOverviewData(cached)
        setLoading(false)
      } else {
        // Quick cross-cache hydration from financial page cache if available
        const cachedFin = getApiCachedData<any>(`/org-financial/${orgSlug}/summary`)
        if (cachedFin?.summary && isMounted) {
          setFinancialSummary(cachedFin.summary)
        }
      }

      let dataApplied = false
      try {
        const res = await api.get(cacheUrl).catch(() => null)
        if (!isMounted) return

        if (res?.data && (res.data.org || res.data.financialSummary)) {
          applyOverviewData(res.data)
          dataApplied = true
        }
      } catch (err) {
        console.warn('Overview endpoint failed, triggering fallback:', err)
      }

      // Graceful fallback to individual endpoints if /overview is not yet available on remote backend
      if (!dataApplied && isMounted) {
        try {
          const [
            goalsRes, finRes, recordsRes, settingsRes, membersRes, agendaRes
          ] = await Promise.all([
            api.get(`/org/${orgSlug}/goals`).catch(() => ({ data: [] })),
            api.get(`/org-financial/${orgSlug}/summary`).catch(() => ({ data: { summary: { income: 0, expense: 0, balance: 0 } } })),
            api.get(`/org-financial/${orgSlug}`).catch(() => ({ data: [] })),
            api.get(`/org/${orgSlug}/settings`).catch(() => ({ data: null })),
            api.get(`/org/${orgSlug}/members`).catch(() => ({ data: [] })),
            api.get(`/org-attendance/${orgSlug}/agenda`).catch(() => ({ data: [] })),
          ])

          if (!isMounted) return

          setGoals(goalsRes.data || [])
          setFinancialSummary(finRes.data?.summary || { income: 0, expense: 0, balance: 0 })
          setRecords(recordsRes.data || [])
          const validMembers = (membersRes.data || []).filter((m: any) => m.role !== 'auditor')
          setMembersCount(validMembers.length)

          let orgAgendas: any[] = []
          if (agendaRes.data && agendaRes.data.length > 0) {
            const orgName = currentOrg?.name || orgSlug
            orgAgendas = agendaRes.data.map((a: any) => ({
              ...a,
              orgSlug: orgSlug,
              orgName: orgName
            }))
            orgAgendas.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          }
          setAgendas(orgAgendas)

          const targetAmt = settingsRes.data?.dues_target_amount ? parseFloat(settingsRes.data.dues_target_amount) : 0
          setTargetAmount(targetAmt)

          if (store.user?.id) {
            const currentMember = (membersRes.data || []).find((m: any) => m.profile_id === store.user?.id)
            const isOrgOwner = currentOrg && (currentOrg as any).owner_id === store.user?.id
            const detectedRole = (isOrgOwner ? 'head' : (currentMember?.role || 'member')) as 'head' | 'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'
            setCurrentUserRole(detectedRole)

            if (currentMember && currentMember.joined_at && targetAmt > 0 && currentMember.role !== 'auditor') {
              const joined = new Date(currentMember.joined_at)
              const now = new Date()
              let months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1
              if (months < 1) months = 1

              const expected = months * targetAmt
              let paid = 0
              ;(recordsRes.data || []).forEach((r: any) => {
                if (r.profile_id === store.user?.id && r.category === 'Uang Kas') {
                  paid += parseFloat(r.amount)
                }
              })
              setMyTunggakan(Math.max(0, expected - paid))
            } else {
              setMyTunggakan(0)
            }

            const isOrgLeader = detectedRole === 'head' || detectedRole === 'vice_head' || detectedRole === 'bendahara'
            const hasCompletedOnboarding = localStorage.getItem(`kitaatur_onboarding_completed_${orgSlug}`) === 'true'
            const isDismissedOnboarding = localStorage.getItem(`kitaatur_onboarding_dismissed_${orgSlug}`) === 'true'
            const isBrandNewOrg = targetAmt === 0 && orgAgendas.length === 0

            if (isOrgLeader && isBrandNewOrg && !hasCompletedOnboarding && !isDismissedOnboarding) {
              setShowOnboarding(true)
            }
          }
        } catch (err) {
          console.error('Error fetching org dashboard fallback data:', err)
        }
      }

      if (isMounted) setLoading(false)
    }

    if (orgSlug) {
      fetchData()
    }
    return () => { isMounted = false }
  }, [orgSlug, store.user?.id, currentOrg?.name, refreshTrigger])

  useEffect(() => {
    if (agendas.length > 0) {
      let heroState = 0;
      const interval = setInterval(() => {
        heroState = heroState === 0 ? 1 : 0;
        setActiveHero(heroState);
        if (heroState === 1 && agendas.length > 1) {
          // Cycle agenda in the background while Kas is showing
          setCurrentAgendaIndex(a => (a + 1) % agendas.length);
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [agendas.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans relative animate-pulse">
        <header className="flex justify-between items-center p-4 md:px-8 max-w-4xl mx-auto pt-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="w-32 h-8 rounded-full bg-slate-200"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
        </header>
        <main className="max-w-4xl mx-auto p-4 md:px-8 pb-32">
          <div className="h-48 md:h-56 bg-slate-200 rounded-3xl mb-6"></div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 md:h-32 bg-slate-200 rounded-2xl md:rounded-3xl"></div>)}
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
        </main>
      </div>
    )
  }

  const effectiveRole = currentUserRole

  const allShortcutsCatalog = [
    {
      id: 'members',
      title: 'Anggota',
      subtitle: `${membersCount} Terdaftar`,
      href: `/org/${orgSlug}/members`,
      icon: Users,
      iconColor: 'text-purple-600',
      hoverBorder: 'hover:border-purple-200',
      category: 'Keanggotaan'
    },
    {
      id: 'attendance_main',
      title: 'Presensi',
      subtitle: 'Sesi & Scanner QR',
      href: `/org/${orgSlug}/attendance`,
      icon: QrCode,
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-200',
      category: 'Presensi'
    },
    {
      id: 'attendance_sessions',
      title: 'Kelola Sesi',
      subtitle: 'Buka & Pantau Sesi',
      href: `/org/${orgSlug}/attendance/sessions?tab=sessions`,
      icon: Clock,
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-200',
      category: 'Presensi'
    },
    {
      id: 'attendance_bantu',
      title: 'Bantu Absen & Scan QR',
      subtitle: 'Scanner Kamera & Roll-Call',
      href: `/org/${orgSlug}/attendance/sessions?tab=izin`,
      icon: UserCheck,
      iconColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-200',
      category: 'Presensi'
    },
    {
      id: 'attendance_schedules',
      title: 'Jadwal Otomatis',
      subtitle: 'Otomatisasi Sesi Rutin',
      href: `/org/${orgSlug}/attendance/sessions?tab=schedules`,
      icon: CalendarDays,
      iconColor: 'text-indigo-600',
      hoverBorder: 'hover:border-indigo-200',
      category: 'Agenda'
    },
    {
      id: 'financial_income',
      title: 'Kas Masuk',
      subtitle: formatRupiah(financialSummary.income),
      href: `/org/${orgSlug}/financial`,
      icon: ArrowUpRight,
      iconColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-200',
      category: 'Keuangan'
    },
    {
      id: 'financial_expense',
      title: 'Kas Keluar',
      subtitle: formatRupiah(financialSummary.expense),
      href: `/org/${orgSlug}/financial`,
      icon: ArrowDownRight,
      iconColor: 'text-rose-600',
      hoverBorder: 'hover:border-rose-200',
      category: 'Keuangan'
    },
    {
      id: 'financial_dues',
      title: 'Uang Kas Anggota',
      subtitle: targetAmount > 0 ? `Target: ${formatRupiah(targetAmount)}/bln` : 'Kelola Tagihan Kas',
      href: `/org/${orgSlug}/financial/dues`,
      icon: Coins,
      iconColor: 'text-amber-600',
      hoverBorder: 'hover:border-amber-200',
      category: 'Keuangan'
    },
    {
      id: 'financial_my_kas',
      title: 'Status Kas Saya',
      subtitle: myTunggakan > 0 ? `Tunggakan ${formatRupiah(myTunggakan)}` : 'Status Lunas',
      href: `/org/${orgSlug}/financial`,
      icon: Wallet,
      iconColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-200',
      category: 'Keuangan'
    },
    {
      id: 'financial_analysis',
      title: 'Laporan Keuangan',
      subtitle: 'Buku Kas & Grafik',
      href: `/org/${orgSlug}/financial/analysis`,
      icon: BarChart3,
      iconColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-200',
      category: 'Laporan'
    },
    {
      id: 'attendance_history',
      title: 'Riwayat Presensi',
      subtitle: 'Rekap Kehadiran',
      href: `/org/${orgSlug}/attendance`,
      icon: History,
      iconColor: 'text-amber-600',
      hoverBorder: 'hover:border-amber-200',
      category: 'Presensi'
    },
    {
      id: 'org_settings',
      title: 'Pengaturan',
      subtitle: 'Konfigurasi Workspace',
      href: `/org/${orgSlug}/settings`,
      icon: Settings,
      iconColor: 'text-slate-600',
      hoverBorder: 'hover:border-slate-300',
      category: 'Sistem'
    }
  ]

  const roleDefaultShortcutIds: Record<string, string[]> = {
    head: ['members', 'attendance_bantu', 'financial_dues', 'financial_income'],
    vice_head: ['members', 'attendance_bantu', 'financial_dues', 'financial_income'],
    bendahara: ['financial_dues', 'financial_income', 'financial_expense', 'financial_analysis'],
    sekretaris: ['attendance_bantu', 'attendance_sessions', 'attendance_schedules', 'members'],
    member: ['attendance_scan', 'financial_my_kas', 'attendance_history', 'members'],
    auditor: ['financial_analysis', 'attendance_main', 'financial_income', 'financial_expense']
  }

  const currentShortcutIds = customShortcuts !== null
    ? customShortcuts
    : (roleDefaultShortcutIds[effectiveRole] || roleDefaultShortcutIds.head)

  const activeShortcuts = currentShortcutIds
    .map(id => allShortcutsCatalog.find(item => item.id === id))
    .filter(Boolean) as typeof allShortcutsCatalog

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* Top Navigation Bar */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center p-4 md:px-8 max-w-4xl mx-auto pt-6 gap-4 md:gap-0">
        
        {/* Mobile View: Greeting & Bell on Top */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-[#0087FF] font-bold text-sm">Halo, {userName}</span>
            {isVerified && <CheckCircle2 className="w-4 h-4 text-[#0087FF] fill-[#E0F4FE]" />}
            {hasSchoolPlan && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">SCH</span>}
          </div>
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-[#0087FF] transition-colors">
            <Bell className="w-6 h-6" />
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
          </Link>
        </div>

        {/* Logo and Workspace Name */}
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Link href={`/org/${orgSlug}/members`} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 hover:scale-105 transition-transform overflow-hidden" title="Kelola Anggota & Organisasi">
              {orgData?.logo_url && !orgLogoError ? (
                <img 
                  src={orgData.logo_url} 
                  alt="Logo" 
                  className="w-full h-full object-cover" 
                  onError={() => setOrgLogoError(true)}
                />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </Link>
            <div className="bg-[#E0F4FE] text-[#007AE6] text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              {orgData?.name || orgSlug}
            </div>
          </div>
        </div>
        
        {/* Desktop Greeting & Bell */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
            {userAvatar && !userAvatarError ? (
              <img 
                src={userAvatar} 
                alt="Profile" 
                className="w-6 h-6 rounded-full object-cover" 
                onError={() => setUserAvatarError(true)}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-sm text-slate-700">{userName}</span>
            <div className="flex items-center gap-1">
              {isVerified && <CheckCircle2 className="w-4 h-4 text-[#0087FF] fill-[#E0F4FE]" />}
              {hasSchoolPlan && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">SCH</span>}
            </div>
          </div>
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-[#0087FF] transition-colors">
            <Bell className="w-6 h-6" />
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:px-8 pb-32">
        
        {/* Quick Onboarding Wizard for Organization Leaders */}
        {showOnboarding && (currentUserRole === 'head' || currentUserRole === 'vice_head' || currentUserRole === 'bendahara') && (
          <QuickOnboardingWizard
            orgSlug={orgSlug}
            orgName={orgData?.name || orgSlug}
            currentDuesTarget={targetAmount}
            onCompleted={() => {
              setShowOnboarding(false)
              setRefreshTrigger(prev => prev + 1)
            }}
            onDismiss={() => {
              setShowOnboarding(false)
              localStorage.setItem(`kitaatur_onboarding_dismissed_${orgSlug}`, 'true')
            }}
          />
        )}

        {/* Compact Setup Guide Banner if not showing wizard but is brand new org */}
        {!showOnboarding && (currentUserRole === 'head' || currentUserRole === 'vice_head' || currentUserRole === 'bendahara') && targetAmount === 0 && agendas.length === 0 && (
          <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-white to-blue-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
                <ListChecks size={22} weight="bold" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Organisasi Baru? Belum mengatur uang kas atau jadwal presensi?
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selesaikan panduan setup kilat 3 langkah agar sistem berjalan otomatis dalam 1 menit.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center gap-2"
            >
              <span>Mulai Setup Kilat (1 Menit)</span>
              <ChevronRight size={14} weight="bold" />
            </button>
          </div>
        )}

        {/* Unified Hero Section (Slider) */}
        <div data-tour="tour-hero-slider" className="relative mb-8">
          <div className="relative overflow-hidden rounded-3xl shadow-xl shadow-[#0087FF]/25 bg-gradient-to-r from-[#0087FF] via-[#0099FF] to-[#01C4FB]">
            <div className="flex transition-transform duration-700 ease-brand-slide" style={{ transform: `translateX(-${activeHero * 100}%)` }}>
              
              {/* Slide 1: Agenda (satu slide, ganti-gantian isinya) */}
              {agendas.length > 0 && (
                <div className="w-full flex-none">
                  <Link href={`/org/${agendas[currentAgendaIndex].orgSlug}/attendance`} className="block bg-gradient-to-r from-[#0087FF] via-[#0099FF] to-[#01C4FB] p-5 md:p-6 text-white relative overflow-hidden h-full group cursor-pointer">
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex items-center gap-2 opacity-90">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold text-base tracking-wide">{agendas[currentAgendaIndex].orgName}</span>
                      </div>
                      {new Date() >= new Date(agendas[currentAgendaIndex].start_time) ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-500/20">Berjalan</span>
                      ) : (
                        <span className="bg-white text-[#0087FF] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Mendatang</span>
                      )}
                    </div>
                    
                    <div className="relative z-10 mt-3">
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3 leading-tight group-hover:text-blue-100 transition-colors duration-300 pr-10 truncate">{agendas[currentAgendaIndex].title}</h1>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                          <Clock className="w-3.5 h-3.5 text-blue-100" />
                          <span className="text-white">
                            {new Date(agendas[currentAgendaIndex].start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(agendas[currentAgendaIndex].start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {agendas.length > 1 && (
                          <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md text-blue-100 border border-white/10">
                            {currentAgendaIndex + 1} / {agendas.length}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 right-0 p-4 md:p-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                       <div className="bg-white/20 backdrop-blur-md p-2 rounded-full shadow-sm hover:bg-white/30 transition-colors">
                         <ChevronRight className="w-4 h-4 text-white" />
                       </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Slide 2: Kas Organisasi */}
              <div className="w-full flex-none">
                <div className="bg-gradient-to-r from-[#0087FF] via-[#0099FF] to-[#01C4FB] p-5 md:p-6 text-white relative overflow-hidden h-full">
                  <div className="flex justify-between items-start mb-1 relative z-10">
                    <div className="flex items-center gap-2 opacity-90">
                      <span className="font-semibold text-base">Kas Organisasi</span>
                      <Info className="w-4 h-4 opacity-70" />
                    </div>
                    <Link 
                      href={`/org/${orgSlug}/financial`}
                      className="bg-white text-[#0087FF] hover:bg-white/90 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Kelola
                    </Link>
                  </div>
                  
                  <div className="relative z-10 mt-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight truncate">{formatRupiah(financialSummary.balance)}</h1>
                    <div className="flex items-center gap-1 mt-2 font-semibold text-xs md:text-sm bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                      {financialSummary.balance > 0 ? <ChevronUp className="w-3.5 h-3.5" /> : financialSummary.balance < 0 ? <ChevronDown className="w-3.5 h-3.5" /> : null}
                      <span>{financialSummary.balance > 0 ? 'Surplus / Aman' : financialSummary.balance < 0 ? 'Defisit / Minus' : 'Saldo Kosong'}</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-24 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Slider Dots */}
          {agendas.length > 0 && (
            <div className="absolute -bottom-5 left-0 right-0 flex justify-center gap-2 z-20">
              <button 
                onClick={() => setActiveHero(0)} 
                className={`h-1.5 rounded-full transition-all duration-500 ${activeHero === 0 ? 'bg-[#0087FF] w-6' : 'bg-slate-300 w-1.5'}`}
                aria-label="Agenda"
              />
              <button 
                onClick={() => setActiveHero(1)} 
                className={`h-1.5 rounded-full transition-all duration-500 ${activeHero === 1 ? 'bg-[#0087FF] w-6' : 'bg-slate-300 w-1.5'}`}
                aria-label="Kas Organisasi"
              />
            </div>
          )}
        </div>

        {/* Status Kas Pribadi */}
        {targetAmount > 0 && (
          <div className={`mt-6 mb-6 p-5 rounded-3xl border shadow-sm flex items-center justify-between ${myTunggakan > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-sm ${myTunggakan > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {myTunggakan > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className={`font-bold text-lg ${myTunggakan > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>Status Uang Kas Anda</h3>
                <p className={`text-sm font-medium ${myTunggakan > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {myTunggakan > 0 
                    ? `Anda memiliki tunggakan sebesar ${formatRupiah(myTunggakan)}` 
                    : 'Uang kas Anda lunas!'}
                </p>
              </div>
            </div>
            {myTunggakan > 0 && (
              <div className="hidden md:flex bg-rose-200 text-rose-800 font-bold text-xs px-4 py-2 rounded-full">
                Hubungi Bendahara
              </div>
            )}
          </div>
        )}

        {/* Akses Cepat Header & Controls */}
        <div className="mt-8 mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Akses Cepat</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTour(true)}
              className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Panduan Interaktif Fitur"
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Panduan Fitur</span>
            </button>

            <button
              onClick={() => setIsCustomizeModalOpen(true)}
              className="text-xs font-semibold text-slate-600 hover:text-[#0087FF] bg-white border border-slate-200 hover:border-blue-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Sesuaikan Shortcut"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sesuaikan</span>
            </button>
          </div>
        </div>

        {/* 2x2 Grid System */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {activeShortcuts.map((shortcut) => {
            const Icon = shortcut.icon
            return (
              <Link
                key={shortcut.id}
                href={shortcut.href}
                data-tour={`tour-shortcut-${shortcut.id}`}
                className={`bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center ${shortcut.hoverBorder} transition-all hover:shadow-md group min-w-0`}
              >
                <div className={`flex items-center gap-2 mb-2 ${shortcut.iconColor} font-bold group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-slate-800 truncate">{shortcut.title}</span>
                </div>
                <span className="text-slate-500 font-semibold text-sm group-hover:text-slate-700 transition-colors truncate">
                  {shortcut.subtitle}
                </span>
              </Link>
            )
          })}
          {activeShortcuts.length < 4 && Array.from({ length: 4 - activeShortcuts.length }).map((_, idx) => (
            <button
              key={`empty-slot-${idx}`}
              type="button"
              onClick={() => setIsCustomizeModalOpen(true)}
              className="border-2 border-dashed border-slate-200 hover:border-[#0087FF]/40 bg-white/60 hover:bg-blue-50/40 p-5 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-[#0087FF] transition-all min-h-[92px] group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#E0F4FE] flex items-center justify-center transition-colors">
                <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0087FF]" />
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-[#0087FF]">Tambah Shortcut</span>
            </button>
          ))}
        </div>



        {/* List Section (Goals) */}
        <div className="bg-white mt-6 rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-2">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
                <Target className="w-6 h-6" />
                <span className="text-slate-900 text-lg">Target & Agenda</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {goals.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">Belum ada target yang aktif.</div>
            ) : (
              goals.map((goal) => {
                const target = goal.target_amount ? parseFloat(goal.target_amount) : 0
                const current = goal.current_amount ? parseFloat(goal.current_amount) : 0
                const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0

                return (
                  <Link key={goal.id} href={`/org/${orgSlug}/financial/goals/${goal.id}`} className="py-4 flex justify-between items-center group cursor-pointer hover:px-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {percentage}%
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{goal.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">Terkumpul {formatRupiah(current)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white mt-6 rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-2">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                <History className="w-6 h-6" />
                <span className="text-slate-900 text-lg">Transaksi Terbaru</span>
              </div>
            </div>
            <Link 
              href={`/org/${orgSlug}/financial`}
              className="text-xs font-bold text-[#007AE6] bg-[#E0F4FE] px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">Belum ada transaksi dicatat.</div>
            ) : (
              records.slice(0, 5).map((record) => (
                <div key={record.id} className="py-4 flex justify-between items-center group transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {record.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{record.category}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(record.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {record.profile.full_name || record.profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${record.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {record.type === 'income' ? '+' : '-'}{formatRupiah(record.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* Modal Kustomisasi Shortcut */}
      {isCustomizeModalOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCustomizeModalOpen(false)
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[82vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 relative my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Sesuaikan Akses Cepat</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    currentShortcutIds.length === 4 
                      ? 'text-[#007AE6] bg-[#E0F4FE] border-[#0087FF]/30' 
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {currentShortcutIds.length}/4 Dipilih
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Tersimpan otomatis
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shrink-0 -mr-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction description or alert */}
            <div className="py-2.5 px-0.5 shrink-0">
              {slotFullNotice ? (
                <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>4 slot sudah terisi. Ketuk shortcut yang aktif untuk melepas slot terlebih dahulu.</span>
                </div>
              ) : currentShortcutIds.length < 4 ? (
                <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#0087FF] shrink-0" />
                  <span>Tersedia <strong>{4 - currentShortcutIds.length} slot kosong</strong>. Ketuk shortcut yang ingin dipasang.</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 px-1">
                  Ketuk shortcut yang sedang <strong className="text-blue-600">Aktif</strong> untuk melepas slot, lalu ketuk shortcut baru yang ingin dipasang.
                </p>
              )}
            </div>

            {/* Scrollable Features Catalog */}
            <div className="overflow-y-auto py-1 space-y-2 flex-1 pr-1 overscroll-contain">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {allShortcutsCatalog.map((item) => {
                  const Icon = item.icon
                  const isSelected = currentShortcutIds.includes(item.id)

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          // Klik shortcut aktif -> LEPAS slot!
                          const updated = currentShortcutIds.filter(id => id !== item.id)
                          setCustomShortcuts(updated)
                          try {
                            localStorage.setItem(`kitaatur_shortcuts_${orgSlug}`, JSON.stringify(updated))
                          } catch (e) {
                            console.error('Failed to save shortcuts', e)
                          }
                          setSlotFullNotice(false)
                        } else {
                          // Klik shortcut yang dipengen -> PASANG slot!
                          if (currentShortcutIds.length >= 4) {
                            // 4 slot sudah penuh, beri tahu user untuk melepas shortcut aktif dulu
                            setSlotFullNotice(true)
                            setTimeout(() => setSlotFullNotice(false), 3000)
                            return
                          }
                          const updated = [...currentShortcutIds, item.id]
                          setCustomShortcuts(updated)
                          try {
                            localStorage.setItem(`kitaatur_shortcuts_${orgSlug}`, JSON.stringify(updated))
                          } catch (e) {
                            console.error('Failed to save shortcuts', e)
                          }
                          setSlotFullNotice(false)
                        }
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-3 relative group active:scale-[0.99] ${
                        isSelected 
                          ? 'border-[#0087FF] bg-[#E0F4FE]/40 shadow-sm ring-1 ring-[#0087FF]/20' 
                          : currentShortcutIds.length >= 4
                            ? 'border-slate-200 bg-white/70 hover:border-slate-300'
                            : 'border-slate-200 hover:border-[#0087FF]/40 bg-white hover:bg-[#E0F4FE]/20'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-[#0087FF] text-white shadow-sm' 
                          : 'bg-slate-100 ' + item.iconColor
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 flex items-center pt-0.5">
                        {isSelected ? (
                          <span className="text-[10px] font-bold text-[#007AE6] bg-[#E0F4FE] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm group-hover:bg-rose-100 group-hover:text-rose-700 transition-colors" title="Ketuk untuk melepas slot">
                            <Check className="w-2.5 h-2.5 stroke-[3] group-hover:hidden" />
                            <X className="w-2.5 h-2.5 stroke-[3] hidden group-hover:inline" />
                            <span className="group-hover:hidden">Aktif</span>
                            <span className="hidden group-hover:inline">Lepas</span>
                          </span>
                        ) : currentShortcutIds.length < 4 ? (
                          <span className="text-[10px] font-bold text-[#0087FF] bg-[#E0F4FE] group-hover:bg-[#0087FF] group-hover:text-white px-2.5 py-0.5 rounded-full border border-[#0087FF]/30 transition-colors">
                            + Pasang
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            Penuh
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer with Reset and Tutup */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCustomShortcuts(null)
                  localStorage.removeItem(`kitaatur_shortcuts_${orgSlug}`)
                }}
                className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Reset ke Default Peran
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Spotlight Walkthrough Tour */}
      <SpotlightTour
        tourKey="dashboard"
        steps={dashboardTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}
