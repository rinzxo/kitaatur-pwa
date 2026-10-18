'use client'
import toast from 'react-hot-toast'


import { useState, useEffect, useMemo } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { 
  GearSix as Settings, 
  FloppyDisk as Save, 
  CircleNotch as Loader2, 
  Buildings as Building2, 
  Warning as AlertTriangle, 
  User, 
  Shield, 
  CaretRight as ChevronRight, 
  Users, 
  ArrowLeft, 
  SignOut as LogOut, 
  Info, 
  Bell, 
  Plus, 
  Trash as Trash2, 
  Sliders as Settings2, 
  Camera, 
  ImageSquare as ImagePlus, 
  CheckCircle as CheckCircle2, 
  TreeStructure as Network, 
  Copy, 
  Check, 
  ArrowSquareOut as ExternalLink, 
  Link as Link2, 
  LinkBreak as Unlink, 
  ShieldCheck,
  IdentificationCard,
  AddressBook,
  Door,
  Compass,
  QrCode,
  Download,
  ArrowsOut,
  ArrowsIn,
  X
} from '@phosphor-icons/react'
import Link from 'next/link'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { CustomUpload } from '@/components/ui/CustomUpload'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour'
import { QRCodeSVG } from 'qrcode.react'

type ViewType = 'main' | 'profile' | 'security' | 'org_profile' | 'switcher' | 'about' | 'org_custom_fields' | 'member_custom_data' | 'org_family' | 'my_qr'

