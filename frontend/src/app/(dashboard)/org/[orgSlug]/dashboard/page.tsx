'use client'
import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, Wallet, QrCode, Target, 
  ArrowUpRight, ArrowDownRight, Settings, Bell, Info, ChevronRight, ChevronUp, ChevronDown, History, AlertCircle, CheckCircle2, Calendar, Clock, BadgeCheck
} from 'lucide-react'

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

  const [goals, setGoals] = useState<Goal[]>([])
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [financialSummary, setFinancialSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [orgData, setOrgData] = useState<any>(null)
  const [myTunggakan, setMyTunggakan] = useState<number>(0)
  const [targetAmount, setTargetAmount] = useState<number>(0)
  const [agendas, setAgendas] = useState<any[]>([])
  const [activeHero, setActiveHero] = useState<number>(0)
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState<number>(0)
  const [membersCount, setMembersCount] = useState<number>(0)

  const formatRupiah = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsRes, finRes, recordsRes, orgsRes, notifRes, settingsRes, membersRes, { data: { user } }] = await Promise.all([
          api.get(`/org/${orgSlug}/goals`),
          api.get(`/org-financial/${orgSlug}/summary`),
          api.get(`/org-financial/${orgSlug}`),
          api.get('/org/me/list'),
          api.get('/notifications').catch(() => ({ data: [] })),
          api.get(`/org/${orgSlug}/settings`),
          api.get(`/org/${orgSlug}/members`),
          supabase.auth.getUser()
        ])
        
        setGoals(goalsRes.data)
        setFinancialSummary(finRes.data.summary)
        setRecords(recordsRes.data)
        const validMembers = (membersRes.data || []).filter((m: any) => m.role !== 'auditor')
        setMembersCount(validMembers.length)
        
        const orgsList = orgsRes.data || [];
        
        // Fetch agenda from THIS org only
        const agendaRes = await api.get(`/org-attendance/${orgSlug}/agenda`).catch(() => ({ data: [] }));
        let orgAgendas: any[] = [];
        if (agendaRes.data && agendaRes.data.length > 0) {
          const currentOrg = orgsList.find((o: any) => o.slug === orgSlug) || { name: orgSlug };
          orgAgendas = agendaRes.data.map((a: any) => ({
            ...a,
            orgSlug: orgSlug,
            orgName: currentOrg.name
          }));
          orgAgendas.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }
        setAgendas(orgAgendas); // Store this org's agendas
        
        const unread = notifRes.data.filter((n: any) => !n.is_read)
        setUnreadNotifs(unread.length)

        const currentOrg = orgsRes.data.find((o: any) => o.slug === orgSlug)
        if (currentOrg) {
          setOrgData(currentOrg)
        }

        const targetAmt = settingsRes.data?.dues_target_amount ? parseFloat(settingsRes.data.dues_target_amount) : 0
        setTargetAmount(targetAmt)

        try {
          const subRes = await api.get('/subscription/me')
          setIsVerified(subRes.data.some((s: any) => s.status === 'active'))
        } catch (e) {
          console.error('Failed to fetch subs', e)
        }

        if (user) {
          try {
            const profileRes = await api.get('/personal/profile')
            const profile = profileRes.data
            
            if (!profile?.full_name) {
              router.push('/onboarding')
              return
            }
            
            setUserName(profile.full_name)
            setUserAvatar(profile.avatar_url || null)
          } catch (e) {
            router.push('/onboarding')
            return
          }
          
          const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
          if (currentMember && currentMember.joined_at && targetAmt > 0 && currentMember.role !== 'auditor') {
            const joined = new Date(currentMember.joined_at)
            const now = new Date()
            let months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1
            if (months < 1) months = 1
            
            const expected = months * targetAmt
            let paid = 0
            recordsRes.data.forEach((r: any) => {
              if (r.profile_id === user.id && r.category === 'Uang Kas') {
                paid += parseFloat(r.amount)
              }
            })
            setMyTunggakan(expected - paid)
          } else {
            setMyTunggakan(0)
          }
        }
      } catch (err) {
        console.error('Error fetching org dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orgSlug) {
      fetchData()
    }
  }, [orgSlug])

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* Top Navigation Bar */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center p-4 md:px-8 max-w-4xl mx-auto pt-6 gap-4 md:gap-0">
        
        {/* Mobile View: Greeting & Bell on Top */}
        <div className="flex md:hidden items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <span className="text-blue-600 font-bold text-sm">Halo, {userName}</span>
            {isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />}
          </div>
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
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
              {orgData?.logo_url ? (
                <img src={orgData.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </Link>
            <div className="bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              {orgData?.name || orgSlug}
            </div>
          </div>
        </div>
        
        {/* Desktop Greeting & Bell */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-blue-600 font-bold text-sm">Halo, {userName}</span>
            {isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />}
          </div>
          <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <Bell className="w-6 h-6" />
            {unreadNotifs > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            )}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:px-8 pb-32">
        
        {/* Unified Hero Section (Slider) */}
        <div className="relative mb-8">
          <div className="relative overflow-hidden rounded-3xl shadow-xl shadow-blue-600/20 bg-blue-600">
            <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.87,0,0.13,1)]" style={{ transform: `translateX(-${activeHero * 100}%)` }}>
              
              {/* Slide 1: Agenda (satu slide, ganti-gantian isinya) */}
              {agendas.length > 0 && (
                <div className="w-full flex-none">
                  <Link href={`/org/${agendas[currentAgendaIndex].orgSlug}/attendance`} className="block bg-blue-600 p-5 md:p-6 text-white relative overflow-hidden h-full group cursor-pointer">
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex items-center gap-2 opacity-90">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold text-base tracking-wide">{agendas[currentAgendaIndex].orgName}</span>
                      </div>
                      {new Date() >= new Date(agendas[currentAgendaIndex].start_time) ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-rose-500/20">Berjalan</span>
                      ) : (
                        <span className="bg-white text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Mendatang</span>
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
                <div className="bg-blue-600 p-5 md:p-6 text-white relative overflow-hidden h-full">
                  <div className="flex justify-between items-start mb-1 relative z-10">
                    <div className="flex items-center gap-2 opacity-90">
                      <span className="font-semibold text-base">Kas Organisasi</span>
                      <Info className="w-4 h-4 opacity-70" />
                    </div>
                    <Link 
                      href={`/org/${orgSlug}/financial`}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
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
                className={`h-1.5 rounded-full transition-all duration-500 ${activeHero === 0 ? 'bg-blue-600 w-6' : 'bg-slate-300 w-1.5'}`}
                aria-label="Agenda"
              />
              <button 
                onClick={() => setActiveHero(1)} 
                className={`h-1.5 rounded-full transition-all duration-500 ${activeHero === 1 ? 'bg-blue-600 w-6' : 'bg-slate-300 w-1.5'}`}
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
                    : 'Uang kas Anda lunas! 🎉'}
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



        {/* 2x2 Grid System */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Link href={`/org/${orgSlug}/members`} className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-purple-200 transition-colors group min-w-0">
            <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold">
              <Users className="w-5 h-5 shrink-0" />
              <span className="text-slate-800 truncate">Anggota</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm group-hover:text-purple-600 transition-colors truncate">{membersCount} Terdaftar</span>
          </Link>

          <Link href={`/org/${orgSlug}/attendance`} className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-blue-200 transition-colors group min-w-0">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
              <QrCode className="w-5 h-5 shrink-0" />
              <span className="text-slate-800 truncate">Absensi</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm group-hover:text-blue-600 transition-colors truncate">Buka Scanner QR</span>
          </Link>

          <Link href={`/org/${orgSlug}/financial`} className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-emerald-200 transition-colors cursor-pointer group min-w-0">
            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5 shrink-0" />
              <span className="text-slate-800 truncate">Masuk</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm group-hover:text-emerald-700 transition-colors truncate">{formatRupiah(financialSummary.income)}</span>
          </Link>

          <Link href={`/org/${orgSlug}/financial`} className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-rose-200 transition-colors cursor-pointer group min-w-0">
            <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold group-hover:scale-105 transition-transform">
              <ArrowDownRight className="w-5 h-5 shrink-0" />
              <span className="text-slate-800 truncate">Keluar</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm group-hover:text-rose-600 transition-colors truncate">{formatRupiah(financialSummary.expense)}</span>
          </Link>
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
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
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
    </div>
  )
}
