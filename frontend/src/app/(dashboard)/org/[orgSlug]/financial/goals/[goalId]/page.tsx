'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, ArrowRight, Wallet, AlertTriangle, Plus, CreditCard, ChevronRight, Check, Target, Minus, ArrowRightLeft, RefreshCw, Calendar, History } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface Goal {
  id: string
  title: string
  description: string | null
  target_amount: string | null
  current_amount: string
  type: string
  budget_category: string | null
  deadline: string | null
  status: string
}

interface GoalTransaction {
  id: string
  amount: string
  source: string
  type: string // 'income', 'expense', 'transfer_out'
  description: string | null
  created_at: string
  profile: {
    full_name: string
    email: string
  }
}

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const goalId = params.goalId as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [goal, setGoal] = useState<Goal | null>(null)
  const [transactions, setTransactions] = useState<GoalTransaction[]>([])
  const [allGoals, setAllGoals] = useState<Goal[]>([]) // For transfer dropdown

  // Modals state
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [manageAction, setManageAction] = useState<'income' | 'expense' | 'transfer_kas' | 'transfer_goal'>('income')
  
  // Form states
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [incomeSource, setIncomeSource] = useState<'kas' | 'eksternal'>('kas')
  const [destinationGoalId, setDestinationGoalId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // User States
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const isEditor = currentUserRole === 'bendahara'

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug, goalId])

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUserId(user.id)

    try {
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      } else {
        router.push('/personal/dashboard')
        return
      }
      await fetchData()
    } catch (err) {
      console.error('Error fetching role:', err)
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [goalsRes, txRes] = await Promise.all([
        api.get(`/org/${orgSlug}/goals`),
        api.get(`/org/${orgSlug}/goals/${goalId}/transactions`)
      ])
      
      const goalsList = goalsRes.data
      const currentGoal = goalsList.find((g: Goal) => g.id === goalId)
      
      if (!currentGoal) {
        toast.error('Target tidak ditemukan')
        router.push(`/org/${orgSlug}/financial/goals`)
        return
      }

      setGoal(currentGoal)
      setAllGoals(goalsList.filter((g: Goal) => g.id !== goalId)) // Exclude current goal
      setTransactions(txRes.data)
    } catch (err) {
      console.error('Error fetching goal details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handlers

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (manageAction === 'income') {
        await api.post(`/org/${orgSlug}/goals/${goalId}/progress`, {
          amount: parseFloat(amount),
          source: incomeSource,
          description
        })
      } else {
        await api.post(`/org/${orgSlug}/goals/${goalId}/manage`, {
          action: manageAction,
          amount: parseFloat(amount),
          description,
          destination_goal_id: manageAction === 'transfer_goal' ? destinationGoalId : undefined
        })
      }
      setIsManageModalOpen(false)
      setAmount('')
      setDescription('')
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memproses transaksi target')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatRupiah = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num)
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (!goal) return null

  const progressPercentage = goal.target_amount 
    ? Math.min(Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100), 100) 
    : 0

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Info */}
      <header className="bg-white border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-5xl mx-auto px-6">
          <Link 
            href={`/org/${orgSlug}/financial/goals`}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Target
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{goal.title}</h1>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200">
                    {goal.type === 'saving' ? 'Tabungan' : 'Anggaran'}
                  </span>
                  {goal.budget_category && (
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-semibold rounded-full border border-violet-100">
                      {goal.budget_category}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-500 text-sm max-w-xl">
                {goal.description || 'Tidak ada deskripsi'}
              </p>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Segarkan Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8">
        
        {/* Ringkasan Saldo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm font-semibold mb-1">Saldo Tersedia</h3>
            <div className="text-4xl font-bold text-slate-900 mb-4">{formatRupiah(goal.current_amount)}</div>
            
            {goal.target_amount && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target: {formatRupiah(goal.target_amount)}</span>
                  <span className="font-bold text-violet-600">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-violet-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {goal.deadline && (
              <div className="mt-4 flex items-center text-sm text-slate-500">
                <Calendar className="w-4 h-4 mr-2" />
                Batas Waktu: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 justify-center">
            <h3 className="text-slate-900 font-semibold mb-2">Kelola Dana Target</h3>
            
            {isEditor ? (
              <>
                <button 
                  onClick={() => { setManageAction('income'); setIsManageModalOpen(true); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-sm transition-colors border border-emerald-200"
                >
                  <Plus className="w-4 h-4" /> Tambah Saldo
                </button>
                
                <button 
                  onClick={() => { setManageAction('expense'); setIsManageModalOpen(true); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-sm transition-colors border border-rose-200"
                >
                  <Minus className="w-4 h-4" /> Catat Pengeluaran
                </button>
                
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button 
                    onClick={() => { setManageAction('transfer_kas'); setIsManageModalOpen(true); }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5" /> Ke Kas
                  </button>
                  <button 
                    onClick={() => { setManageAction('transfer_goal'); setIsManageModalOpen(true); }}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Pindah Target
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Hanya bendahara yang dapat mengelola dana target.</p>
            )}
          </div>
        </div>

        {/* Laporan Riwayat Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" /> 
              Laporan Penggunaan Anggaran
            </h2>
          </div>
          
          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Belum ada riwayat transaksi pada target ini.
            </div>
          ) : (
            <>
              {/* Tampilan Desktop (Tabel) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold border-b border-slate-200 whitespace-nowrap">Tanggal</th>
                      <th className="px-6 py-4 font-semibold border-b border-slate-200 whitespace-nowrap">Tipe / Aksi</th>
                      <th className="px-6 py-4 font-semibold border-b border-slate-200">Keterangan</th>
                      <th className="px-6 py-4 font-semibold border-b border-slate-200 whitespace-nowrap">Nominal</th>
                      <th className="px-6 py-4 font-semibold border-b border-slate-200 whitespace-nowrap">Dicatat Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => {
                      const isIncome = tx.type === 'income' || (!tx.type && tx.amount)
                      const isExpense = tx.type === 'expense'
                      const isTransfer = tx.type === 'transfer_out'
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isIncome && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Uang Masuk</span>}
                            {isExpense && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Pengeluaran</span>}
                            {isTransfer && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Transfer Keluar</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800 max-w-xs truncate">
                            {tx.description || '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {tx.profile.full_name || tx.profile.email}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Mobile (Card List) */}
              <div className="md:hidden divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income' || (!tx.type && tx.amount)
                  const isExpense = tx.type === 'expense'
                  const isTransfer = tx.type === 'transfer_out'

                  return (
                    <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          {isIncome && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1.5">Uang Masuk</span>}
                          {isExpense && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-1.5">Pengeluaran</span>}
                          {isTransfer && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-1.5">Transfer Keluar</span>}
                          
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">
                            {tx.description || '-'}
                          </p>
                        </div>
                        <div className={`text-right whitespace-nowrap text-sm font-bold ml-3 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                        <span>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="truncate max-w-[120px] text-right">{tx.profile.full_name || tx.profile.email}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Manage Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">
                {manageAction === 'income' && 'Tambah Saldo Target'}
                {manageAction === 'expense' && 'Catat Pengeluaran'}
                {manageAction === 'transfer_kas' && 'Tarik Dana ke Kas Utama'}
                {manageAction === 'transfer_goal' && 'Pindah ke Target Lain'}
              </h3>
              <button onClick={() => setIsManageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleManageSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={amount ? new Intl.NumberFormat('id-ID').format(parseInt(amount, 10)) : ''}
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold text-lg"
                  placeholder="0"
                  required
                />
                {manageAction !== 'income' && (
                  <p className="text-xs text-slate-500 mt-1">Maksimal: {formatRupiah(goal.current_amount)}</p>
                )}
              </div>

              {manageAction === 'income' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Dana</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="source" 
                        value="kas" 
                        checked={incomeSource === 'kas'} 
                        onChange={() => setIncomeSource('kas')}
                        className="text-violet-600 focus:ring-violet-500" 
                      />
                      <span className="text-sm text-slate-700">Potong Kas Utama</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="source" 
                        value="eksternal" 
                        checked={incomeSource === 'eksternal'} 
                        onChange={() => setIncomeSource('eksternal')}
                        className="text-violet-600 focus:ring-violet-500" 
                      />
                      <span className="text-sm text-slate-700">Dana Eksternal</span>
                    </label>
                  </div>
                </div>
              )}

              {manageAction === 'transfer_goal' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Target Tujuan</label>
                  <CustomSelect
                    value={destinationGoalId}
                    onChange={val => setDestinationGoalId(val)}
                    placeholder="-- Pilih Target / Tabungan --"
                    options={allGoals.map(g => ({
                      label: `${g.title} (Sisa: ${formatRupiah(g.current_amount)})`,
                      value: g.id
                    }))}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Catatan</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  placeholder={manageAction === 'expense' ? "Beli perlengkapan acara..." : "Keterangan opsional..."}
                  rows={2}
                  required={manageAction === 'expense'}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsManageModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 font-semibold rounded-xl text-sm transition-colors text-white ${
                    manageAction === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    manageAction === 'expense' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-violet-600 hover:bg-violet-700'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Konfirmasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
