'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, Wallet, Plus, X, AlertCircle } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { api, supabase } from '@/lib/api'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface Goal {
  id: string
  title: string
  description: string | null
  type: 'saving' | 'budget'
  target_amount: string
  current_amount: string
  budget_category: string | null
  period: string
  deadline: string | null
}

interface GoalTransaction {
  id: string
  amount: string
  source: string
  description: string | null
  created_at: string
  profile: {
    full_name: string
    email: string
  }
}

export default function GoalsPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const [activeTab, setActiveTab] = useState<'saving' | 'budget'>('saving')
  
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'saving' | 'budget'>('saving')
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [budgetCategory, setBudgetCategory] = useState('Operasional')
  const [savingCategory, setSavingCategory] = useState('')
  
  // Progress Modal State
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [progressGoalId, setProgressGoalId] = useState('')
  const [progressAmount, setProgressAmount] = useState('')
  const [progressSource, setProgressSource] = useState<'kas' | 'eksternal'>('eksternal')
  const [progressDescription, setProgressDescription] = useState('')
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false)
  
  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyGoalId, setHistoryGoalId] = useState('')
  const [historyTitle, setHistoryTitle] = useState('')
  const [transactions, setTransactions] = useState<GoalTransaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // User States
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const isEditor = currentUserRole === 'bendahara'

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug])

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
      await fetchGoals()
    } catch (err) {
      console.error('Error fetching role:', err)
      setLoading(false)
    }
  }

  const fetchGoals = async () => {
    try {
      const res = await api.get(`/org/${orgSlug}/goals`)
      setGoals(res.data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!await await confirm('Konfirmasi', 'Hapus target/anggaran ini?')) return
    try {
      await api.delete(`/org/${orgSlug}/goals/${id}`)
      fetchGoals()
    } catch (err) {
      toast.error('Gagal menghapus target')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/org/${orgSlug}/goals`, {
        title: modalType === 'budget' ? `Limit ${budgetCategory}` : title,
        target_amount: parseFloat(targetAmount),
        type: modalType,
        budget_category: modalType === 'saving' ? (savingCategory || 'Lain-lain') : budgetCategory
      })
      setIsModalOpen(false)
      setTitle('')
      setTargetAmount('')
      fetchGoals()
    } catch (err) {
      toast.error('Gagal menyimpan target')
    }
  }

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingProgress(true)
    try {
      await api.post(`/org/${orgSlug}/goals/${progressGoalId}/progress`, {
        amount: parseFloat(progressAmount),
        source: progressSource,
        description: progressSource === 'eksternal' ? progressDescription : null
      })
      setIsProgressModalOpen(false)
      setProgressAmount('')
      setProgressDescription('')
      setProgressGoalId('')
      fetchGoals()
    } catch (err) {
      toast.error('Gagal menambah saldo target')
    } finally {
      setIsSubmittingProgress(false)
    }
  }

  const fetchTransactions = async (goalId: string, goalTitle: string) => {
    setHistoryGoalId(goalId)
    setHistoryTitle(goalTitle)
    setIsHistoryModalOpen(true)
    setLoadingHistory(true)
    try {
      const res = await api.get(`/org/${orgSlug}/goals/${goalId}/transactions`)
      setTransactions(res.data)
    } catch (err) {
      console.error('Failed to fetch transactions', err)
      toast.error('Gagal mengambil riwayat transaksi')
    } finally {
      setLoadingHistory(false)
    }
  }

  const formatRupiah = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(amount))
  }

  const savings = goals.filter(g => g.type === 'saving')
  const budgets = goals.filter(g => g.type === 'budget')

  const expenseCategories = ['Operasional', 'Konsumsi', 'Perlengkapan', 'Publikasi', 'Logistik', 'Lain-lain']

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link 
            href={`/org/${orgSlug}/financial`}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Laporan Kas
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-3">
            <Target className="h-8 w-8 text-violet-600" />
            Anggaran & Target
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Atur limit pengeluaran bulanan atau target tabungan acara.</p>
        </div>

        {isEditor && (
          <button
            onClick={() => {
              setModalType(activeTab)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-lg hover:shadow-slate-900/20 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'saving' ? 'Buat Target Baru' : 'Atur Limit Anggaran'}
          </button>
        )}
      </header>

      <main className="relative z-10 max-w-5xl mx-auto">
        
        {/* Tabs */}
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl mb-8 w-full max-w-md shadow-sm">
          <button
            onClick={() => setActiveTab('saving')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'saving' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Target Tabungan
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'budget' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Batas Anggaran
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white border border-slate-200 rounded-2xl"></div>
            <div className="h-32 bg-white border border-slate-200 rounded-2xl"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'saving' && (
              <>
                {savings.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500">
                    Belum ada target tabungan yang dibuat.
                  </div>
                ) : (
                  savings.map(goal => {
                    const current = parseFloat(goal.current_amount)
                    const target = parseFloat(goal.target_amount)
                    const percent = Math.min((current / target) * 100, 100)
                    return (
                      <div key={goal.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                              {goal.budget_category && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                  {goal.budget_category}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">Terkumpul: <strong className="text-violet-600">{formatRupiah(current)}</strong> dari {formatRupiah(target)}</p>
                          </div>
                          {isEditor && (
                            <button onClick={() => handleDelete(goal.id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                          <div className="bg-violet-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/org/${orgSlug}/financial/goals/${goal.id}`}
                              className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                            >
                              Kelola Target ➔
                            </Link>
                          </div>
                          <div className="text-right text-xs font-bold text-violet-600">{percent.toFixed(1)}%</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </>
            )}

            {activeTab === 'budget' && (
              <>
                <div className="mb-4 flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-xl text-sm font-medium border border-amber-100">
                  <AlertCircle className="w-5 h-5" />
                  Pengeluaran bulan ini otomatis mengurangi batas anggaran di bawah.
                </div>
                {budgets.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500">
                    Belum ada limit anggaran kategori.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {budgets.map(budget => {
                      const spent = parseFloat(budget.current_amount)
                      const limit = parseFloat(budget.target_amount)
                      const percent = Math.min((spent / limit) * 100, 100)
                      const isDanger = percent >= 90
                      const isWarning = percent >= 75 && percent < 90
                      
                      const barColor = isDanger ? 'bg-rose-500' : (isWarning ? 'bg-amber-500' : 'bg-emerald-500')
                      const textColor = isDanger ? 'text-rose-600' : (isWarning ? 'text-amber-600' : 'text-emerald-600')

                      return (
                        <div key={budget.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 group">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">Kategori</span>
                              <h3 className="text-xl font-extrabold text-slate-900">{budget.budget_category}</h3>
                            </div>
                            {isEditor && (
                              <button onClick={() => handleDelete(budget.id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition">
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Terpakai bulan ini</span>
                              <strong className={textColor}>{formatRupiah(spent)}</strong>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className={`${barColor} h-3 rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">0</span>
                              <span className="font-bold text-slate-700">Limit: {formatRupiah(limit)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl modal-animate-enter">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">
                {modalType === 'saving' ? 'Buat Target Tabungan' : 'Atur Limit Anggaran'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              
              {modalType === 'saving' && (
                <>
                  <div>
                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Nama Target</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Misal: Beli Proyektor Baru"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Kategori Tabungan (Opsional)</label>
                    <input
                      type="text"
                      value={savingCategory}
                      onChange={e => setSavingCategory(e.target.value)}
                      placeholder="Misal: Gadget, Liburan, Darurat"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {modalType === 'budget' && (
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Kategori Pengeluaran</label>
                  <CustomSelect
                    value={budgetCategory}
                    onChange={val => setBudgetCategory(val)}
                    options={expenseCategories.map(cat => ({ label: cat, value: cat }))}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                  {modalType === 'saving' ? 'Target Nominal (Rp)' : 'Batas Maksimal per Bulan (Rp)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={targetAmount ? new Intl.NumberFormat('id-ID').format(parseInt(targetAmount, 10)) : ''}
                  onChange={(e) => setTargetAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Misal: 1000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl ${modalType === 'saving' ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'}`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {isProgressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl modal-animate-enter">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Tambah Saldo Target</h3>
              <button onClick={() => setIsProgressModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProgress} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Nominal (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={progressAmount ? new Intl.NumberFormat('id-ID').format(parseInt(progressAmount, 10)) : ''}
                  onChange={(e) => setProgressAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="Misal: 500000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Sumber Dana</label>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setProgressSource('kas')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${progressSource === 'kas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Kas Organisasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressSource('eksternal')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${progressSource === 'eksternal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Dana Eksternal
                  </button>
                </div>
                {progressSource === 'kas' && (
                  <p className="text-[10px] text-amber-600 font-medium mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Memilih kas akan mengurangi saldo kas utama dan tercatat sebagai pengeluaran alokasi.
                  </p>
                )}
                {progressSource === 'eksternal' && (
                  <div className="mt-4">
                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Keterangan Dana (Wajib)</label>
                    <input
                      type="text"
                      required
                      value={progressDescription}
                      onChange={(e) => setProgressDescription(e.target.value)}
                      placeholder="Misal: Dana bantuan Pak Budi"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingProgress}
                className="w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl bg-violet-600 hover:bg-violet-700 shadow-violet-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmittingProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  'Tambah Saldo'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Riwayat Saldo</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{historyTitle}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada riwayat penambahan saldo.
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((trx) => (
                    <div key={trx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {trx.source === 'eksternal' && trx.description 
                            ? trx.description 
                            : (trx.profile.full_name || trx.profile.email)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(trx.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          trx.source === 'kas' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {trx.source === 'kas' ? 'Kas Organisasi' : 'Dana Eksternal'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">
                          +{formatRupiah(trx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