export default function OrgSettingsPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [activeView, setActiveView] = useState<ViewType>('main')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const settingsTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-settings-profile"]',
      title: 'Profil & Identitas Akun',
      description: 'Lihat dan perbarui informasi akun Anda, termasuk nama tampilan pengguna dan foto profil avatar.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-settings-workspace"]',
      title: 'Beralih Workspace & Organisasi',
      description: 'Pindah ke ruang kerja personal atau beralih antar organisasi sekolah/ekskul yang Anda ikuti dengan mudah.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-settings-members"]',
      title: 'Kelola Anggota & Struktur Organisasi',
      description: 'Akses cepat ke daftar anggota: undang pengurus baru, atur jabatan (Ketua, Sekretaris, Bendahara), dan hak akses.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-settings-family"]',
      title: 'Keluarga & Tautan Cabang',
      description: 'Hubungkan organisasi Anda ke Organisasi Induk atau kelola cabang ekskul dalam naungan yang sama menggunakan kode tautan.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-settings-org-profile"]',
      title: 'Profil & Identitas Organisasi',
      description: 'Atur nama organisasi, logo resmi, dan integrasi publik portal sekolah.',
      position: 'top'
    }
  ]

  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const [orgData, setOrgData] = useState<{ id: string; name: string; logo_url: string | null; slug: string } | null>(null)
  const [myOrgs, setMyOrgs] = useState<any[]>([])

  const [orgName, setOrgName] = useState('')
  const [orgLogo, setOrgLogo] = useState<string | null>(null)
  const [isSchool, setIsSchool] = useState(false)
  const [schoolPin, setSchoolPin] = useState('')
  const [hasSchoolPlan, setHasSchoolPlan] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('Pengguna')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])
  const [myCustomData, setMyCustomData] = useState<any>({})
  const [currentMemberId, setCurrentMemberId] = useState<string>('')
  const [isVerified, setIsVerified] = useState(false)
  
  // State Keluarga Organisasi
  const [familyData, setFamilyData] = useState<{
    is_family: boolean
    role_in_family: 'parent' | 'branch' | 'independent'
    family_code: string | null
    parent: { id: string; name: string; slug: string; logo_url: string | null } | null
    children: Array<{ id: string; name: string; slug: string; logo_url: string | null; created_at: string; members_count: number }>
    covered_by_family: boolean
    has_family_subscription: boolean
  } | null>(null)
  const [familyLoading, setFamilyLoading] = useState(false)
  const [familyCodeInput, setFamilyCodeInput] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [showFullscreenQR, setShowFullscreenQR] = useState(false)
  
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
        try {
          const res = await api.get('/personal/profile')
          setUserName(res.data?.full_name || 'Pengguna')
          setUserAvatar(res.data?.avatar_url || null)
        } catch (e) {
          setUserName('Pengguna')
          setUserAvatar(null)
        }

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
        if (settingsRes.data.is_edu !== undefined) {
          setIsSchool(settingsRes.data.is_edu)
        }
        if (settingsRes.data.edu_pin) {
          setSchoolPin(settingsRes.data.edu_pin)
        }

        // Fetch all user orgs to find this one and its ID
        const switcherOrgsRes = await api.get('/org/me/list')
        setMyOrgs(switcherOrgsRes.data)
        
        try {
          const subRes = await api.get('/subscription/me')
          setIsVerified(subRes.data.some((s: any) => s.status === 'active'))
          setHasSchoolPlan(subRes.data.some((s: any) => s.status === 'active' && (s.plan_type.toLowerCase().includes('school') || s.plan_type.toLowerCase().includes('edu'))))
        } catch (e) {
          console.error('Failed to fetch subs', e)
        }
        
        const currentOrg = switcherOrgsRes.data.find((o: any) => o.slug === orgSlug)

        if (currentOrg) {
          setOrgData(currentOrg)
          setOrgName(currentOrg.name)
          setOrgLogo(currentOrg.logo_url)
        }

        // Fetch family data
        try {
          const famRes = await api.get(`/org/${orgSlug}/family`)
          setFamilyData(famRes.data)
        } catch (e) {
          console.error('Failed to fetch family data', e)
        }
      } catch (err) {
        console.error('Error fetching org data', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orgSlug, router])

  const fetchFamilyData = async () => {
    setFamilyLoading(true)
    try {
      const famRes = await api.get(`/org/${orgSlug}/family`)
      setFamilyData(famRes.data)
    } catch (e) {
      console.error('Failed to fetch family data', e)
    } finally {
      setFamilyLoading(false)
    }
  }

  const handleGenerateFamilyCode = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/org/${orgSlug}/family/generate-code`)
      toast.success(res.data.message || 'Kode keluarga berhasil dibuat!')
      await fetchFamilyData()
    } catch (err: any) {
      if (err.response?.data?.needsUpgrade) {
        toast.error('Memerlukan Paket KitaAtur Family. Silakan tingkatkan paket Anda.')
      } else {
        toast.error(err.response?.data?.error || 'Gagal membuat kode keluarga')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLinkBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyCodeInput.trim()) return toast.error('Masukkan kode tautan keluarga.')
    setSaving(true)
    try {
      const res = await api.post(`/org/${orgSlug}/family/link`, {
        familyCode: familyCodeInput.trim()
      })
      toast.success(res.data.message || 'Berhasil terhubung ke Induk!')
      setFamilyCodeInput('')
      await fetchFamilyData()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menautkan ke Induk')
    } finally {
      setSaving(false)
    }
  }

  const handleUnlinkBranch = async (branchId?: string) => {
    const confirmMsg = branchId 
      ? 'Apakah Anda yakin ingin melepas cabang ini dari keluarga organisasi?'
      : 'Apakah Anda yakin ingin memutuskan hubungan dari Organisasi Induk? Organisasi Anda akan kembali mandiri.'
    const ok = await confirm({
      title: 'Putuskan Hubungan Organisasi',
      message: confirmMsg,
      confirmText: 'Ya, Putuskan Hubungan',
      variant: 'danger'
    })
    if (!ok) return

    setSaving(true)
    try {
      const res = await api.post(`/org/${orgSlug}/family/unlink`, {
        branchOrgId: branchId || undefined
      })
      toast.success(res.data.message || 'Tautan berhasil diputuskan')
      await fetchFamilyData()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memutuskan tautan')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyCode = () => {
    if (!familyData?.family_code) return
    navigator.clipboard.writeText(familyData.family_code)
    setCopiedCode(true)
    toast.success('Kode tautan disalin ke clipboard')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgData) return

    setSaving(true)
    try {
      await api.put(`/org/${orgSlug}`, { 
        name: orgName, 
        logo_url: orgLogo,
        is_edu: isSchool,
        edu_pin: schoolPin 
      })
      toast.success('Profil organisasi berhasil disimpan.')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan profil organisasi')
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveWorkspace = async () => {
    const ok = await confirm({
      title: 'Keluar dari Workspace',
      message: `Apakah Anda yakin ingin keluar dari workspace ${orgData?.name}? Anda akan kehilangan akses ke workspace ini.`,
      confirmText: 'Ya, Keluar',
      variant: 'danger'
    })
    if (!ok) return

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await api.patch('/personal/profile', {
            full_name: userName,
            avatar_url: userAvatar
          });
        } catch (dbError) {
          console.error('Gagal update profiles:', dbError);
        }
      }

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

  const myQrPayload = useMemo(() => {
    return JSON.stringify({
      type: 'kitaatur_member',
      orgId: orgData?.id,
      orgSlug: orgSlug,
      profileId: currentMemberId,
      name: userName,
      email: userEmail
    })
  }, [orgData?.id, orgSlug, currentMemberId, userName, userEmail])

  const handleDownloadMyQR = () => {
    const svgEl = document.getElementById('my-member-qr-code') as SVGSVGElement | null
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = 600
      canvas.height = 700
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 600, 700)

        // Draw Org Title Banner
        ctx.fillStyle = '#0087FF'
        ctx.fillRect(0, 0, 600, 80)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(orgData?.name || 'KitaAtur', 300, 50)

        // Draw QR
        ctx.drawImage(img, 100, 110, 400, 400)

        // Draw Member Name & Role
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 26px sans-serif'
        ctx.textAlign = 'center'
        const memberName = userName || 'Anggota'
        ctx.fillText(memberName, 300, 560)

        ctx.fillStyle = '#64748b'
        ctx.font = '18px sans-serif'
        const roleLabel = currentUserRole ? currentUserRole.toUpperCase() : 'ANGGOTA'
        ctx.fillText(`${roleLabel} • ID: ${currentMemberId ? currentMemberId.slice(0, 8).toUpperCase() : '...' }`, 300, 600)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '14px sans-serif'
        ctx.fillText('Kartu Presensi Resmi KitaAtur', 300, 650)

        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `QR_Presensi_${memberName.replace(/\s+/g, '_')}_${orgSlug}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        toast.success('QR Code berhasil diunduh!')
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
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
  const isLeader = currentUserRole === 'head' || currentUserRole === 'vice_head'
  const isManagement = ['head', 'vice_head', 'bendahara', 'sekretaris'].includes(currentUserRole)

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
            {activeView === 'org_family' && 'Keluarga & Tautan Cabang'}
            {activeView === 'my_qr' && 'Kartu Presensi Digital'}
          </h1>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
          {activeView === 'my_qr' && (
            <div className="space-y-6 flex flex-col items-center">
              {/* Digital Pass Card */}
              <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all relative">
                {/* Card Top Brand Header */}
                <div className="bg-gradient-to-r from-[#0087FF] via-[#0099FF] to-[#01C4FB] p-6 text-white text-center relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Org Identity */}
                  <div className="flex items-center justify-between mb-4 text-xs font-semibold text-white/90">
                    <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                      {orgData?.logo_url ? (
                        <img src={orgData.logo_url} alt="Logo" className="w-5 h-5 rounded-md object-cover bg-white shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-white text-[#0087FF] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(orgData?.name || 'K').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{orgData?.name || 'KitaAtur'}</span>
                    </div>
                    <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20 shrink-0">
                      Kartu Presensi
                    </span>
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm p-1 border-2 border-white/50 mb-3 shadow-inner">
                      {userAvatar ? (
                        <img src={userAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white text-[#0087FF] flex items-center justify-center font-black text-2xl">
                          {(userName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white mb-0.5">
                      {userName}
                    </h3>
                    <p className="text-xs text-white/80 font-medium mb-2 truncate max-w-[260px]">
                      {userEmail}
                    </p>
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white text-[#007AE6] shadow-2xs">
                      {currentUserRole === 'head' ? 'Ketua' : currentUserRole === 'vice_head' ? 'Wakil Ketua' : currentUserRole === 'sekretaris' ? 'Sekretaris' : currentUserRole === 'bendahara' ? 'Bendahara' : currentUserRole === 'auditor' ? 'Auditor' : 'Anggota'}
                    </span>
                  </div>
                </div>

                {/* Card Center: QR Code Display */}
                <div className="p-6 bg-white flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md mb-4 flex items-center justify-center">
                    <QRCodeSVG 
                      id="my-member-qr-code"
                      value={myQrPayload}
                      size={210}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
                    ID: {currentMemberId ? currentMemberId.slice(0, 8).toUpperCase() : '--------'}
                  </span>
                  <p className="text-xs text-slate-500 font-medium text-center">
                    Arahkan QR ke scanner panitia saat presensi
                  </p>
                </div>

                {/* Card Action Bar */}
                <div className="px-6 pb-6 pt-2 bg-white flex items-center gap-2 border-t border-slate-100">
                  <button
                    onClick={handleDownloadMyQR}
                    className="flex-1 py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold text-xs rounded-xl shadow-md shadow-[#0087FF]/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Download size={16} weight="bold" />
                    <span>Unduh PNG</span>
                  </button>
                  <button
                    onClick={() => setShowFullscreenQR(true)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    title="Tampilkan Layar Penuh"
                  >
                    <ArrowsOut size={16} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Fullscreen Modal */}
              {showFullscreenQR && (
                <div 
                  className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200"
                  onClick={() => setShowFullscreenQR(false)}
                >
                  <button 
                    onClick={() => setShowFullscreenQR(false)}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <X size={24} weight="bold" />
                  </button>

                  <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
                    <span className="text-xs font-bold text-[#0087FF] uppercase tracking-wider mb-2">
                      {orgData?.name} • Kartu Presensi
                    </span>
                    <div className="p-3 bg-white rounded-2xl mb-4">
                      <QRCodeSVG 
                        value={myQrPayload}
                        size={260}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <h4 className="font-black text-slate-900 text-lg">{userName}</h4>
                    <p className="text-xs text-slate-400 font-medium text-center mt-1">Tingkatkan kecerahan layar agar scanner cepat membaca</p>
                    <button
                      onClick={() => setShowFullscreenQR(false)}
                      className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              {/* Information Note */}
              <div className="max-w-sm w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <ShieldCheck size={18} weight="duotone" className="text-emerald-600 shrink-0" />
                  <span>QR Code Resmi & Terverifikasi</span>
                </div>
                <p>
                  QR Code ini memuat identitas akun Anda di organisasi {orgData?.name || 'ini'}. Anda dapat mengunduhnya dan menyimpannya di galeri HP agar tetap bisa absen cepat tanpa perlu koneksi internet.
                </p>
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
                    <span className="text-sm font-bold text-[#0087FF] bg-[#E0F4FE] border border-[#0087FF]/20 px-2.5 py-1 rounded-md">1.0.0-beta.2</span>
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
              {!isLeader && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Hanya Ketua dan Wakil Ketua yang dapat mengubah skema data tambahan.</p>
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
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0087FF] outline-none"
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
                  disabled={!isLeader}
                  className="w-full py-3 border-2 border-dashed border-[#0087FF]/30 text-[#0087FF] rounded-xl hover:bg-[#E0F4FE]/30 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Kolom Baru
                </button>

                <button 
                  type="submit" 
                  disabled={!isLeader || saving}
                  className="w-full bg-[#0087FF] text-white font-bold py-4 rounded-xl shadow-sm hover:bg-[#0077E6] transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
                        className="w-full border border-slate-200 rounded-lg p-3 focus:border-[#0087FF] outline-none transition-colors bg-slate-50 focus:bg-white" 
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

          {activeView === 'org_family' && (
            <div className="space-y-6">
              {familyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-[#0087FF] animate-spin" />
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center font-bold">
                        <Network className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-slate-900">Keluarga Organisasi</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            familyData?.role_in_family === 'parent'
                              ? 'bg-[#E0F4FE] text-[#007AE6]'
                              : (familyData?.role_in_family === 'branch' ? 'bg-[#E0F4FE] text-[#007AE6]' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {familyData?.role_in_family === 'parent' ? 'Organisasi Induk' : (familyData?.role_in_family === 'branch' ? 'Organisasi Cabang' : 'Organisasi Mandiri')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {familyData?.role_in_family === 'parent'
                            ? 'Menaungi organisasi cabang di bawah satu koordinasi terpusat.'
                            : (familyData?.role_in_family === 'branch'
                                ? `Terkoneksi sebagai cabang resmi di bawah naungan ${familyData.parent?.name}.`
                                : 'Belum terhubung ke keluarga organisasi manapun.')}
                        </p>
                      </div>
                    </div>

                    {/* Jika Cabang: Tampilkan Card Induk */}
                    {familyData?.role_in_family === 'branch' && familyData.parent && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#0087FF] text-white font-bold flex items-center justify-center overflow-hidden">
                              {familyData.parent.logo_url ? (
                                <img src={familyData.parent.logo_url} alt={familyData.parent.name} className="w-full h-full object-cover" />
                              ) : (
                                familyData.parent.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{familyData.parent.name}</span>
                                <span className="bg-[#E0F4FE] text-[#007AE6] text-[10px] font-bold px-2 py-0.5 rounded">Induk</span>
                              </div>
                              <p className="text-xs text-slate-500">Slug: {familyData.parent.slug}</p>
                            </div>
                          </div>
                          <Link 
                            href={`/org/${familyData.parent.slug}/dashboard`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0087FF] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                          >
                            <span>Kunjungi</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {familyData.covered_by_family && (
                          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Cabang ini mendapatkan hak akses premium yang ditanggung oleh Organisasi Induk.</span>
                          </div>
                        )}

                        {isLeader && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleUnlinkBranch()}
                              disabled={saving}
                              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                              <span>Putuskan Hubungan dari Induk</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Jika Induk: Tampilkan Kode Tautan & List Cabang */}
                  {familyData?.role_in_family === 'parent' && (
                    <div className="space-y-6">
                      {/* Box Kode Tautan */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Kode Tautan Keluarga</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Bagikan kode ini kepada ketua cabang untuk menghubungkan organisasi mereka secara mandiri.</p>
                          </div>
                          {isLeader && (
                            <button
                              onClick={handleGenerateFamilyCode}
                              disabled={saving}
                              className="text-xs font-bold text-[#0087FF] hover:text-[#0077E6] bg-[#E0F4FE] hover:bg-[#E0F4FE]/80 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {saving ? 'Memproses...' : 'Buat Ulang Kode'}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="font-mono text-lg font-black tracking-wider text-slate-900 flex-1 px-2 select-all">
                            {familyData.family_code || 'Belum dibuat'}
                          </span>
                          {familyData.family_code && (
                            <button
                              onClick={handleCopyCode}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0087FF] hover:bg-[#0077E6] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* List Cabang Terhubung */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Daftar Cabang Terhubung</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Total {familyData.children?.length || 0} cabang dalam keluarga ini</p>
                          </div>
                        </div>

                        {familyData.children && familyData.children.length > 0 ? (
                          <div className="space-y-3">
                            {familyData.children.map((branch) => (
                              <div key={branch.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#0087FF] text-white font-bold flex items-center justify-center overflow-hidden">
                                    {branch.logo_url ? (
                                      <img src={branch.logo_url} alt={branch.name} className="w-full h-full object-cover" />
                                    ) : (
                                      branch.name.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{branch.name}</h4>
                                    <p className="text-xs text-slate-500">{branch.members_count} Anggota • /{branch.slug}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/org/${branch.slug}/dashboard`}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    Buka
                                  </Link>
                                  {isLeader && (
                                    <button
                                      onClick={() => handleUnlinkBranch(branch.id)}
                                      disabled={saving}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Lepas Cabang"
                                    >
                                      <Unlink className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Network className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-600">Belum ada cabang yang terhubung</p>
                            <p className="text-xs text-slate-400 mt-1">Bagikan Kode Tautan Keluarga di atas kepada pengurus cabang.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Jika Organisasi Mandiri: Tampilkan 2 Opsi */}
                  {familyData?.role_in_family === 'independent' && (
                    <div className="space-y-6">
                      {/* Opsi 1: Tautkan sebagai cabang ke Induk (KASUS 2) */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center font-bold">
                            <Link2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Gabung Sebagai Cabang ke Induk</h3>
                            <p className="text-xs text-slate-500">Tautkan organisasi ini ke naungan Organisasi Induk.</p>
                          </div>
                        </div>

                        <div className="bg-[#E0F4FE]/60 border border-[#0087FF]/20 p-3.5 rounded-xl text-xs text-[#007AE6] leading-relaxed mb-4">
                          Data anggota, saldo kas, dan riwayat presensi Anda tetap 100% aman dan utuh. Organisasi Anda akan terhubung ke sistem terpadu Induk.
                        </div>

                        {isLeader ? (
                          <form onSubmit={handleLinkBranch} className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Tautan Keluarga</label>
                              <input
                                type="text"
                                placeholder="Contoh: SENI-FAM-8492"
                                value={familyCodeInput}
                                onChange={(e) => setFamilyCodeInput(e.target.value.toUpperCase())}
                                className="w-full p-3 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0087FF] outline-none text-sm tracking-wider uppercase font-bold bg-white"
                                required
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={saving || !familyCodeInput.trim()}
                              className="w-full py-3 bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                              <span>Tautkan ke Induk Sekarang</span>
                            </button>
                          </form>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Hanya Ketua (Head) yang dapat menautkan organisasi ini ke Induk.</p>
                        )}
                      </div>

                      {/* Opsi 2: Jadikan Organisasi Induk */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">Jadikan Organisasi Ini Sebagai Induk</h3>
                            <p className="text-xs text-slate-500">Menaungi berbagai cabang ekskul/organisasi terkait di bawah satu akun.</p>
                          </div>
                        </div>

                        {familyData?.has_family_subscription ? (
                          <div>
                            <p className="text-xs text-slate-600 mb-4">
                              Akun Anda memiliki paket aktif untuk mengelola keluarga organisasi. Klik di bawah untuk mulai menghasilkan kode tautan.
                            </p>
                            {isLeader && (
                              <button
                                onClick={handleGenerateFamilyCode}
                                disabled={saving}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
                                <span>Buat Kode Tautan Keluarga</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Fitur Organisasi Induk memerlukan paket langganan <strong>KitaAtur Family</strong> (1 Induk + Cabang Unlimited, seluruh cabang bebas biaya langganan tambahan).
                            </p>
                            <Link
                              href="/upgrade"
                              className="inline-flex items-center justify-center w-full py-2.5 bg-[#0087FF] hover:bg-[#0077E6] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                            >
                              Tingkatkan ke Paket KitaAtur Family
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeView === 'org_profile' && (
            <div className="space-y-8">
              {!isLeader && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Hanya Ketua dan Wakil Ketua yang dapat mengubah profil dasar organisasi.</p>
                </div>
              )}

              <form onSubmit={handleSaveOrg} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-[#E0F4FE] flex items-center justify-center text-[#0087FF] overflow-hidden shadow-sm">
                      {orgLogo ? (
                        <img src={orgLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8" />
                      )}
                    </div>
                    {isLeader && (
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
                      disabled={!isLeader}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0087FF] outline-none font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tautan Unik (Slug)</label>
                    <input
                      type="text"
                      value={orgData?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/org/${orgData.slug}` : ''}
                      disabled
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none font-medium bg-slate-50 text-slate-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">Slug tidak dapat diubah setelah organisasi dibuat.</p>
                  </div>
                </div>

                {/* Portal School Settings Section */}
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">School</h3>
                  <p className="text-sm text-slate-500 mb-4">Aktifkan portal publik agar wali murid dapat mengecek kehadiran siswa secara mandiri.</p>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">Aktifkan Portal School</h4>
                      <p className="text-xs text-slate-500">
                        Organisasi Anda akan muncul di halaman publik {' '}
                        <a href={`${typeof window !== 'undefined' ? window.location.origin : ''}/school`} target="_blank" rel="noreferrer" className="text-[#0087FF] hover:underline">
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/school`}
                        </a>
                      </p>
                      {(!hasSchoolPlan && userEmail !== 'generalrino@gmail.com') && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                          Hanya untuk pelanggan Paket School 
                          <Link href="/personal/settings/subscription" className="underline ml-1">Upgrade</Link>
                        </div>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        disabled={!isLeader || (!hasSchoolPlan && userEmail !== 'generalrino@gmail.com')}
                        checked={isSchool} 
                        onChange={(e) => setIsSchool(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0087FF] peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  {isSchool && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">PIN Akses Wali Murid</label>
                        <input
                          type="text"
                          value={schoolPin}
                          onChange={(e) => setSchoolPin(e.target.value)}
                          disabled={!isLeader}
                          placeholder="Contoh: 123456"
                          maxLength={10}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0087FF] outline-none font-medium bg-white disabled:bg-slate-50 disabled:text-slate-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Berikan PIN ini kepada wali murid agar mereka bisa mengakses data siswa.</p>
                      </div>
                    </div>
                  )}
                </div>

                {isLeader && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving || !orgName.trim()}
                      className="bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
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
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Profil & Pengaturan</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTour(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Panduan Fitur</span>
            </button>
            <Link href="/notifications" className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={24} weight="duotone" className="text-slate-700" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </Link>
          </div>
        </header>

        {/* User Card */}
        <button 
          data-tour="tour-settings-profile"
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{userName}</h2>
                {isVerified && (
                  <CheckCircle2 size={20} weight="fill" className="text-[#0087FF]" />
                )}
              </div>
              <p className="text-slate-500">Tampilkan profil</p>
            </div>
          </div>
          <ChevronRight size={22} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
        </button>

        {/* Organization Card (Current Org) */}
        {orgData && (
          <div className="block bg-[#E0F4FE]/40 border border-[#0087FF]/20 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
              {orgData.logo_url && (
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm overflow-hidden flex-shrink-0">
                  <img src={orgData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{orgData.name}</h3>
                <p className="text-sm text-slate-600 font-medium">Anda terdaftar sebagai: <span className="uppercase font-bold text-[#007AE6]">{currentUserRole}</span></p>
              </div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full flex items-center justify-end pr-4 opacity-15 pointer-events-none">
               <Building2 size={80} weight="duotone" className="text-[#0087FF]" />
            </div>
          </div>
        )}

        {/* KARTU QR PRESENSI ANGGOTA */}
        <div className="mb-10">
          <button
            type="button"
            onClick={() => navigateToView('my_qr')}
            className="w-full text-left bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
                  <QrCode size={32} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
                      Kartu Digital Anggota
                    </span>
                    <span className="text-xs font-semibold text-white/80">Aktif</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight">QR Code Presensi Saya</h2>
                  <p className="text-xs text-white/80 font-medium">Buka dan tunjukkan ke panitia untuk scan presensi cepat</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-white text-blue-600 font-bold px-3.5 py-2 rounded-xl text-xs shadow-md">
                <span>Buka QR</span>
                <ChevronRight size={14} weight="bold" />
              </div>
            </div>
          </button>
        </div>

        {/* Settings List */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-4">Pengaturan</h2>
          <div className="flex flex-col">
            
            <button data-tour="tour-settings-workspace" onClick={() => navigateToView('switcher')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Building2 size={24} weight="duotone" className="text-slate-700" />
                <span className="text-lg text-slate-700">Workspace & Organisasi</span>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('profile')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <User size={24} weight="duotone" className="text-slate-700" />
                <span className="text-lg text-slate-700">Informasi personal</span>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('security')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Shield size={24} weight="duotone" className="text-slate-700" />
                <span className="text-lg text-slate-700">Login & keamanan</span>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            {/* ORG MANAGEMENT SECTION */}
            <h2 className="text-xl font-bold mt-10 mb-2 text-slate-900">Pengelolaan Organisasi</h2>
            <p className="text-sm text-slate-500 mb-4">Pengaturan khusus untuk workspace {orgData?.name || 'ini'}.</p>

            {isManagement && (
              <Link data-tour="tour-settings-members" href={`/org/${orgSlug}/members`} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <Users size={24} weight="duotone" className="text-[#0087FF]" />
                  <span className="text-lg text-slate-700 font-medium">Kelola Anggota</span>
                </div>
                <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-[#0087FF] transition-colors" />
              </Link>
            )}

            {['head', 'vice_head', 'sekretaris'].includes(currentUserRole) && (
              <Link href={`/org/${orgSlug}/members/qr`} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <IdentificationCard size={24} weight="duotone" className="text-[#0087FF]" />
                  <div className="text-left">
                    <span className="text-lg text-slate-700 font-medium block">QR Code Semua Anggota (Cetak & Unduh)</span>
                    <span className="text-xs text-slate-400">Akses ID Card & cetak lembar QR presensi seluruh anggota</span>
                  </div>
                </div>
                <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-[#0087FF] transition-colors" />
              </Link>
            )}

            {/* KELUARGA & TAUTAN CABANG */}
            <button data-tour="tour-settings-family" onClick={() => navigateToView('org_family')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Network size={24} weight="duotone" className="text-[#0087FF]" />
                <div className="text-left">
                  <span className="text-lg text-slate-700 font-medium block">Keluarga & Tautan Cabang</span>
                  <span className="text-xs text-slate-400">
                    {familyData?.role_in_family === 'branch'
                      ? `Cabang dari ${familyData.parent?.name}`
                      : (familyData?.role_in_family === 'parent'
                          ? `Organisasi Induk (${familyData.children?.length || 0} Cabang)`
                          : 'Hubungkan dengan organisasi lain')}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-[#0087FF] transition-colors" />
            </button>

            {isLeader && (
              <button onClick={() => navigateToView('org_custom_fields')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <IdentificationCard size={24} weight="duotone" className="text-[#0087FF]" />
                  <span className="text-lg text-slate-700 font-medium">Data Tambahan Anggota</span>
                </div>
                <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-[#0087FF] transition-colors" />
              </button>
            )}

            {customFieldsSchema.length > 0 && (
              <button onClick={() => navigateToView('member_custom_data')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
                <div className="flex items-center gap-4">
                  <AddressBook size={24} weight="duotone" className="text-slate-700" />
                  <span className="text-lg text-slate-700">Data Profil Organisasi Anda</span>
                </div>
                <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              </button>
            )}

            <button data-tour="tour-settings-org-profile" onClick={() => navigateToView('org_profile')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Settings size={24} weight="duotone" className="text-slate-700" />
                <span className="text-lg text-slate-700 font-medium">Profil Organisasi</span>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={() => navigateToView('about')} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Info size={24} weight="duotone" className="text-slate-700" />
                <span className="text-lg text-slate-700">Tentang Aplikasi</span>
              </div>
              <ChevronRight size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>

            <button onClick={handleLeaveWorkspace} className="flex items-center justify-between py-5 border-b border-slate-100 group">
              <div className="flex items-center gap-4">
                <Door size={24} weight="duotone" className="text-rose-500" />
                <span className="text-lg text-rose-500 font-medium">Keluar Workspace</span>
              </div>
            </button>

            <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/login' }} className="flex items-center justify-between py-5 group mt-8">
              <div className="flex items-center gap-4">
                <LogOut size={24} weight="duotone" className="text-slate-400" />
                <span className="text-lg text-slate-500 font-medium">Keluar Akun</span>
              </div>
            </button>

          </div>
        </div>
      </div>

      <SpotlightTour
        tourKey="org_settings"
        steps={settingsTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  )
}
