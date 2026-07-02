'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, QrCode, CheckCircle, FileText, History, BarChart2 } from 'lucide-react'

export default function AttendanceDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [loading, setLoading] = useState(true)

  const initRoleAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
        

      } else {
        router.push('/personal/dashboard')
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses ke organisasi ini.')
        router.push('/personal/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initRoleAndData()
  }, [orgSlug, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  const isEditor = currentUserRole === 'head' || currentUserRole === 'sekretaris'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 pb-28 md:pb-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/dashboard`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard Utama
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Modul Absensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Kelola dan pantau kehadiran serta notulensi.</p>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* SEKRETARIS PRIORITY ACTION */}
        {currentUserRole === 'sekretaris' && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 rounded-3xl p-6 text-center text-white flex flex-col h-full">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tugas Utama: Sesi Absensi</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed flex-grow">
              Anda bertanggung jawab membuat, memantau, dan menutup jadwal absensi anggota.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/sessions`}
              className="block w-full py-3.5 bg-white text-blue-600 font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.98] hover:bg-slate-50 mt-auto"
            >
              Buka Manajemen Sesi
            </Link>
          </div>
        )}

        {/* Check In Action (For Everyone) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-center flex flex-col h-full">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Check-in Kehadiran</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
            Catat kehadiran (Datang/Pulang) menggunakan PIN.
          </p>
          <Link 
            href={`/org/${orgSlug}/attendance/scan`}
            className="block w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] mt-auto"
          >
            Mulai Absen (Scan PIN)
          </Link>
        </div>

        {/* History Action (For Everyone) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-center flex flex-col h-full">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Riwayat Absensi</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
            Lihat rekam jejak kehadiran dan laporan absensi.
          </p>
          <Link 
            href={`/org/${orgSlug}/attendance/history`}
            className="block w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-all active:scale-[0.98] mt-auto"
          >
            Lihat Riwayat
          </Link>
        </div>

        {/* Notulensi Action (Pisah) */}
        {isEditor && (
          <>
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-center flex flex-col h-full">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
                <BarChart2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analisis Kehadiran</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
                Evaluasi performa absensi dan kedisiplinan anggota.
              </p>
              <Link 
                href={`/org/${orgSlug}/attendance/analysis`}
                className="block w-full py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-all active:scale-[0.98] mt-auto"
              >
                Lihat Analisis
              </Link>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-center flex flex-col h-full">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Notulensi Rapat (AI)</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
                Buat dan pantau laporan hasil rapat dengan asisten AI.
              </p>
              <div className="flex gap-2 mt-auto">
                <Link 
                  href={`/org/${orgSlug}/attendance/meeting`}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] text-sm"
                >
                  Buat
                </Link>
                <Link 
                  href={`/org/${orgSlug}/attendance/meeting/history`}
                  className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all active:scale-[0.98] text-sm"
                >
                  Riwayat
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Fallback for Head if they want to manage sessions but aren't sekretaris */}
        {currentUserRole === 'head' && (
           <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-center flex flex-col h-full">
            <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shrink-0">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hak Akses Ketua</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
              Pantau dan kendalikan sesi absensi organisasi.
            </p>
            <Link 
              href={`/org/${orgSlug}/attendance/sessions`}
              className="block w-full py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] mt-auto"
            >
              Manajemen Sesi
            </Link>
          </div>
        )}

      </main>

      
    </div>
  )
}
