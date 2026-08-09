'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { GraduationCap, Building2, Search, ArrowRight } from 'lucide-react'

export default function EduLandingPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const res = await api.get('/edu/schools')
      setSchools(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-600">
            <img src="/icons/KitaEdu.png" alt="KitaAtur School Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-2xl font-black tracking-tight">KitaAtur <span className="text-slate-900">School</span></h1>
          </div>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900">
            Beranda Utama
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Portal Transparansi Kehadiran Siswa</h2>
          <p className="text-lg text-slate-500">Pilih sekolah Anda di bawah ini dan masukkan PIN serta ID Pelajar untuk mengecek kehadiran secara mandiri.</p>
        </div>

        <div className="relative mb-8 max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-medium"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-500 font-medium">Memuat daftar sekolah...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSchools.map((school) => (
              <Link 
                key={school.id} 
                href={`/edu/${school.id}`} 
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                    {school.logo_url ? (
                      <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {school.name}
                    </h3>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 ml-4">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>
            ))}

            {filteredSchools.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-20 bg-white border border-slate-200 rounded-3xl border-dashed">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sekolah tidak ditemukan</h3>
                <p className="text-slate-500">Mungkin sekolah Anda belum terdaftar di KitaAtur School.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
