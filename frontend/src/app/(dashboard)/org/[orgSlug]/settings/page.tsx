'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Save, Loader2, Building2, AlertTriangle, User, Shield, ChevronRight, Users, ArrowLeft, LogOut, Info, Bell, Plus, Trash2, Settings2, Camera, ImagePlus } from 'lucide-react'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { CustomUpload } from '@/components/ui/CustomUpload'

type ViewType = 'main' | 'profile' | 'security' | 'org_profile' | 'switcher' | 'about' | 'org_custom_fields' | 'member_custom_data'

export default function OrgSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [activeView, setActiveView] = useState<ViewType>('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [orgData, setOrgData] = useState<{ id: string; name: string; logo_url: string | null; slug: string } | null>(null)
  const [myOrgs, setMyOrgs] = useState<any[]>([])

  const [orgName, setOrgName] = useState('')
  const [orgLogo, setOrgLogo] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Pengguna')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])
  const [myCustomData, setMyCustomData] = useState<any>({})
  const [currentMemberId, setCurrentMemberId] = useState<string>('')
  const [isVerified, setIsVerified] = useState(false)
  
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
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        setUserEmail(user.email || '')
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna')
        setUserAvatar(user.user_metadata?.avatar_url || null)

        // Fetch user role in this org
        const membersRes = await api.get(`/org/${orgSlug}/members`)
        const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
          setCurrentMemberId(currentMember.profile_id)
          setMyCustomData(currentMember.custom_data || {})
        } else {
          router.push('/personal/dashboard')
          return
        }

        // Fetch org settings
        const settingsRes = await api.get(`/org/${orgSlug}/settings`)
        if (settingsRes.data.custom_fields_schema) {
          setCustomFieldsSchema(settingsRes.data.custom_fields_schema)
        }

        // Fetch all user orgs to find this one and its ID
        const switcherOrgsRes = await api.get('/org/me/list')
        setMyOrgs(switcherOrgsRes.data)
        
        try {
          const subRes = await api.get('/subscription/me')
          setIsVerified(subRes.data.some((s: any) => s.status === 'active'))
        } catch (e) {
          console.error('Failed to fetch subs', e)
        }
        
        const currentOrg = switcherOrgsRes.data.find((o: any) => o.slug === orgSlug)

        if (currentOrg) {
          setOrgData(currentOrg)
          setOrgName(currentOrg.name)
          setOrgLogo(currentOrg.logo_url)
        }
      } catch (err) {
        console.error('Error fetching org data', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orgSlug, router])

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgData) return

    setSaving(true)
    try {
      await api.put(`/org/${orgSlug}`, { name: orgName, logo_url: orgLogo })
      toast.success('Profil organisasi berhasil disimpan.')
      window.location.reload()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan profil organisasi')
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveWorkspace = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin keluar dari workspace ${orgData?.name}? Anda akan kehilangan akses ke workspace ini.`)) {
      return
    }

    try {
      await api.delete(`/org/${orgSlug}/leave`)
      toast.success('Berhasil keluar dari workspace')
      router.push('/personal/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal keluar dari workspace')
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
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomSchema = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/org/${orgSlug}/custom-fields`, { custom_fields_schema: customFieldsSchema })
      toast.success('Skema data tambahan berhasil disimpan.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan skema.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveMyCustomData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/org/${orgSlug}/members/${currentMemberId}/custom-data`, { custom_data: myCustomData })
      toast.success('Data tambahan berhasil disimpan.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data tambahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    const newId = `field_${Date.now()}`
    setCustomFieldsSchema([...customFieldsSchema, { id: newId, label: '', type: 'text', required: false }])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-2xl mx-auto space-y-8 pt-12">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="h-[300px] bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  const isHead = currentUserRole === 'head'
  const isManagement = ['head', 'bendahara', 'sekretaris'].includes(currentUserRole)

  // --- SUB-VIEWS ---

  if (activeView !== 'main') {
    return (
      <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in slide-in-from-right-8 duration-300">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigateToView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
            <ArrowLeft className="w-6 h-6 text-slate-900" />
          </button>
          <h1 className="text-xl font-bold">
            {activeView === 'profile' && 'Informasi Pribadi'}
            {activeView === 'security' && 'Keamanan & Login'}
            {activeView === 'org_profile' && 'Profil Organisasi'}
            {activeView === 'switcher' && 'Workspace'}
            {activeView === 'about' && 'Tentang Aplikasi'}
            {activeView === 'org_custom_fields' && 'Data Tambahan Organisasi'}
            {activeView === 'member_custom_data' && 'Data Anda (Organisasi)'}
          </h1>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
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

                {myOrgs.length > 0 && (
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
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">1.0.0-beta.2</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Build Number</span>
                    <span className="text-sm font-mono font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md">20260717.dev</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <span className="text-sm font-semibold text-slate-500">Lingkungan</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase tracking-wider">Production (Beta)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500">Lisensi Pengguna</span>
                    <span className="text-sm font-bold text-slate-700">Organisasi Terdaftar</span>
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

          {activeView === 'org_custom_fields' && (
            <div className="space-y-8">
              {!isHead && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Hanya pemilik organisasi (Ketua) yang dapat mengubah skema data tambahan.</p>
                </div>
              )}
              <form onSubmit={handleSaveCustomSchema} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Skema Data Tambahan</h2>
                  <p className="text-sm text-slate-500">Tentukan kolom apa saja yang perlu diisi anggota saat bergabung. (misal: Kelas, Fakultas, dll)</p>
                </div>

                {customFieldsSchema.map((field, idx) => (
                  <div key={field.id} className="flex flex-col gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50 relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kolom</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const newSchema = [...customFieldsSchema]
                            newSchema[idx].label = e.target.value
                            setCustomFieldsSchema(newSchema)
                          }}
                          placeholder="Contoh: Kelas"
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipe</label>
                        <CustomSelect
                          value={field.type}
                          onChange={(val) => {
                            const newSchema = [...customFieldsSchema]
                            newSchema[idx].type = val
                            setCustomFieldsSchema(newSchema)
                          }}
                          options={[{ label: 'Teks Pendek', value: 'text' }]}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={field.required}
                          onChange={(e) => {
                            const newSchema = [...customFieldsSchema]
                            newSchema[idx].required = e.target.checked
                            setCustomFieldsSchema(newSchema)
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700">Wajib Diisi</span>
                      </label>
                      
                      <button 
                        type="button" 
                        onClick={() => setCustomFieldsSchema(customFieldsSchema.filter(f => f.id !== field.id))}
                        className="text-rose-500 text-sm font-medium hover:text-rose-700"
                      >
                        Hapus Kolom
                      </button>
                    </div>
                  </div>
                ))}

                <button 
                  type="button" 
                  onClick={handleAddField}
                  disabled={!isHead}
                  className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Kolom Baru
                </button>

                <button 
                  type="submit" 
                  disabled={!isHead || saving}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Skema'}
                </button>
              </form>
            </div>
          )}

          {activeView === 'member_custom_data' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveMyCustomData} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Data Profil Organisasi Anda</h2>
                  <p className="text-sm text-slate-500">Isi data tambahan yang diminta oleh {orgData?.name || 'organisasi ini'}.</p>
                </div>
                
                <div className="space-y-4">
                  {customFieldsSchema.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input 
                        type={field.type === 'text' ? 'text' : 'text'}
                        value={myCustomData[field.id] || ''} 
                        onChange={e => setMyCustomData({ ...myCustomData, [field.id]: e.target.value })} 
                        required={field.required}
                        className="w-full border border-slate-200 rounded-lg p-3 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white" 
                      />
                    </div>
                  ))}
                </div>
                
                <button type="submit" disabled={saving} className="mt-8 w-full flex justify-center items-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data Anda'}
                </button>
              </form>
            </div>
          )}

          {activeView === 'org_profile' && (
            <div className="space-y-8">
              {!isHead && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Hanya pemilik organisasi (Ketua) yang dapat mengubah profil dasar organisasi.</p>
                </div>
              )}

              <form onSubmit={handleSaveOrg} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden shadow-sm">
                      {orgLogo ? (
                        <img src={orgLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8" />
                      )}
                    </div>
                    {isHead && (
                      <CustomUpload 
                        isCircular
                        onUpload={(url) => setOrgLogo(url)}
                      />
                    )}
                  </div>
                  <div className="ml-2">
                    <h2 className="text-xl font-bold text-slate-900">Profil Dasar</h2>
                    <p className="text-sm text-slate-500">Ubah identitas organisasi.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nama Organisasi</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={!isHead}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tautan Unik (Slug)</label>
                    <input
                      type="text"
                      value={orgData?.slug || ''}
                      disabled
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-medium bg-slate-50 text-slate-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">Slug tidak dapat diubah setelah organisasi dibuat.</p>
                  </div>
                </div>

                {isHead && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving || !orgName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Simpan Perubahan
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- MAIN VIEW ---

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
          onClick={() => navigateToView('profile')}
          className="w-full flex items-center justify-between py-2 mb-8 group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-slate-500">{(userName || '?').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{userName}</h2>
              <p className="text-slate-500">Tampilkan profil</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
        </button>

        {/* Organization Card (Current Org) */}
        {orgData && (
          <div className="block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-10 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
              {orgData.logo_url && (
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm overflow-hidden flex-shrink-0">
                  <img src={orgData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">{orgData.name}</h3>
                <p className="text-sm text-blue-700 font-medium">Anda terdaftar sebagai: <span className="uppercase">{currentUserRole}</span></p>
              </div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full flex items-center justify-end pr-4 opacity-40 pointer-events-none">
               <Building2 className="w-20 h-20 text-blue-600" />
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-4">Pengaturan</h2>
          <div className="flex flex-col">
            
            <button onClick={() => navigateToView('switcher')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Building2 className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Workspace & Organisasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('profile')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Informasi personal</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('security')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Shield className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Login & keamanan</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            {/* ORG MANAGEMENT SECTION */}
            <h2 className="text-xl font-bold mt-10 mb-2 text-slate-900">Pengelolaan Organisasi</h2>
            <p className="text-sm text-slate-500 mb-4">Pengaturan khusus untuk workspace {orgData?.name || 'ini'}.</p>

            {isManagement && (
              <Link href={`/org/${orgSlug}/members`} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-lg text-slate-700 font-medium">Kelola Anggota</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </Link>
            )}

            {isHead && (
              <button onClick={() => navigateToView('org_custom_fields')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-form-input text-blue-600 w-6 h-6"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M12 10.5h5"/><path d="M12 14v-3.5"/><path d="M7 10.5h.01"/><path d="M7 14h.01"/></svg>
                  <span className="text-lg text-slate-700 font-medium">Data Tambahan Anggota</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            )}

            {customFieldsSchema.length > 0 && (
              <button onClick={() => navigateToView('member_custom_data')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-contact text-slate-700 w-6 h-6"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg>
                  <span className="text-lg text-slate-700">Data Profil Organisasi Anda</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </button>
            )}

            <button onClick={() => navigateToView('org_profile')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Settings className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700 font-medium">Profil Organisasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('about')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Info className="w-6 h-6 text-slate-700" />
                <span className="text-lg text-slate-700">Tentang Aplikasi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={handleLeaveWorkspace} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-door-open w-6 h-6 text-rose-500"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>
                <span className="text-lg text-rose-500 font-medium">Keluar Workspace</span>
              </div>
            </button>

            <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login' }} className="flex items-center justify-between py-5 group mt-8">
              <div className="flex items-center gap-4">
                <LogOut className="w-6 h-6 text-slate-400" />
                <span className="text-lg text-slate-500 font-medium">Keluar Akun</span>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
