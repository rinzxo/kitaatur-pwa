'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, UserPlus, Shield, UserMinus, RefreshCw, Link as LinkIcon, Copy, RotateCcw, X, Search } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'

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
  role: 'head' | 'bendahara' | 'sekretaris' | 'member'
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
  const [currentUserRole, setCurrentUserRole] = useState<'head' | 'bendahara' | 'sekretaris' | 'member'>('member')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])

  // Form State
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'bendahara' | 'sekretaris' | 'member'>('member')
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
  const canInvite = currentUserRole === 'head' || currentUserRole === 'sekretaris'

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
    if (!await await confirm('Konfirmasi', 'Link invite lama akan hangus dan tidak bisa digunakan lagi. Lanjutkan?')) return
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

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-lg text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
          title="Segarkan Data"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Members Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
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
                    {filteredMembers.map((member) => (
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
                        
                        {isHead && member.profile_id !== currentUserId && (
                          <button
                            onClick={() => handleKickMember(member.profile_id, member.profile.full_name || 'Anggota ini')}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                            title="Keluarkan Anggota"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-500">Role:</span>
                          {isHead && member.profile_id !== currentUserId ? (
                            <CustomSelect
                              value={member.role}
                              onChange={(val) => handleRoleChange(member.profile_id, val)}
                              options={[
                                { label: 'Anggota (Member)', value: 'member' },
                                { label: 'Bendahara', value: 'bendahara' },
                                { label: 'Sekretaris', value: 'sekretaris' },
                                { label: 'Head (Transfer)', value: 'head' }
                              ]}
                              className="max-w-[140px]"
                            />
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              member.role === 'head'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : member.role === 'bendahara'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : member.role === 'sekretaris'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {member.role === 'head' && <Shield className="h-3 w-3" />}
                              {member.role}
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
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
                          {isHead && <th className="py-3 px-2 text-right">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
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
                              {isHead && member.profile_id !== currentUserId ? (
                                <CustomSelect
                                  value={member.role}
                                  onChange={(val) => handleRoleChange(member.profile_id, val)}
                                  options={[
                                    { label: 'Anggota (Member)', value: 'member' },
                                    { label: 'Bendahara', value: 'bendahara' },
                                    { label: 'Sekretaris', value: 'sekretaris' },
                                    { label: 'Head (Transfer Kepemilikan)', value: 'head' }
                                  ]}
                                />
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                  member.role === 'head'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : member.role === 'bendahara'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : member.role === 'sekretaris'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {member.role === 'head' && <Shield className="h-3 w-3" />}
                                  {member.role}
                                </span>
                              )}
                            </td>
                            {(isHead || currentUserRole === 'sekretaris') && (
                              <td className="py-3.5 px-2 text-center">
                                {member.profile_id !== currentUserId ? (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={!!member.custom_data?.can_take_attendance} onChange={() => handleToggleDelegation(member)} />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
                            {isHead && (
                              <td className="py-3.5 px-2 text-right">
                                {member.profile_id !== currentUserId && (
                                  <button
                                    onClick={() => handleKickMember(member.profile_id, member.profile.full_name || 'Anggota ini')}
                                    className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                    title="Keluarkan Anggota"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Right Column: Invite Member CTA (Only visible to Head) */}
        <div className="space-y-6">


          {canInvite ? (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Link Undangan</h3>
              <p className="text-slate-500 font-medium text-xs mb-6 leading-relaxed">
                Bagikan link khusus untuk memungkinkan siapapun bergabung ke workspace ini secara instan.
              </p>
              <button 
                onClick={openInviteModal}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Dapatkan Link
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center text-slate-500 font-medium text-sm">
              Anda tidak memiliki wewenang untuk menambahkan anggota atau membagikan link invite.
            </div>
          )}
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
    </div>
  )
}
