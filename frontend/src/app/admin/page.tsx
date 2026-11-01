'use client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { api, clearApiCache } from '@/lib/api'
import Link from 'next/link'
import { 
  Users, 
  Building2, 
  Package, 
  ArrowRight, 
  ShieldAlert, 
  LayoutDashboard, 
  Tag, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  Award,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAdminRoute } from './useAdminRoute'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { orgsHref, announcementsHref, mainAppUrl } = useAdminRoute()
  const [stats, setStats] = useState({ totalUsers: 0, totalOrgs: 0, activeSubs: 0, totalIncome: 0 })
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [updating, setUpdating] = useState(false)
  
  // App System Settings
  const [appVersion, setAppVersion] = useState('3.0.1')
  const [appBuildNumber, setAppBuildNumber] = useState('')
  const [appEnvironment, setAppEnvironment] = useState('Production (Beta)')
  const [appLicense, setAppLicense] = useState('Organisasi Terdaftar')
  const [updatingAppInfo, setUpdatingAppInfo] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, setRes, infoRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { totalUsers: 0, totalOrgs: 0, activeSubs: 0, totalIncome: 0 } })),
        api.get('/admin/settings').catch(() => ({ data: [] })),
        api.get('/admin/app-info').catch(() => ({ data: null }))
      ])

      setStats(statsRes.data)

      const maintSet = (setRes.data || []).find((s: any) => s.key === 'maintenance_mode')
      if (maintSet) {
        setMaintenance(typeof maintSet.value === 'string' ? JSON.parse(maintSet.value) : maintSet.value)
      }

      if (infoRes?.data) {
        setAppVersion(infoRes.data.version || '3.0.1')
        setAppBuildNumber(infoRes.data.buildNumber || '')
        setAppEnvironment(infoRes.data.environment || 'Production (Beta)')
        setAppLicense(infoRes.data.license || 'Organisasi Terdaftar')
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        window.location.href = mainAppUrl
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
      toast.error('Gagal mengubah mode maintenance')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveAppInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!appVersion.trim()) {
      toast.error('Versi aplikasi wajib diisi')
      return
    }

    setUpdatingAppInfo(true)
    try {
      const res = await api.put('/admin/system-app-info', {
        version: appVersion.trim(),
        environment: appEnvironment.trim(),
        license: appLicense.trim()
      })
      clearApiCache()
      if (res.data?.appInfo) {
        setAppBuildNumber(res.data.appInfo.buildNumber)
        setAppVersion(res.data.appInfo.version)
        setAppEnvironment(res.data.appInfo.environment)
        setAppLicense(res.data.appInfo.license)
      }
      toast.success('Pembaruan sistem berhasil disimpan! Nomor build otomatis diperbarui.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui pengaturan sistem aplikasi')
    } finally {
      setUpdatingAppInfo(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-pulse space-y-6">
        <div className="h-8 w-60 bg-slate-200 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="h-8 w-16 bg-slate-200 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-48" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2.5 text-slate-900">
        <LayoutDashboard className="w-6 h-6 text-[#0087FF]" />
        Dasbor Admin
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
          <Link href={orgsHref} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
            <span className="font-bold">Lihat Semua Organisasi</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Pusat Pengumuman</h2>
          <p className="text-sm text-slate-500 mb-6">Kirim broadcast atau pesan peringatan yang akan muncul di layar semua pengguna.</p>
          <Link href={announcementsHref} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
            <span className="font-bold">Kelola Broadcast</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Mode Maintenance */}
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

      {/* Konfigurasi Versi, Build, Lingkungan & Lisensi */}
      <div className="mt-6 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0087FF]" />
              Pengaturan Sistem & Informasi Aplikasi
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola versi aplikasi, status lingkungan rilis, nomor build otomatis, dan jenis lisensi sistem.
            </p>
          </div>

          {appBuildNumber && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Build Aktif: <strong>{appBuildNumber}</strong></span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveAppInfo} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Versi Aplikasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#0087FF]" />
                Versi Aplikasi (SemVer)
              </label>
              <input 
                type="text" 
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                placeholder="Misal: 3.0.1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#0087FF] outline-none text-sm font-semibold transition-all"
              />
              <p className="text-[11px] text-slate-400">Ditampilkan pada badge Versi di menu Tentang Aplikasi.</p>
            </div>

            {/* 2. Lingkungan Rilis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                Lingkungan Sistem (Environment)
              </label>
              <div className="relative">
                <select
                  value={['Production (Beta)', 'Production (Stable)', 'Staging', 'Development'].includes(appEnvironment) ? appEnvironment : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setAppEnvironment(e.target.value)
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#0087FF] outline-none text-sm font-semibold transition-all appearance-none cursor-pointer"
                >
                  <option value="Production (Beta)">Production (Beta)</option>
                  <option value="Production (Stable)">Production (Stable)</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                  <option value="__custom__">Kustom Lainnya...</option>
                </select>
              </div>
              {!['Production (Beta)', 'Production (Stable)', 'Staging', 'Development'].includes(appEnvironment) && (
                <input
                  type="text"
                  value={appEnvironment}
                  onChange={(e) => setAppEnvironment(e.target.value)}
                  placeholder="Ketik status lingkungan custom..."
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                />
              )}
              <p className="text-[11px] text-slate-400">Status rilis (Production, Beta, dsb.) di pengaturan pengguna.</p>
            </div>

            {/* 3. Lisensi Pengguna */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Lisensi Pengguna (License Tier)
              </label>
              <div className="relative">
                <select
                  value={['Organisasi Terdaftar', 'Institusi Sekolah & Ekskul', 'Lisensi Resmi Rinz Group Inovasi', 'Enterprise Tier'].includes(appLicense) ? appLicense : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      setAppLicense(e.target.value)
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#0087FF] outline-none text-sm font-semibold transition-all appearance-none cursor-pointer"
                >
                  <option value="Organisasi Terdaftar">Organisasi Terdaftar</option>
                  <option value="Institusi Sekolah & Ekskul">Institusi Sekolah & Ekskul</option>
                  <option value="Lisensi Resmi Rinz Group Inovasi">Lisensi Resmi Rinz Group Inovasi</option>
                  <option value="Enterprise Tier">Enterprise Tier</option>
                  <option value="__custom__">Kustom Lainnya...</option>
                </select>
              </div>
              {!['Organisasi Terdaftar', 'Institusi Sekolah & Ekskul', 'Lisensi Resmi Rinz Group Inovasi', 'Enterprise Tier'].includes(appLicense) && (
                <input
                  type="text"
                  value={appLicense}
                  onChange={(e) => setAppLicense(e.target.value)}
                  placeholder="Ketik teks lisensi custom..."
                  className="w-full mt-2 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                />
              )}
              <p className="text-[11px] text-slate-400">Keterangan lisensi legalitas yang tampil di Tentang Aplikasi.</p>
            </div>

            {/* 4. Nomor Build Otomatis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Otomatisasi Nomor Build
              </label>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-blue-900 truncate">Auto-Regenerate Build Active</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Nomor build baru otomatis dihitung saat Anda klik Simpan.
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0087FF] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Format stempel waktu build: <code className="font-mono">YYYYMMDD.HHmm</code></p>
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="submit"
              disabled={updatingAppInfo || !appVersion.trim()}
              className="px-6 py-3 rounded-xl font-bold text-white bg-[#0087FF] hover:bg-[#0077E6] active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-500/20"
            >
              {updatingAppInfo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menerapkan Pembaruan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Terapkan Pembaruan Sistem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
