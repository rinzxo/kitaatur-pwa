'use client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Search, Building2, Crown, Trash2, ShieldCheck, ArrowRight, X, GraduationCap, Link2, Unlink, CheckSquare, Square, Loader2, Sparkles, Plus } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useAdminRoute } from '../useAdminRoute'

export default function AdminOrgsPage() {
  const { dashboardHref } = useAdminRoute()
  const [orgs, setOrgs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()
  
  const [promptData, setPromptData] = useState<{isOpen: boolean, ownerId: string, orgName: string, plan: string}>({ isOpen: false, ownerId: '', orgName: '', plan: '' })

  // State untuk Modal Ekosistem Sekolah & Ekskul
  const [schoolModal, setSchoolModal] = useState<{
    isOpen: boolean
    school: any | null
    linkedOrgs: any[]
    availableOrgs: any[]
    selectedToLink: string[]
    loading: boolean
    submitting: boolean
    searchAvailable: string
  }>({
    isOpen: false,
    school: null,
    linkedOrgs: [],
    availableOrgs: [],
    selectedToLink: [],
    loading: false,
    submitting: false,
    searchAvailable: ''
  })

  // State untuk Pembuatan Sekolah Baru
  const [createSchoolModal, setCreateSchoolModal] = useState({
    isOpen: false,
    name: '',
    slug: '',
    ownerEmail: '',
    submitting: false
  })
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'school' | 'ekskul'>('all')

  const handleSchoolNameChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setCreateSchoolModal(prev => ({ ...prev, name: val, slug: slugified }))
  }

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createSchoolModal.name.trim() || !createSchoolModal.slug.trim()) {
      toast.error('Nama dan Slug sekolah wajib diisi')
      return
    }

    setCreateSchoolModal(prev => ({ ...prev, submitting: true }))
    try {
      const res = await api.post('/admin/orgs/create-school', {
        name: createSchoolModal.name.trim(),
        slug: createSchoolModal.slug.trim(),
        owner_email: createSchoolModal.ownerEmail.trim() || undefined
      })
      toast.success(res.data.message || 'Organisasi sekolah berhasil dibuat!')
      const createdOrg = res.data.org
      setCreateSchoolModal({ isOpen: false, name: '', slug: '', ownerEmail: '', submitting: false })
      await fetchOrgs()
      if (createdOrg) {
        // Langsung buka modal linking untuk sekolah ini agar admin bisa langsung centang ekskulnya
        openSchoolLinkModal(createdOrg)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal membuat organisasi sekolah')
      setCreateSchoolModal(prev => ({ ...prev, submitting: false }))
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/admin/orgs')
      setOrgs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (await confirm('Hapus Organisasi Permanen', `PERINGATAN BAHAYA: Anda akan menghapus organisasi ${name} BESERTA SELURUH DATA DI DALAMNYA secara permanen. Lanjutkan?`)) {
      try {
        await api.delete(`/admin/orgs/${id}`)
        setOrgs(orgs.filter(o => o.id !== id))
        toast.success('Organisasi berhasil dihapus')
      } catch (err) {
        toast.error('Gagal menghapus organisasi')
      }
    }
  }

  const openGrantPrompt = (ownerId: string, orgName: string) => {
    setPromptData({ isOpen: true, ownerId, orgName, plan: 'school' })
  }

  const submitGrant = async () => {
    if (!promptData.plan.trim()) return
    try {
      await api.post('/admin/subscriptions/grant', {
        profile_id: promptData.ownerId,
        plan_type: promptData.plan.toLowerCase().trim()
      })
      toast.success(`Paket ${promptData.plan} berhasil diberikan kepada owner ${promptData.orgName}`)
      setPromptData({ isOpen: false, ownerId: '', orgName: '', plan: '' })
    } catch (err) {
      toast.error('Gagal memberikan paket')
    }
  }

  const openSchoolLinkModal = async (school: any) => {
    setSchoolModal({
      isOpen: true,
      school,
      linkedOrgs: [],
      availableOrgs: [],
      selectedToLink: [],
      loading: true,
      submitting: false,
      searchAvailable: ''
    })

    try {
      const res = await api.get(`/admin/schools/${school.id}/links`)
      setSchoolModal(prev => ({
        ...prev,
        linkedOrgs: res.data.linked_orgs || [],
        availableOrgs: res.data.available_orgs || [],
        loading: false
      }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memuat daftar ekskul sekolah')
      setSchoolModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleToggleSelectOrg = (orgId: string) => {
    setSchoolModal(prev => {
      const isSelected = prev.selectedToLink.includes(orgId)
      return {
        ...prev,
        selectedToLink: isSelected
          ? prev.selectedToLink.filter(id => id !== orgId)
          : [...prev.selectedToLink, orgId]
      }
    })
  }

  const handleSaveSchoolLinks = async () => {
    if (!schoolModal.school || schoolModal.selectedToLink.length === 0) return
    setSchoolModal(prev => ({ ...prev, submitting: true }))

    try {
      await api.post(`/admin/schools/${schoolModal.school.id}/links`, {
        org_ids: schoolModal.selectedToLink
      })
      toast.success(`Berhasil menautkan ${schoolModal.selectedToLink.length} ekskul ke ${schoolModal.school.name}`)
      // Reload links
      const res = await api.get(`/admin/schools/${schoolModal.school.id}/links`)
      setSchoolModal(prev => ({
        ...prev,
        linkedOrgs: res.data.linked_orgs || [],
        availableOrgs: res.data.available_orgs || [],
        selectedToLink: [],
        submitting: false
      }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menautkan ekskul')
      setSchoolModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const handleUnlinkSchoolOrg = async (targetOrgId: string, targetOrgName: string) => {
    if (!schoolModal.school) return
    if (await confirm('Lepas Tautan Ekskul', `Apakah Anda yakin ingin melepas tautan ${targetOrgName} dari ${schoolModal.school.name}?`)) {
      try {
        await api.delete(`/admin/schools/${schoolModal.school.id}/links/${targetOrgId}`)
        toast.success(`Tautan ${targetOrgName} berhasil dilepas`)
        const res = await api.get(`/admin/schools/${schoolModal.school.id}/links`)
        setSchoolModal(prev => ({
          ...prev,
          linkedOrgs: res.data.linked_orgs || [],
          availableOrgs: res.data.available_orgs || []
        }))
      } catch (err) {
        toast.error('Gagal melepas tautan ekskul')
      }
    }
  }

  const filtered = orgs.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false

    const isSchool = o.is_edu || ((o._count?.school_links_as_school || 0) > 0)
    if (categoryFilter === 'school') return isSchool
    if (categoryFilter === 'ekskul') return !isSchool
    return true
  })

  const schoolCount = orgs.filter(o => o.is_edu || ((o._count?.school_links_as_school || 0) > 0)).length
  const ekskulCount = orgs.length - schoolCount

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={dashboardHref} className="text-blue-600 font-semibold hover:underline text-sm mb-2 inline-block">
            &larr; Kembali ke Admin Panel
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Building2 />
            Daftar Organisasi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Buat sekolah induk, tautkan ekskul, atau impersonate.</p>
        </div>

        <button
          onClick={() => setCreateSchoolModal({ isOpen: true, name: '', slug: '', ownerEmail: '', submitting: false })}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm shadow-purple-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Organisasi Sekolah</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua ({orgs.length})
        </button>
        <button
          onClick={() => setCategoryFilter('school')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            categoryFilter === 'school'
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Sekolah ({schoolCount})
        </button>
        <button
          onClick={() => setCategoryFilter('ekskul')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            categoryFilter === 'ekskul'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Ekskul / Unit ({ekskulCount})
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari nama organisasi atau slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-slate-200 rounded-md" />
                  <div className="h-4 w-24 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="h-8 w-24 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(org => {
            const isSchool = org.is_edu || ((org._count?.school_links_as_school || 0) > 0)
            const linkedCount = org._count?.school_links_as_school || 0

            return (
              <div 
                key={org.id} 
                className={`bg-white p-5 rounded-3xl shadow-sm border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                  isSchool ? 'border-purple-200 bg-purple-50/10 hover:border-purple-300' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm ${
                    isSchool ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover" /> : org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base truncate">{org.name}</h3>
                      {isSchool ? (
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          Sekolah
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Ekskul
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> {org.owner?.full_name || 'Tanpa Owner'}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">/{org.slug}</span>
                      {isSchool && linkedCount > 0 && (
                        <span className="bg-purple-100/70 text-purple-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                          {linkedCount} Ekskul Ditautkan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0">
                  <button 
                    onClick={() => openSchoolLinkModal(org)} 
                    title="Tautkan Ekskul ke Sekolah Ini" 
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs ${
                      isSchool 
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-600/20' 
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Tautkan Ekskul</span>
                  </button>
                  <button onClick={() => openGrantPrompt(org.owner_id, org.name)} title="Beri Langganan Gratis" className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                  <a 
                    href={`${
                      typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1')
                        ? 'http://localhost:3000'
                        : `https://${process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'kitatur.rinzgroup.web.id'}`
                    }/org/${org.slug}/${isSchool ? 'executive' : 'dashboard'}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    title={isSchool ? "God Mode: Masuk Dasbor Eksekutif" : "God Mode: Masuk Dasbor"} 
                    className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(org.id, org.name)} title="Hard Delete" className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              Tidak ada organisasi ditemukan.
            </div>
          )}
        </div>
      )}

      {/* Custom Prompt Modal for Subscription Grant */}
      {promptData.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Beri Langganan Manual</h3>
                <button onClick={() => setPromptData({...promptData, isOpen: false})} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <p className="text-sm text-slate-600 mb-4">Pilih paket langganan yang akan diberikan gratis ke organisasi <strong>{promptData.orgName}</strong> selama 1 tahun.</p>
              
              <div className="flex flex-col gap-2">
                {['family', 'school', 'enterprise', 'pro'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPromptData({...promptData, plan: p})}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between ${promptData.plan === p ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="font-bold capitalize">{p} Plan</span>
                    {promptData.plan === p && <ShieldCheck className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <button 
                onClick={submitGrant}
                className="w-full bg-[#0087FF] hover:bg-[#0077E6] text-white font-bold py-3 rounded-xl mt-6 shadow-sm shadow-blue-600/20 transition-all"
              >
                Konfirmasi Pemberian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ekosistem Sekolah & Ekskul Pairing */}
      {schoolModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg">Ekosistem Sekolah</h3>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Pairing Ekskul</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hubungkan ekskul ke <strong>{schoolModal.school?.name}</strong> untuk tampil di Dashboard Eksekutif.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSchoolModal({ ...schoolModal, isOpen: false })} 
                className="p-2 hover:bg-white/80 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {schoolModal.loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-medium">Memuat data ekskul...</p>
                </div>
              ) : (
                <>
                  {/* Bagian 1: Ekskul yang Sudah Tertaut */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-purple-600" />
                        Ekskul Tertaut Saat Ini ({schoolModal.linkedOrgs.length})
                      </h4>
                    </div>

                    {schoolModal.linkedOrgs.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 text-xs bg-slate-50">
                        Belum ada ekskul yang ditautkan ke sekolah ini. Silakan pilih dan centang ekskul di bawah lalu simpan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {schoolModal.linkedOrgs.map(item => (
                          <div 
                            key={item.id} 
                            className="p-3 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                                {item.logo_url ? <img src={item.logo_url} className="w-full h-full object-cover rounded-xl" /> : item.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-500">{item._count?.organization_members || 0} Anggota</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlinkSchoolOrg(item.id, item.name)}
                              title="Lepas tautan dari sekolah"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bagian 2: Tautkan Ekskul Baru */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          Tautkan Organisasi / Ekskul Baru
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pilih organisasi yang ingin dihubungkan ke dashboard eksekutif sekolah ini.
                        </p>
                      </div>
                      {schoolModal.selectedToLink.length > 0 && (
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                          {schoolModal.selectedToLink.length} dipilih
                        </span>
                      )}
                    </div>

                    {/* Search box available */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari ekskul untuk ditautkan..."
                        value={schoolModal.searchAvailable}
                        onChange={(e) => setSchoolModal({ ...schoolModal, searchAvailable: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Available list */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {schoolModal.availableOrgs
                        .filter(o => 
                          o.name.toLowerCase().includes(schoolModal.searchAvailable.toLowerCase()) ||
                          o.slug.toLowerCase().includes(schoolModal.searchAvailable.toLowerCase())
                        )
                        .map(org => {
                          const isSelected = schoolModal.selectedToLink.includes(org.id)
                          return (
                            <div
                              key={org.id}
                              onClick={() => handleToggleSelectOrg(org.id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50/60 shadow-xs' 
                                  : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="text-purple-600 shrink-0">
                                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{org.name}</p>
                                  <span className="text-[10px] text-slate-400 font-mono">/{org.slug} • {org._count?.organization_members || 0} Anggota</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                      {schoolModal.availableOrgs.length === 0 && (
                        <p className="text-xs text-center py-4 text-slate-400">Semua organisasi sudah tertaut atau tidak ada organisasi lain.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Tiap ekskul tetap membayar paket langganannya secara mandiri.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSchoolModal({ ...schoolModal, isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={schoolModal.submitting || schoolModal.selectedToLink.length === 0}
                  onClick={handleSaveSchoolLinks}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  {schoolModal.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Simpan Tautan ({schoolModal.selectedToLink.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Organisasi Sekolah Induk */}
      {createSchoolModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Buat Organisasi Sekolah</h3>
                  <p className="text-xs text-slate-500">Entitas induk untuk memonitor seluruh ekskul.</p>
                </div>
              </div>
              <button 
                onClick={() => setCreateSchoolModal({ ...createSchoolModal, isOpen: false })} 
                className="p-1.5 hover:bg-white/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchoolSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Sekolah Induk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SMAN 2 BABELAN"
                  value={createSchoolModal.name}
                  onChange={(e) => handleSchoolNameChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Slug URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
                  <span className="text-xs text-slate-400 pl-3 pr-1 font-mono">/org/</span>
                  <input
                    type="text"
                    placeholder="sman-2-babelan"
                    value={createSchoolModal.slug}
                    onChange={(e) => setCreateSchoolModal({ ...createSchoolModal, slug: e.target.value })}
                    required
                    className="w-full py-2.5 pr-3 bg-transparent text-xs outline-none font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Akun Kepsek / Wakasek <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Jika sudah punya akun KitaAtur, masukkan emailnya agar langsung menjadi Head di sekolah ini.
                </p>
                <input
                  type="email"
                  placeholder="contoh: kepsek@sman2babelan.sch.id"
                  value={createSchoolModal.ownerEmail}
                  onChange={(e) => setCreateSchoolModal({ ...createSchoolModal, ownerEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateSchoolModal({ ...createSchoolModal, isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSchoolModal.submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-sm shadow-purple-600/30 transition-all flex items-center gap-1.5"
                >
                  {createSchoolModal.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  <span>Buat & Lanjut Tautkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
