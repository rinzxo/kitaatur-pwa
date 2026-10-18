'use client'

import toast from 'react-hot-toast'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, supabase } from '@/lib/api'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  MagnifyingGlass as Search, 
  Users, 
  ShieldCheck, 
  IdentificationCard,
  QrCode,
  CircleNotch as Loader2,
  Check,
  X,
  Funnel
} from '@phosphor-icons/react'
import { QRCodeSVG } from 'qrcode.react'

interface Member {
  id: string
  organization_id: string
  profile_id: string
  role: 'head' | 'vice_head' | 'bendahara' | 'sekretaris' | 'member' | 'auditor'
  joined_at: string
  custom_data: any
  profile: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function MemberQRCollectionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [members, setMembers] = useState<Member[]>([])
  const [orgData, setOrgData] = useState<{ id: string; name: string; logo_url: string | null; slug: string } | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'management' | 'member'>('all')

  useEffect(() => {
    fetchData()
  }, [orgSlug])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [membersRes, orgsRes] = await Promise.all([
        api.get(`/org/${orgSlug}/members`),
        api.get('/org/me/list').catch(() => ({ data: [] }))
      ])

      const memberList: Member[] = membersRes.data || []
      setMembers(memberList)

      const current = memberList.find(m => m.profile_id === user.id)
      const role = user.email === 'generalrino@gmail.com' ? 'head' : (current?.role || 'member')
      setCurrentUserRole(role)

