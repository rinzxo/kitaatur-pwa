'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { 
  GearSix as Settings, 
  User, 
  Shield, 
  Buildings as Building2, 
  Info, 
  CaretRight as ChevronRight, 
  Plus, 
  Bell, 
  ArrowLeft, 
  SignOut as LogOut, 
  CreditCard, 
  Camera, 
  CircleNotch as Loader2, 
  FloppyDisk as Save, 
  CheckCircle as BadgeCheck,
  QrCode 
} from '@phosphor-icons/react'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { CustomUpload } from '@/components/ui/CustomUpload'
import { useDashboardStore } from '@/lib/dashboard-store'

type ViewType = 'main' | 'profile' | 'security' | 'switcher' | 'about' | 'org_management'

export default function SettingsPage() {
  const router = useRouter()
  const store = useDashboardStore()
  const [activeView, setActiveView] = useState<ViewType>('main')
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Pengguna')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const navigateToView = (view: ViewType) => {
    if (view !== 'main') {
      window.history.pushState({ subView: view }, '', '')
      setActiveView(view)
    } else {
      if (activeView !== 'main') {
        window.history.back()
      }
    }
  }

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.subView) {
        setActiveView(e.state.subView)
      } else {
        setActiveView('main')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    fetchUser()
    fetchMyOrgs()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Coba fetch dari profiles via API
        let profile = null;
        try {
          const res = await api.get('/personal/profile');
          profile = res.data;
        } catch (e) {
          console.error('API profile fetch error:', e);
        }
        
        setUserEmail(user.email || '')
        setUserName(profile?.full_name || 'Pengguna')
        setUserAvatar(profile?.avatar_url || null)

        try {
          const res = await api.get('/subscription/me')
          const hasActiveSub = res.data.some((s: any) => s.status === 'active')
          setIsVerified(hasActiveSub)
        } catch (e) {
          console.error('Failed to fetch subs for verification', e)
        }
      }
    } catch (e) {
      console.error('Failed to fetch user', e)
    }
  }

  const fetchMyOrgs = async () => {
    setIsLoadingOrgs(true)
    try {
      const response = await api.get('/org/me/list')
      setMyOrgs(response.data)
    } catch (error) {
      console.error('Failed to fetch organizations', error)
    } finally {
      setIsLoadingOrgs(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Simpan ke tabel profiles via API
        try {
          await api.patch('/personal/profile', {
            full_name: userName,
            avatar_url: userAvatar
          });
        } catch (dbError) {
          console.error('Gagal update profiles:', dbError);
        }
      }

      // Update auth meta
      const { error } = await supabase.auth.updateUser({
        data: { full_name: userName, avatar_url: userAvatar }
      })
      if (error) throw error
      toast.success('Profil berhasil diperbarui.')
    } catch (err: any) {
      console.error('Update error:', err)
      toast.error('Gagal memperbarui profil.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      window.location.href = '/login'
    }
  }

  // --- SUB-VIEWS ---

  if (activeView !== 'main') {
    return (
      <div className="min-h-screen bg-slate-50/30 text-slate-900 pb-36 sm:pb-28 animate-in slide-in-from-right-8 duration-300">
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3">
          <button onClick={() => navigateToView('main')} className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors -ml-1 text-slate-700" aria-label="Kembali">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {activeView === 'profile' && 'Informasi Pribadi'}
            {activeView === 'switcher' && 'Workspace'}
            {activeView === 'security' && 'Keamanan & Login'}
            {activeView === 'about' && 'Tentang Aplikasi'}
            {activeView === 'org_management' && 'Kelola Organisasi'}
          </h1>
        </header>

        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          {activeView === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 font-bold text-3xl">{(userName || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <CustomUpload 
                    isCircular
                    onUpload={(url) => setUserAvatar(url)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full border-b-2 border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" disabled value={userEmail} className="w-full border-b-2 border-slate-100 py-2 text-slate-500 bg-transparent cursor-not-allowed" />
                </div>
                <button type="submit" disabled={saving} className="mt-8 w-full flex justify-center items-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          )}

          {activeView === 'security' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password Baru</label>
                  <input type="password" placeholder="••••••••" className="w-full border-b-2 border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Konfirmasi Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border-b-2 border-slate-200 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent" />
                </div>
                <button className="mt-8 w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors">
                  Perbarui Password
                </button>
              </div>
            </div>
          )}

          {activeView === 'switcher' && (
            <div className="space-y-4">
              {isVerified ? (
                <Link href="/org/create" className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-colors mb-6">
                  <Plus className="w-5 h-5" />
                  Buat Organisasi Baru
                </Link>
              ) : (
                <div className="mb-6 bg-[#E0F4FE]/70 border border-[#b9e5fa] p-4 rounded-xl flex flex-col items-center text-center">
                  <p className="text-sm text-slate-800 font-medium mb-3">Upgrade ke Premium untuk mulai membuat Organisasi dan mengundang tim Anda.</p>
                  <Link href="/upgrade" className="bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold px-6 py-2.5 rounded-full shadow-sm text-sm transition-all">
                    Upgrade Sekarang
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                <Link href="/personal/dashboard" className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Personal Space</h3>
                      <p className="text-sm text-slate-500">Ruang kerja pribadi</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600" />
                </Link>

                {isLoadingOrgs ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200" />
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-slate-200 rounded-md" />
                            <div className="h-3 w-20 bg-slate-100 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myOrgs.length > 0 ? (
                  myOrgs.map((org: any) => {
                    const isSchool = Boolean(org.is_edu || ((org._count?.school_links_as_school || 0) > 0))
                    return (
                      <Link key={org.id} href={isSchool ? `/org/${org.slug}/executive` : `/org/${org.slug}/dashboard`} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900">{org.name}</h3>
                              {isSchool && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                                  SEKOLAH
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                                {org.role}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{isSchool ? 'Dasbor Eksekutif & Ekskul' : 'Organisasi'}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                      </Link>
                    )
                  })
                ) : null}
              </div>
            </div>
          )}

          {activeView === 'org_management' && (
            <div className="space-y-4">
              <p className="text-slate-500 mb-6">Pilih organisasi untuk mengelola anggota dan pengaturan.</p>
              <div className="space-y-3">
                {isLoadingOrgs ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200" />
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-slate-200 rounded-md" />
                            <div className="h-3 w-20 bg-slate-100 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : myOrgs.length > 0 ? (
                  myOrgs.map((org: any) => (
                    <div key={org.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="w-12 h-12 rounded-full bg-[#E0F4FE] flex items-center justify-center text-[#007AE6] font-bold text-xl">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{org.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                              {org.role}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">Kelola operasional & tim</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/org/${org.slug}/members`} className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                          Anggota
                        </Link>
                        <Link href={`/org/${org.slug}/settings`} className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                          Pengaturan
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500">Anda belum tergabung di organisasi manapun.</div>
                )}
              </div>
            </div>
          )}

          {activeView === 'about' && (
            <div className="py-2">
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-slate-200/50 mx-auto mb-4 flex items-center justify-center p-3 border border-slate-100">
                  <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-[24px] font-black text-slate-900 mb-1 tracking-tight">KitaAtur</h2>
                <p className="text-sm text-slate-500 font-medium mb-8 px-4">Sistem Manajemen Kehadiran & Keuangan Modern untuk Segala Organisasi.</p>
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 text-left space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Versi Aplikasi</span>
                    <span className="text-sm font-bold text-[#0087FF] bg-[#E0F4FE] border border-[#0087FF]/20 px-2.5 py-1 rounded-md">{store.appInfo.version}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Build Number</span>
                    <span className="text-sm font-mono font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md">{store.appInfo.buildNumber}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Lingkungan</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-wider">{store.appInfo.environment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500">Lisensi Pengguna</span>
                    <span className="text-sm font-bold text-slate-700">{store.appInfo.license || 'Personal (Personal Space)'}</span>
                  </div>
                </div>
                
                <div className="text-[13px] font-medium text-slate-400 flex flex-col items-center">
                  <p className="mb-2">Dikembangkan secara eksklusif oleh</p>
                  <img src="/icons/RINZ%20GROUP.png" alt="Rinz Group Inovasi" className="h-8 object-contain my-1 opacity-90 hover:opacity-100 transition-opacity" />
                  <p className="mt-3">Copyright © 2026. Hak Cipta Dilindungi.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-900 pb-36 sm:pb-28 animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        
        {/* Header */}
        <header className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Profil & Pengaturan
          </h1>
          <Link 
            href="/notifications" 
            className="relative p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            aria-label="Notifikasi"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </Link>
        </header>

        {/* User Card */}
        <button 
          onClick={() => navigateToView('profile')}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 mb-4 sm:mb-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all group text-left active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shrink-0">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-slate-500">{(userName || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{userName}</h2>
                {isVerified && (
                  <BadgeCheck size={18} weight="fill" className="text-[#0087FF] shrink-0" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Tampilkan profil & info akun</p>
            </div>
          </div>
          <ChevronRight size={18} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
        </button>

        {/* Promo Banner Card */}
        <Link 
          href="/org/create"
          className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-md shadow-emerald-600/15 hover:shadow-emerald-600/25 active:scale-[0.99] transition-all relative overflow-hidden group"
        >
          <div className="relative z-10 w-3/4">
            <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-full border border-white/25 mb-1.5">
              Organisasi Baru
            </span>
            <h3 className="text-base sm:text-lg font-bold mb-1 leading-snug">Bangun organisasi Anda</h3>
            <p className="text-xs text-white/90 leading-relaxed">
              Kelola presensi otomatis, anggota, dan keuangan bersama tim.
            </p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full flex items-center justify-end pr-4 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
             <Building2 size={70} weight="duotone" className="text-white" />
          </div>
        </Link>

        {/* Grouped Settings Cards */}
        <div className="space-y-5 sm:space-y-6">
          
          {/* 1. AKUN & WORKSPACE */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Akun & Workspace
            </h2>
            <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
              
              <button 
                onClick={() => navigateToView('switcher')} 
                className="w-full flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0087FF] transition-colors shrink-0">
                    <Building2 size={18} weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block truncate">Workspace & Organisasi</span>
                    <span className="text-[11px] text-slate-400 block truncate">Ganti ruang kerja atau buat baru</span>
                  </div>
                </div>
                <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              <Link 
                href="/personal/settings/subscription" 
                className="flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0087FF] transition-colors shrink-0">
                    <CreditCard size={18} weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block truncate">Langganan & Tagihan</span>
                    <span className="text-[11px] text-slate-400 block truncate">Paket aktif & riwayat invoice</span>
                  </div>
                </div>
                <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>

              {myOrgs.length > 0 && (
                <button 
                  onClick={() => navigateToView('org_management')} 
                  className="w-full flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0087FF] shrink-0">
                      <Settings size={18} weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm sm:text-base font-semibold text-slate-800 block truncate">Kelola Organisasi</span>
                      <span className="text-[11px] text-slate-400 block truncate">Kelola {myOrgs.length} organisasi terdaftar</span>
                    </div>
                  </div>
                  <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              )}

              {myOrgs.length > 0 && (
                <Link 
                  href={`/org/${myOrgs[0].slug}/settings`} 
                  className="flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0087FF] shrink-0">
                      <QrCode size={18} weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm sm:text-base font-semibold text-slate-800 block truncate">Kartu QR Presensi Digital</span>
                      <span className="text-[11px] text-slate-400 block truncate">Tampilkan ID di {myOrgs[0].name}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              )}

              <button 
                onClick={() => navigateToView('profile')} 
                className="w-full flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0087FF] transition-colors shrink-0">
                    <User size={18} weight="duotone" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Informasi personal</span>
                </div>
                <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              <button 
                onClick={() => navigateToView('security')} 
                className="w-full flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0087FF] transition-colors shrink-0">
                    <Shield size={18} weight="duotone" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">Login & keamanan</span>
                </div>
                <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

            </div>
          </div>

          {/* 2. SISTEM */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Sistem
            </h2>
            <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
              
              <button 
                onClick={() => navigateToView('about')} 
                className="w-full flex items-center justify-between px-4 py-3.5 sm:py-4 hover:bg-slate-50/80 active:bg-slate-100 transition-colors group text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0087FF] transition-colors shrink-0">
                    <Info size={18} weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-semibold text-slate-800 block truncate">Tentang Aplikasi</span>
                    <span className="text-[11px] text-slate-400 block truncate">Versi {store.appInfo.version} • Build {store.appInfo.buildNumber}</span>
                  </div>
                </div>
                <ChevronRight size={16} weight="bold" className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

            </div>
          </div>

          {/* 3. KELUAR */}
          <div className="pt-2">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-rose-50/70 border border-slate-200/90 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-sm font-bold transition-all shadow-2xs active:scale-[0.99]"
            >
              <LogOut size={18} weight="bold" />
              <span>Keluar Akun</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
