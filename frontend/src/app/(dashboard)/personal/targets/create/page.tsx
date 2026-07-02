'use client'
import toast from 'react-hot-toast'


import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'

export default function CreatePersonalTargetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    target_amount: '',
    description: '',
    deadline: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.post('/personal/goals', {
        title: formData.title,
        target_amount: parseFloat(formData.target_amount),
        description: formData.description,
        deadline: formData.deadline || null
      })
      toast.success('Target finansial berhasil dibuat!')
      router.push('/personal/targets')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-100 rounded-full blur-[120px] pointer-events-none opacity-60" />

      <div className="w-full max-w-lg bg-white border border-slate-200 shadow-xl rounded-3xl p-8 relative z-10">
        <Link href="/personal/targets" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft className="h-3 w-3" />
          Batal & Kembali
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
          <Target className="h-6 w-6 text-purple-600" />
          Buat Target Finansial
        </h1>
        <p className="text-slate-500 text-sm mb-8">Apa yang ingin Anda capai di masa depan? Tetapkan targetnya sekarang.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nama Target</label>
            <input
              type="text"
              required
              placeholder="Contoh: Beli Laptop Baru, Liburan..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nominal Target (Rp)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="Contoh: 15000000"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tenggat Waktu / Deadline (Opsional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Catatan Tambahan (Opsional)</label>
            <textarea
              placeholder="Deskripsi lebih detail terkait target ini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 font-medium px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Membuat Target...' : 'Mulai Menabung!'}
          </button>
        </form>
      </div>
    </div>
  )
}
