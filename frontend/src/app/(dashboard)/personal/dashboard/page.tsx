'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import TransactionForm from './transaction-form'
import { User, Bell, ChevronUp, ChevronDown, Plus, Wallet, Target, Info, ArrowUpRight, ArrowDownRight, X } from 'lucide-react'

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
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna')
        setUserAvatar(user.user_metadata?.avatar_url || null)
      }
      await fetchData()
      setLoading(false)
    }
    init()
  }, [])

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
      
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center p-4 md:px-8 max-w-4xl mx-auto pt-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 hover:scale-105 transition-transform overflow-hidden shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </Link>
          {!isVerified && (
            <Link href="/upgrade" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md shadow-blue-500/20 transition-all">
              Upgrade
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-600 font-bold text-sm hidden md:block">Halo, {userName}</span>
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
        
        {/* Hero Card (Blue) */}
        <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="flex items-center gap-2 opacity-90">
              <span className="font-semibold text-lg">Sisa Saldo Anda</span>
              <Info className="w-4 h-4 opacity-70" />
            </div>
            <button 
              onClick={() => setShowFormModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 text-sm font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
          
          <div className="relative z-10 mt-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{formatRupiah(summary.balance)}</h1>
            <div className="flex items-center gap-1 mt-3 font-semibold text-sm bg-white/20 w-fit px-3 py-1 rounded-lg backdrop-blur-sm">
              <ChevronUp className="w-4 h-4" />
              <span>Bersih bulan ini</span>
            </div>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute -bottom-24 -right-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
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

function ChevronRight(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
}
