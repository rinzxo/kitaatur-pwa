'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react'

export default function CreateOrganizationPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    // Auto-generate slug
    setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/org/create', { name, slug })
      router.push(`/org/${res.data.organization.slug}/dashboard`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuat organisasi')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-10">
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto w-full mb-8 pt-4">
        <Link href="/personal/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Batal & Kembali
        </Link>
      </div>

      <div className="max-w-xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500">
        
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/20 mb-8">
          <Building2 className="w-10 h-10 stroke-[2.5px]" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Buat Organisasi</h1>
        <p className="text-slate-500 text-base mb-10">Pusat kontrol untuk mengelola kas, tagihan, dan presensi anggota komunitas Anda.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Nama Organisasi
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Contoh: Himpunan Mahasiswa"
                value={name}
                onChange={handleNameChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                URL Organisasi (Otomatis)
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-2xl text-slate-500 font-medium text-sm">
                  kitaatur.com/org/
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-r-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-500 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <ul className="space-y-3 py-4">
              {['Penyimpanan data terenkripsi', 'Sistem absensi QR siap pakai', 'Laporan keuangan transparan'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={loading || !name || !slug}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? 'Menyiapkan...' : 'Buat Organisasi Sekarang'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
