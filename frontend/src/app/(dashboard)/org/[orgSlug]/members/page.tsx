'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  Shield, 
  UserMinus, 
  ArrowsClockwise as RefreshCw, 
  ArrowsCounterClockwise as RotateCcw,
  Link as LinkIcon, 
  Copy, 
  X, 
  MagnifyingGlass as Search,
  Compass,
  QrCode
} from '@phosphor-icons/react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface Member {
  id: string
  organization_id: string
  profile_id: string
  role: 'head' | 'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'
  joined_at: string
  custom_data: any
  profile: Profile
}

export default function OrganizationMembersPage() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<'head' | 'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'>('member')

  // Spotlight Walkthrough Tour
  const [showTour, setShowTour] = useState(false)
  const membersTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-invite-btn"]',
      title: 'Undang Anggota & Siswa',
      description: 'Dapatkan tautan dan kode undangan organisasi untuk dibagikan langsung ke grup WhatsApp kelas atau ekstrakurikuler.'
    },
    {
      target: '[data-tour="tour-members-table"]',
      title: 'Daftar Pengurus & Anggota',
      description: 'Pantau seluruh anggota yang telah terdaftar lengkap dengan peran jabatan, email, dan tanggal bergabung.'
    },
    {
      target: '[data-tour="tour-role-change"]',
      title: 'Ubah Peran & Hak Akses',
      description: 'Ketua organisasi dapat mengatur wewenang anggota menjadi Wakil Ketua, Sekretaris, Bendahara, atau delegasi presensi.'
    }
  ]
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])

  // Form State
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'>('member')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Invite Link State
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  const isHead = currentUserRole === 'head'
  const isViceHead = currentUserRole === 'vice_head'
  const isLeader = isHead || isViceHead
  const canInvite = isLeader || currentUserRole === 'sekretaris'

  const canEditMemberRole = (member: Member) => {
    if (member.profile_id === currentUserId) return false
    if (member.role === 'head') return false
    if (isHead) return true
    if (isViceHead && member.role !== 'vice_head') return true
    return false
  }

  const canKickMember = (member: Member) => {
    if (member.profile_id === currentUserId) return false
    if (member.role === 'head') return false
    if (isHead) return true
    if (isViceHead && member.role !== 'vice_head') return true
    return false
  }

  const getRoleOptions = () => {
    if (isHead) {
      return [
        { label: 'Anggota (Member)', value: 'member' },
        { label: 'Wakil Ketua', value: 'vice_head' },
        { label: 'Bendahara', value: 'bendahara' },
        { label: 'Sekretaris', value: 'sekretaris' },
        { label: 'Auditor', value: 'auditor' },
        { label: 'Ketua (Transfer Kepemilikan)', value: 'head' }
      ]
    }
    return [
      { label: 'Anggota (Member)', value: 'member' },
      { label: 'Bendahara', value: 'bendahara' },
      { label: 'Sekretaris', value: 'sekretaris' },
      { label: 'Auditor', value: 'auditor' }
    ]
  }

  const fetchMembers = async (overrideUserId?: string) => {
    try {
      const res = await api.get(`/org/${orgSlug}/members`)
      setMembers(res.data)
      
      // Deteksi role user aktif
      const userIdToUse = overrideUserId || currentUserId
      const activeUser = res.data.find((m: Member) => m.profile_id === userIdToUse)
      if (activeUser) {
        setCurrentUserRole(activeUser.role)
      }
    } catch (err) {
      console.error('Error fetching organization members:', err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      } else {
        router.push('/login')
        return
      }

      await fetchMembers(user.id)
      
      try {
        const settingsRes = await api.get(`/org/${orgSlug}/settings`)
        if (settingsRes.data.custom_fields_schema) {
          setCustomFieldsSchema(settingsRes.data.custom_fields_schema)
        }
      } catch (err) {
        console.error('Failed to load custom fields schema')
      }
      
      setLoading(false)
    }

    init()
  }, [orgSlug, router])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMembers()
    setRefreshing(false)
  }

  const handleRoleChange = async (memberProfileId: string, role: string) => {
    if (role === 'head') {
      if (!await confirm('Konfirmasi', 'Peringatan: Tindakan ini akan MENTRANSFER KEPEMILIKAN organisasi kepada anggota ini. Anda akan diturunkan menjadi anggota biasa dan kehilangan akses pengelolaan penuh. Lanjutkan?')) {
        // Jika batal, refresh data agar select dropdown kembali ke nilai aslinya
        await fetchMembers()
        return
      }
    }

    try {
      await api.patch(`/org/${orgSlug}/members/${memberProfileId}`, { role })
      toast.success('Role berhasil diperbarui!')
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui role anggota')
    }
  }

  const handleKickMember = async (memberProfileId: string, memberName: string) => {
    if (!await confirm('Konfirmasi', `Apakah Anda yakin ingin mengeluarkan ${memberName} dari organisasi?`)) return
    
    try {
      await api.delete(`/org/${orgSlug}/members/${memberProfileId}`)
      toast.success('Anggota berhasil dikeluarkan')
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengeluarkan anggota')
    }
  }

  const handleToggleDelegation = async (member: Member) => {
    const currentData = member.custom_data || {}
    const newDelegationStatus = !currentData.can_take_attendance
    
    try {
      await api.put(`/org/${orgSlug}/members/${member.profile_id}/custom-data`, {
        custom_data: {
          ...currentData,
          can_take_attendance: newDelegationStatus
        }
      })
      toast.success(newDelegationStatus ? 'Hak delegasi absen diberikan' : 'Hak delegasi absen dicabut')
      await fetchMembers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengubah hak delegasi')
    }
  }

  const openInviteModal = async () => {
    setInviteModalOpen(true)
    if (!inviteCode) {
      setInviteLoading(true)
      try {
        const res = await api.get(`/org/${orgSlug}/invite-code`)
        setInviteCode(res.data.invite_code)
      } catch (err) {
        console.error('Error fetching invite code:', err)
      } finally {
        setInviteLoading(false)
      }
    }
  }

  const resetInviteCode = async () => {
    const ok = await confirm({
      title: 'Reset Kode Undangan',
      message: 'Link invite lama akan hangus dan tidak bisa digunakan lagi. Lanjutkan?',
      confirmText: 'Ya, Buat Kode Baru',
      variant: 'warning'
    })
    if (!ok) return
    setInviteLoading(true)
    try {
      const res = await api.post(`/org/${orgSlug}/invite-code/reset`)
      setInviteCode(res.data.invite_code)
      toast.success(res.data.message)
    } catch (err) {
      console.error('Error resetting invite code:', err)
      toast.error('Gagal mereset link invite')
    } finally {
      setInviteLoading(false)
    }
  }

  const copyToClipboard = () => {
    const link = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded"></div>
            <div className="h-8 w-64 bg-slate-200 rounded"></div>
            <div className="h-4 w-48 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 mb-6">
            <div className="h-12 w-full md:w-1/3 bg-slate-200 rounded-xl"></div>
            <div className="h-12 w-32 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-10 pb-28 md:pb-10 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/dashboard`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Dashboard Organisasi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Users className="h-8 w-8 text-blue-600" />
            Manajemen Anggota
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-0.5">Kelola struktur kepengurusan dan anggota organisasi Anda.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Panduan Interaktif Fitur"
          >
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Panduan Fitur</span>
          </button>
          {['head', 'vice_head', 'sekretaris'].includes(currentUserRole) && (
            <Link
              href={`/org/${orgSlug}/members/qr`}
              className="px-3.5 py-2 bg-[#0087FF] hover:bg-[#0077E6] text-white text-xs font-bold rounded-lg shadow-md shadow-[#0087FF]/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <QrCode size={16} weight="bold" />
              <span>Cetak QR Anggota</span>
            </Link>
          )}
          {canInvite && (
            <button
              data-tour="tour-invite-btn"
              onClick={openInviteModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Link Undangan
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-lg text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Members Table */}
          <div data-tour="tour-members-table" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-slate-900">Pengurus & Anggota</h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
            
            {(() => {
              const filteredMembers = members.filter(member => {
                const name = (member.profile.full_name || '').toLowerCase()
                const email = (member.profile.email || '').toLowerCase()
                const query = searchQuery.toLowerCase()
                return name.includes(query) || email.includes(query)
              })

              if (filteredMembers.length === 0) {
                return (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Tidak ada anggota yang cocok dengan pencarian.</p>
                  </div>
                )
              }

              return (
                <>
                  {/* Mobile View: Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredMembers.map((member, index) => (
                      <div key={member.id} className="relative border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all group bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3 items-center w-full pr-8">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm border border-blue-100 flex-shrink-0 overflow-hidden">
                              {member.profile.avatar_url ? (
                                <img src={member.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                (member.profile.full_name || member.profile.email || 'T').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-2">
                                <span className="truncate">{member.profile.full_name || 'Tanpa Nama'}</span>
                                {member.profile_id === currentUserId && (
                                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                                    Anda
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">{member.profile.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {canKickMember(member) && (
                          <button
                            onClick={() => handleKickMember(member.profile_id, member.profile.full_name || 'Anggota ini')}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            title="Keluarkan Anggota"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                        
                        <div data-tour={index === 0 ? "tour-role-change" : undefined} className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-500">Role:</span>
                          {canEditMemberRole(member) ? (
                            <CustomSelect
                              value={member.role}
                              onChange={(val) => handleRoleChange(member.profile_id, val)}
                              options={getRoleOptions()}
                              className="max-w-[140px]"
                            />
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              member.role === 'head'
                                ? 'bg-[#E0F4FE] text-[#007AE6] border border-[#b9e5fa]'
                                : member.role === 'vice_head'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : member.role === 'bendahara'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : member.role === 'sekretaris'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {(member.role === 'head' || member.role === 'vice_head') && <Shield className="h-3 w-3" />}
                              {member.role === 'vice_head' ? 'Wakil Ketua' : member.role === 'head' ? 'Ketua' : member.role}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-100 text-slate-500">
                          <span className="font-medium text-[11px] uppercase tracking-wider text-slate-400">Bergabung</span>
                          <span>{new Date(member.joined_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        
                        {(isHead || currentUserRole === 'sekretaris') && member.profile_id !== currentUserId && (
                          <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-100 text-slate-500">
                            <span className="font-medium text-[11px] uppercase tracking-wider text-slate-400">Delegasi Absen</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={!!member.custom_data?.can_take_attendance} onChange={() => handleToggleDelegation(member)} />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0087FF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0087FF]"></div>
                            </label>
                          </div>
                        )}
                        
                        {customFieldsSchema.length > 0 && member.custom_data && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                            {customFieldsSchema.map(field => (
                              <div key={field.id} className="bg-slate-50 border border-slate-100 rounded px-2 py-1 flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-bold text-slate-400 uppercase text-[10px]">{field.label}:</span>
                                <span className="text-slate-700 font-medium">{member.custom_data[field.id] || '-'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                    <table className="w-full min-w-[600px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                          <th className="py-3 px-2">Nama</th>
                          <th className="py-3 px-2">Email</th>
                          <th className="py-3 px-2">Role</th>
                          {(isHead || currentUserRole === 'sekretaris') && <th className="py-3 px-2 text-center">Delegasi Absen</th>}
                          {customFieldsSchema.map(field => (
                            <th key={field.id} className="py-3 px-2">{field.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredMembers.map((member) => (
                          <tr 
                            key={member.id} 
                            className="hover:bg-slate-50 transition-colors group cursor-context-menu"
                            onContextMenu={(e) => {
                              if (canKickMember(member)) {
                                e.preventDefault();
                                handleKickMember(member.profile_id, member.profile.full_name || 'Anggota ini');
                              }
                            }}
                            title={canKickMember(member) ? "Klik Kanan untuk Mengeluarkan Anggota" : ""}
                          >
                            <td className="py-3.5 px-2 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm border border-blue-100 flex-shrink-0 overflow-hidden">
                                  {member.profile.avatar_url ? (
                                    <img src={member.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    (member.profile.full_name || member.profile.email || 'T').charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  {member.profile.full_name || 'Tanpa Nama'}
                                  {member.profile_id === currentUserId && (
                                    <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
                                      Anda
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-2 text-slate-500 font-medium whitespace-nowrap">{member.profile.email}</td>
                            <td className="py-3.5 px-2 whitespace-nowrap">
                              {canEditMemberRole(member) ? (
                                <CustomSelect
                                  value={member.role}
                                  onChange={(val) => handleRoleChange(member.profile_id, val)}
                                  options={getRoleOptions()}
                                />
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  member.role === 'head'
                                    ? 'bg-[#E0F4FE] text-[#007AE6] border border-[#b9e5fa]'
                                    : member.role === 'vice_head'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                    : member.role === 'bendahara'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : member.role === 'sekretaris'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {(member.role === 'head' || member.role === 'vice_head') && <Shield className="h-3 w-3" />}
                                  {member.role === 'vice_head' ? 'Wakil Ketua' : member.role === 'head' ? 'Ketua' : member.role}
                                </span>
                              )}
                            </td>
                            {(isHead || currentUserRole === 'sekretaris') && (
                              <td className="py-3.5 px-2 text-center">
                                {member.profile_id !== currentUserId ? (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={!!member.custom_data?.can_take_attendance} onChange={() => handleToggleDelegation(member)} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0087FF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0087FF]"></div>
                                  </label>
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                              </td>
                            )}
                            {customFieldsSchema.map(field => (
                              <td key={field.id} className="py-3.5 px-2 text-slate-600 whitespace-nowrap">
                                {member.custom_data ? member.custom_data[field.id] || '-' : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
      </main>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button 
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                <LinkIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Bagikan Link</h3>
              <p className="text-slate-500 font-medium text-sm mb-6">
                Siapapun yang memiliki link ini dapat bergabung ke dalam organisasi Anda sebagai anggota.
              </p>

              {inviteLoading ? (
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse mb-6"></div>
              ) : (
                <div className="relative mb-6 group">
                  <div className="w-full p-4 bg-slate-50 border-2 border-slate-200 text-slate-600 font-medium text-sm rounded-xl outline-none pr-12 break-all overflow-hidden text-ellipsis whitespace-nowrap text-left">
                    {typeof window !== 'undefined' ? `${window.location.origin}/invite/${inviteCode}` : ''}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute right-2 top-2 bottom-2 w-10 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 transition-colors"
                    title="Copy Link"
                  >
                    {copied ? <span className="text-emerald-500 font-bold text-xs">OK</span> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              <button 
                onClick={resetInviteCode}
                disabled={inviteLoading}
                className="text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset & Hapus Link Lama
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Spotlight Tour */}
      <SpotlightTour
        tourKey="members_management"
        steps={membersTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}
