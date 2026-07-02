'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { Settings, User, Shield, Building2, Info, ChevronRight, Plus, Bell, ArrowLeft, LogOut, CreditCard, Camera, Loader2, Save, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { CustomUpload } from '@/components/ui/CustomUpload'

type ViewType = 'main' | 'profile' | 'security' | 'switcher' | 'about' | 'org_management'

export default function SettingsPage() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<ViewType>('main')
  const [myOrgs, setMyOrgs] = useState<any[]>([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Pengguna')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchMyOrgs()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || '')
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna')
      setUserAvatar(user.user_metadata?.avatar_url || null)

      try {
        const res = await api.get('/subscription/me')
        const hasActiveSub = res.data.some((s: any) => s.status === 'active')
        setIsVerified(hasActiveSub)
      } catch (e) {
        console.error('Failed to fetch subs for verification', e)
      }
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
      <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in slide-in-from-right-8 duration-300">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
          <button onClick={() => setActiveView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-900" />
          </button>
          <h1 className="text-xl font-bold">
            {activeView === 'profile' && 'Informasi Pribadi'}
            {activeView === 'switcher' && 'Workspace'}
            {activeView === 'security' && 'Keamanan & Login'}
            {activeView === 'about' && 'Tentang Aplikasi'}
            {activeView === 'org_management' && 'Kelola Organisasi'}
          </h1>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
          {activeView === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 font-bold text-3xl">{userName.charAt(0).toUpperCase()}</span>
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
                <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center text-center">
                  <p className="text-sm text-blue-800 font-medium mb-3">Upgrade ke Premium untuk mulai membuat Organisasi dan mengundang tim Anda.</p>
                  <Link href="/upgrade" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full shadow-md text-sm transition-all">
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
                  <div className="text-center py-6 text-sm text-slate-400 animate-pulse font-medium">Memuat organisasi...</div>
                ) : myOrgs.length > 0 ? (
                  myOrgs.map((org: any) => (
                    <Link key={org.id} href={`/org/${org.slug}/dashboard`} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{org.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                              {org.role}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">Organisasi</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                    </Link>
                  ))
                ) : null}
              </div>
            </div>
          )}

          {activeView === 'org_management' && (
            <div className="space-y-4">
              <p className="text-slate-500 mb-6">Pilih organisasi untuk mengelola anggota dan pengaturan.</p>
              <div className="space-y-3">
                {isLoadingOrgs ? (
                  <div className="text-center py-6 text-sm text-slate-400 animate-pulse font-medium">Memuat organisasi...</div>
                ) : myOrgs.length > 0 ? (
                  myOrgs.map((org: any) => (
                    <div key={org.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
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
                <h2 className="text-[22px] font-normal text-indigo-500 mb-6 tracking-wide">KitaAtur</h2>
                
                <div className="space-y-1 text-[15px] text-slate-900 font-bold mb-4">
                  <p>Version : 1.0.0-beta</p>
                  <p>Build : 1.0.0.20260625 (general)</p>
                  <p>Release Branch : main</p>
                </div>
                
                <div className="text-[14px] text-slate-500">
                  <p>KitaAtur Corporation</p>
                  <p>Copyright © 2026</p>
                </div>
              </div>

              <div className="flex flex-col mt-4">
                <Link href="/privacy" className="w-full flex items-center justify-between py-4 group">
                  <span className="text-[16px] text-slate-800">Privacy and Cookies</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </Link>
                <Link href="/terms" className="w-full flex items-center justify-between py-4 group">
                  <span className="text-[16px] text-slate-800">Terms of Use</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </Link>
                <Link href="/community" className="w-full flex items-center justify-between py-4 group">
                  <span className="text-[16px] text-slate-800">Community Standards</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </Link>
                <Link href="/third-party" className="w-full flex items-center justify-between py-4 group">
                  <span className="text-[16px] text-slate-800">Third Party Notices</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto px-6 pt-12">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Profil</h1>
          <Link href="/notifications" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="w-6 h-6 text-slate-700" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </Link>
        </header>

        {/* User Card */}
        <button 
          onClick={() => setActiveView('profile')}
          className="w-full flex items-center justify-between py-2 mb-8 group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-slate-500">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{userName}</h2>
                {isVerified && (
                  <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />
                )}
              </div>
              <p className="text-slate-500">Tampilkan profil</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
        </button>

        {/* Promo Banner Card */}
        <Link 
          href="/org/create"
          className="block bg-white border border-slate-200 rounded-2xl p-6 mb-10 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow relative overflow-hidden group"
        >
          <div className="relative z-10 w-2/3">
            <h3 className="text-lg font-semibold mb-2">Bangun organisasi Anda</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sangat mudah mengelola absensi dan keuangan bersama tim.
            </p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full flex items-center justify-end pr-4 opacity-80 group-hover:opacity-100 transition-opacity">
             <Building2 className="w-20 h-20 text-emerald-500/20" />
          </div>
        </Link>

        {/* Settings List */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-4">Pengaturan</h2>
          <div className="flex flex-col">
            
            <button onClick={() => setActiveView('switcher')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Building2 className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Workspace & Organisasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <Link href="/personal/settings/subscription" className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <CreditCard className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Langganan & Tagihan</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </Link>

            {myOrgs.length > 0 && (
              <button onClick={() => setActiveView('org_management')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <Settings className="w-6 h-6 text-slate-700" />
                  <span className="text-lg text-slate-700">Kelola Organisasi</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </button>
            )}

            <button onClick={() => setActiveView('profile')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Informasi personal</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => setActiveView('security')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Login & keamanan</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => setActiveView('about')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Info className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Tentang Aplikasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={handleLogout} className="flex items-center justify-between py-5 group mt-4">
              <div className="flex items-center gap-4">
                <LogOut className="w-6 h-6 text-rose-500" />
                <span className="text-lg text-rose-500 font-medium">Keluar</span>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
