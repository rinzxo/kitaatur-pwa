'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface GuestStat {
  id: string
  name: string
  identifier: string
  stats: {
    tepat: number
    terlambat: number
    alpha: number
    percentage: number
  }
}

export default function GuestAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    overall: any,
    dailyTrend: any[],
    guestList: GuestStat[]
  } | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/guests/analytics`)
      setData(res.data)
    } catch (err) {
      toast.error('Gagal memuat analitik tamu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 font-medium">Memuat Statistik...</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 pt-6 pb-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <Link 
            href={`/org/${orgSlug}/attendance/guests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Data Tamu
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Statistik Kehadiran Tamu
          </h1>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi kehadiran tamu dari seluruh sesi absensi otomatis.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Tamu</p>
              <p className="text-2xl font-black text-slate-900">{data.overall.totalGuests}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase">Total Tepat</p>
              <p className="text-2xl font-black text-emerald-900">{data.overall.tepat}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase">Total Terlambat</p>
              <p className="text-2xl font-black text-amber-900">{data.overall.terlambat}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-rose-600 font-bold uppercase">Total Alpha</p>
              <p className="text-2xl font-black text-rose-900">{data.overall.alpha}</p>
            </div>
          </div>
        </div>

        {/* Individual Guest Stats Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Rekapitulasi Kehadiran Individu</h3>
            <p className="text-sm text-slate-500">Menampilkan jumlah kehadiran setiap tamu di seluruh sesi (Total {data.overall.totalSessions} Sesi Berjalan).</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="p-4 font-bold">Nama Tamu</th>
                  <th className="p-4 font-bold">ID / Identifier</th>
                  <th className="p-4 font-bold text-center text-emerald-600">Hadir Tepat</th>
                  <th className="p-4 font-bold text-center text-amber-600">Hadir Terlambat</th>
                  <th className="p-4 font-bold text-center text-rose-600">Alpha</th>
                  <th className="p-4 font-bold text-center text-blue-600">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.guestList.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{guest.name}</td>
                    <td className="p-4 text-slate-500 font-mono text-sm">{guest.identifier}</td>
                    <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/30">
                      {guest.stats.tepat}
                    </td>
                    <td className="p-4 text-center font-bold text-amber-600 bg-amber-50/30">
                      {guest.stats.terlambat}
                    </td>
                    <td className="p-4 text-center font-bold text-rose-600 bg-rose-50/30">
                      {guest.stats.alpha}
                    </td>
                    <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">
                      {guest.stats.percentage}%
                    </td>
                  </tr>
                ))}
                
                {data.guestList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Belum ada data tamu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
