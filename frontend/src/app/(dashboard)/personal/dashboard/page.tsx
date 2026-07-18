'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import TransactionForm from './transaction-form'
import { User, Bell, ChevronUp, ChevronDown, Plus, Wallet, Target, Info, ArrowUpRight, ArrowDownRight, X, Calendar, Clock, ChevronRight, BadgeCheck } from 'lucide-react'

interface Summary {
  income: number
  expense: number
  balance: number
}

interface Record {
  id: string
  amount: string
  type: 'income' | 'expense'
  category: string
  description: string | null
  transaction_date: string
  receipt_url?: string | null
}

interface Goal {
  id: string
  title: string
  target_amount: string | null
  current_amount: string | null
  deadline: string | null
  status: 'active' | 'completed' | 'failed'
}

export default function PersonalDashboard() {
  const [userName, setUserName] = useState('Pengguna')
  const [userAvatar, setUserAvatar] = useState<string|null>(null)
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 })
  const [records, setRecords] = useState<Record[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [agendas, setAgendas] = useState<any[]>([])
  const [activeHero, setActiveHero] = useState<number>(0)
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState<number>(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [isVerified, setIsVerified] = useState(false)

  const formatRupiah = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  const fetchData = async () => {
    try {
      const summaryRes = await api.get('/personal/summary')
      setSummary(summaryRes.data.summary)
      setRecords(summaryRes.data.records)

      const goalsRes = await api.get('/personal/goals')
      setGoals(goalsRes.data)

      try {
        const orgsRes = await api.get('/org/me/list')
        const orgsList = orgsRes.data || [];
        
        // Fetch agendas from all joined orgs
        const agendaPromises = orgsList.map((org: any) => 
          api.get(`/org-attendance/${org.slug}/agenda`).catch(() => ({ data: [] }))
        );
        const agendaResponses = await Promise.all(agendaPromises);
        
        let allAgendas: any[] = [];
        agendaResponses.forEach((res, index) => {
          if (res.data && res.data.length > 0) {
            const orgAgendas = res.data.map((a: any) => ({
              ...a,
              orgSlug: orgsList[index].slug,
              orgName: orgsList[index].name
            }));
            allAgendas = allAgendas.concat(orgAgendas);
          }
        });
        
        allAgendas.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        setAgendas(allAgendas);
      } catch (err) {
        console.error('Failed to fetch org agendas', err)
      }

      try {
        const notifRes = await api.get('/notifications')
        const unread = notifRes.data.filter((n: any) => !n.is_read)
        setUnreadNotifs(unread.length)
      } catch (e) {
        console.error('Failed to load notifs')
      }

      try {
        const subRes = await api.get('/subscription/me')
        setIsVerified(subRes.data.some((s: any) => s.status === 'active'))
      } catch (e) {
        console.error('Failed to fetch subs', e)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
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
      }
      await fetchData()
      setLoading(false)
    }
    init()
  }, [])

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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      
      {/* Top Navigation Bar  */}
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

        {/* Logo and App Name */}
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/settings" className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center p-1.5 shrink-0">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </Link>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">KitaAtur</span>
            </div>
            {!isVerified && (
              <Link href="/upgrade" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md shadow-blue-500/20 transition-all">
                Upgrade
              </Link>
            )}
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

              {/* Slide 2: Sisa Saldo Anda */}
              <div className="w-full flex-none">
                <div className="bg-blue-600 p-5 md:p-6 text-white relative overflow-hidden h-full">
                  <div className="flex justify-between items-start mb-1 relative z-10">
                    <div className="flex items-center gap-2 opacity-90">
                      <span className="font-semibold text-base">Sisa Saldo Anda</span>
                      <Info className="w-4 h-4 opacity-70" />
                    </div>
                    <button 
                      onClick={() => setShowFormModal(true)}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                  
                  <div className="relative z-10 mt-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight truncate">{formatRupiah(summary.balance)}</h1>
                    <div className="flex items-center gap-1 mt-2 font-semibold text-xs md:text-sm bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Bersih bulan ini</span>
                    </div>
                  </div>
                  
                  {/* Decorative background circle */}
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
                aria-label="Sisa Saldo Anda"
              />
            </div>
          )}
        </div>

        {/* 2x2 Grid System */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6">
          <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
              <Wallet className="w-5 h-5" />
              <span className="text-slate-800">Dompet</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm">{formatRupiah(summary.balance)}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-slate-800">Masuk</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm">{formatRupiah(summary.income)}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-rose-200 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold">
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-slate-800">Keluar</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm">{formatRupiah(summary.expense)}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold">
              <Target className="w-5 h-5" />
              <span className="text-slate-800">Target</span>
            </div>
            <span className="text-slate-500 font-semibold text-sm">{goals.length} Aktif</span>
          </div>
        </div>

        {/* List Section (Riwayat Transaksi - "Brain" equivalent) */}
        <div className="bg-white mt-6 rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-2">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-slate-900 text-lg">Riwayat Transaksi</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">Belum ada transaksi.</div>
            ) : (
              records.slice(0, 5).map((record) => (
                <div key={record.id} className="py-4 flex justify-between items-center group cursor-pointer hover:px-2 transition-all">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${record.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {record.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{record.category}</h4>
                      <p className="text-xs text-slate-500 font-medium truncate">{record.description || 'Tidak ada keterangan'}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2 md:gap-3 shrink-0">
                    <div>
                      <span className={`font-bold block whitespace-nowrap ${record.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {record.type === 'income' ? '+' : '-'} {formatRupiah(record.amount)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        {new Date(record.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
          
          {records.length > 5 && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <Link href="#" className="text-blue-600 font-bold text-sm hover:text-blue-700">
                Lihat semua riwayat
              </Link>
            </div>
          )}
        </div>

      </main>

      {/* Transaction Modal Popup */}
      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFormModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-2 md:p-6 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 pb-10 md:pb-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowFormModal(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <TransactionForm onSuccess={() => { fetchData(); setShowFormModal(false); }} />
          </div>
        </div>
      )}

    </div>
  )
}
