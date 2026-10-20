'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, getApiCachedData } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, Target, PlusCircle, CheckCircle } from '@phosphor-icons/react'

interface Goal {
  id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  deadline: string | null
  status: 'active' | 'completed' | 'failed'
}

export default function PersonalTargetsPage() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchGoals = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const res = await api.get('/personal/goals')
      setGoals(res.data)
    } catch (err) {
      console.error('Failed to fetch personal goals:', err)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    const cached = getApiCachedData<Goal[]>('/personal/goals')
    if (cached && cached.length > 0) {
      setGoals(cached)
      setLoading(false)
      fetchGoals(false)
    } else {
      fetchGoals(true)
    }
  }, [])

  const handleAddProgress = async (goalId: string) => {
    const amount = Number(addAmounts[goalId])
    if (!amount || amount <= 0) return

    setUpdating(goalId)
    try {
      await api.patch(`/personal/goals/${goalId}/progress`, { amount_to_add: amount })
      
      // Refresh data
      const res = await api.get('/personal/goals')
      setGoals(res.data)
      setAddAmounts(prev => ({ ...prev, [goalId]: '' }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menambah progress')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden animate-pulse">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="h-3 w-28 bg-slate-200 rounded-md mb-3" />
              <div className="h-8 w-64 bg-slate-300 rounded-xl" />
              <div className="h-4 w-52 bg-slate-200 rounded-md mt-2" />
            </div>
            <div className="h-11 w-36 bg-slate-200 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-5 w-36 bg-slate-200 rounded-md" />
                  <div className="w-6 h-6 bg-slate-100 rounded-full" />
                </div>
                <div className="h-7 w-28 bg-slate-300 rounded-lg" />
                <div className="h-3 w-full bg-slate-100 rounded-full" />
                <div className="flex justify-between pt-2">
                  <div className="h-4 w-20 bg-slate-200 rounded-md" />
                  <div className="h-4 w-12 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#E0F4FE] rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <header className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-[#0087FF]" />
            Target Finansial
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Lacak pencapaian dan wujudkan impian finansial Anda.</p>
        </div>
        <Link 
          href="/personal/targets/create"
          className="flex items-center gap-2 px-5 py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
        >
          <PlusCircle className="h-5 w-5" />
          Buat Target Baru
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto">
        {goals.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Target</h3>
            <p className="text-slate-500 mb-6">Mulai rencanakan masa depan Anda dengan menetapkan target tabungan baru!</p>
            <Link 
              href="/personal/targets/create"
              className="inline-block px-6 py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Mulai Buat Target Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              
              return (
                <div key={goal.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                      {progress >= 100 && (
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                      <span className="text-slate-500">Terkumpul</span>
                      <span className="text-[#0087FF]">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className="bg-[#0087FF] h-3 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Total Tabungan</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(goal.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium mb-1">Target Nominal</p>
                        <p className="text-sm font-bold text-slate-700">{formatCurrency(goal.target_amount)}</p>
                      </div>
                    </div>
                    
                    {progress < 100 && (
                      <div className="mt-6 pt-6 border-t border-slate-100 flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Tambah Nominal..."
                          value={addAmounts[goal.id] || ''}
                          onChange={(e) => setAddAmounts({ ...addAmounts, [goal.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0087FF]"
                        />
                        <button
                          onClick={() => handleAddProgress(goal.id)}
                          disabled={updating === goal.id || !addAmounts[goal.id]}
                          className="px-4 py-2 bg-[#E0F4FE] hover:bg-[#cbeafc] text-[#007AE6] font-bold rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {updating === goal.id ? 'Menyimpan...' : 'Tambah'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
