'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Users, Building2, Package, ArrowRight, ShieldAlert, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ totalUsers: 0, totalOrgs: 0, activeSubs: 0, totalIncome: 0 })
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [updatingVersion, setUpdatingVersion] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/stats')
      setStats(res.data)

      const setRes = await api.get('/admin/settings')
      const maintSet = setRes.data.find((s: any) => s.key === 'maintenance_mode')
      if (maintSet) {
        setMaintenance(typeof maintSet.value === 'string' ? JSON.parse(maintSet.value) : maintSet.value)
      }
      const versionSet = setRes.data.find((s: any) => s.key === 'app_version')
      if (versionSet) {
        setAppVersion(typeof versionSet.value === 'string' ? versionSet.value.replace(/"/g, '') : versionSet.value)
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/personal/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMaintenance = async () => {
    setUpdating(true)
    try {
      await api.put('/admin/settings/maintenance_mode', {
        value: !maintenance,
        description: 'Sistem sedang dalam perbaikan rutin.'
      })
      setMaintenance(!maintenance)
    } catch (err) {
      alert('Gagal mengubah mode maintenance')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateVersion = async () => {
    if (!appVersion.trim()) return
    setUpdatingVersion(true)
    try {
      await api.put('/admin/settings/app_version', {
        value: appVersion,
        description: 'Versi aplikasi saat ini.'
      })
      alert('Versi aplikasi berhasil diupdate')
    } catch (err) {
      alert('Gagal mengubah versi aplikasi')
    } finally {
      setUpdatingVersion(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat data dewa...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Zap className="text-amber-500 fill-amber-500" />
        God Mode Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-slate-800">{stats.totalUsers}</span>
          <span className="text-sm font-semibold text-slate-500">Total Pengguna</span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-slate-800">{stats.totalOrgs}</span>
          <span className="text-sm font-semibold text-slate-500">Total Organisasi</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black text-slate-800">{stats.activeSubs}</span>
          <span className="text-sm font-semibold text-slate-500">Langganan Aktif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Manajemen Organisasi</h2>
          <p className="text-sm text-slate-500 mb-6">Kelola seluruh organisasi, masuk sebagai admin (Impersonate), atau berikan paket langganan secara manual.</p>
          <Link href="/admin/organizations" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
            <span className="font-bold">Lihat Semua Organisasi</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Pusat Pengumuman</h2>
          <p className="text-sm text-slate-500 mb-6">Kirim broadcast atau pesan peringatan yang akan muncul di layar semua pengguna.</p>
          <Link href="/admin/announcements" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
            <span className="font-bold">Kelola Broadcast</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="mt-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Mode Pemeliharaan (Maintenance)
          </h2>
          <p className="text-sm text-rose-600 mt-1 max-w-xl">Jika diaktifkan, semua pengguna akan diarahkan ke halaman pemeliharaan dan API akan menolak semua permintaan (Kecuali Anda).</p>
        </div>
        <button 
          onClick={toggleMaintenance}
          disabled={updating}
          className={`px-6 py-3 rounded-xl font-bold text-white whitespace-nowrap transition-colors ${maintenance ? 'bg-slate-800 hover:bg-slate-900' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50`}
        >
          {maintenance ? 'Matikan Maintenance' : 'Aktifkan Maintenance'}
        </button>
      </div>

      <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Versi Aplikasi
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">Ubah versi aplikasi yang ditampilkan kepada pengguna.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={appVersion}
            onChange={(e) => setAppVersion(e.target.value)}
            placeholder="Misal: 1.0.5"
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none w-full md:w-48"
          />
          <button 
            onClick={handleUpdateVersion}
            disabled={updatingVersion || !appVersion.trim()}
            className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {updatingVersion ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

    </div>
  )
}