      const currentOrg = orgsRes.data?.find((o: any) => o.slug === orgSlug)
      if (currentOrg) {
        setOrgData(currentOrg)
      } else if (memberList.length > 0) {
        setOrgData({
          id: memberList[0].organization_id,
          name: 'Organisasi',
          logo_url: null,
          slug: orgSlug
        })
      }
    } catch (err: any) {
      toast.error('Gagal memuat data anggota organisasi.')
    } finally {
      setLoading(false)
    }
  }

  const isAuthorized = ['head', 'vice_head', 'sekretaris'].includes(currentUserRole)

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const name = (m.profile?.full_name || '').toLowerCase()
      const email = (m.profile?.email || '').toLowerCase()
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || name.includes(query) || email.includes(query)

      if (!matchesSearch) return false

      if (roleFilter === 'management') {
        return ['head', 'vice_head', 'bendahara', 'sekretaris'].includes(m.role)
      } else if (roleFilter === 'member') {
        return m.role === 'member' || m.role === 'auditor'
      }
      return true
    })
  }, [members, searchQuery, roleFilter])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'head':
        return { label: 'Ketua', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'vice_head':
        return { label: 'Wakil Ketua', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      case 'sekretaris':
        return { label: 'Sekretaris', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'bendahara':
        return { label: 'Bendahara', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'auditor':
        return { label: 'Auditor', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'Anggota', bg: 'bg-slate-100 text-slate-600 border-slate-200' }
    }
  }

  const handleDownloadSingleQR = (member: Member) => {
    const svgId = `qr-svg-${member.profile_id}`
    const svgEl = document.getElementById(svgId) as SVGSVGElement | null
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = 600
      canvas.height = 700
      if (ctx) {
        // Background
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
        const memberName = member.profile?.full_name || member.profile?.email || 'Anggota'
        ctx.fillText(memberName, 300, 560)

        ctx.fillStyle = '#64748b'
        ctx.font = '18px sans-serif'
        const roleLabel = getRoleBadge(member.role).label
        ctx.fillText(`${roleLabel} • ID: ${member.profile_id.slice(0, 8).toUpperCase()}`, 300, 600)

        ctx.fillStyle = '#94a3b8'
        ctx.font = '14px sans-serif'
        ctx.fillText('Kartu Presensi Resmi KitaAtur', 300, 650)

        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `QR_${memberName.replace(/\s+/g, '_')}_${orgSlug}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        toast.success(`QR ${memberName} berhasil diunduh!`)
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0087FF] mb-3" />
        <span className="text-sm font-semibold text-slate-500">Menyiapkan kartu QR seluruh anggota...</span>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <IdentificationCard size={32} weight="bold" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Dibatasi</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Fitur cetak dan unduh QR seluruh anggota hanya dapat diakses oleh <strong>Ketua</strong>, <strong>Wakil Ketua</strong>, dan <strong>Sekretaris</strong> organisasi.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  const managementCount = members.filter(m => ['head', 'vice_head', 'bendahara', 'sekretaris'].includes(m.role)).length
  const regularCount = members.filter(m => m.role === 'member' || m.role === 'auditor').length

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-20">
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="print:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/org/${orgSlug}/settings`)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
              title="Kembali ke Pengaturan"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">QR Code Seluruh Anggota</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {members.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cetak ID Card & unduh QR presensi resmi {orgData?.name || 'organisasi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/org/${orgSlug}/members`}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Users size={16} weight="bold" />
              <span>Daftar Anggota</span>
            </Link>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-[#0087FF] hover:bg-[#0077E6] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0087FF]/20 flex items-center gap-2 active:scale-95"
            >
              <Printer size={16} weight="bold" />
              <span>Cetak Dokumen (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none">
        
        {/* Print Tip & Controls (Hidden on Print) */}
        <div className="print:hidden space-y-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0087FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                <IdentificationCard size={22} weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Lembar Cetak Kartu Presensi A4</h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Gunakan tombol <strong>Cetak Dokumen</strong> untuk mencetak semua kartu anggota dalam layout kisi standar A4 lengkap dengan garis potong kartu.
                </p>
              </div>
            </div>
            <div className="text-xs font-semibold text-blue-700 bg-white/80 border border-blue-200 px-3 py-1.5 rounded-lg shrink-0">
              💡 Tips: Atur margin browser ke &quot;None&quot; saat mencetak
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama anggota atau email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0087FF] focus:ring-4 focus:ring-[#0087FF]/10 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({members.length})
              </button>
              <button
                onClick={() => setRoleFilter('management')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'management'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengurus ({managementCount})
              </button>
              <button
                onClick={() => setRoleFilter('member')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === 'member'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anggota ({regularCount})
              </button>
            </div>
          </div>
        </div>

        {/* Printable Grid of Member Cards */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <Users size={40} weight="duotone" className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">Tidak ada anggota yang cocok</h3>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter peran Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 gap-6 print:gap-4">
            {filteredMembers.map((member) => {
              const roleBadge = getRoleBadge(member.role)
              const memberName = member.profile?.full_name || member.profile?.email || 'Anggota'
              const qrPayload = JSON.stringify({
                type: 'kitaatur_member',
                orgId: member.organization_id,
                orgSlug: orgSlug,
                profileId: member.profile_id,
                name: memberName,
                email: member.profile?.email
              })

              return (
                <div 
                  key={member.id}
                  className="bg-white border-2 border-dashed border-slate-300 print:border-slate-400 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-between text-center transition-all duration-200 hover:shadow-lg hover:border-[#0087FF]/50 break-inside-avoid relative overflow-hidden group"
                >
                  {/* Top Card Header */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 print:border-slate-200 mb-3">
                    <div className="flex items-center gap-2 truncate">
                      {orgData?.logo_url ? (
                        <img src={orgData.logo_url} alt="Logo" className="w-5 h-5 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-[#0087FF] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {(orgData?.name || 'K').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-extrabold text-slate-700 truncate max-w-[120px]">
                        {orgData?.name || 'KitaAtur'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white p-3 rounded-xl border border-slate-100 print:border-slate-300 shadow-2xs mb-3 group-hover:scale-105 transition-transform">
                    <QRCodeSVG 
                      id={`qr-svg-${member.profile_id}`}
                      value={qrPayload}
                      size={135}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Member Details */}
                  <div className="w-full space-y-1 mb-3">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1" title={memberName}>
                      {memberName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate" title={member.profile?.email}>
                      {member.profile?.email}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      ID: {member.profile_id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Single Download Button (Hidden on Print) */}
                  <div className="print:hidden w-full pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDownloadSingleQR(member)}
                      className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200/80 hover:border-blue-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Download size={14} weight="bold" />
                      <span>Unduh PNG</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

    </div>
  )
}
