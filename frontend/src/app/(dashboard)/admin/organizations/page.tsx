'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Search, Building2, Crown, Trash2, ShieldCheck, ArrowRight, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()
  
  const [promptData, setPromptData] = useState<{isOpen: boolean, ownerId: string, orgName: string, plan: string}>({ isOpen: false, ownerId: '', orgName: '', plan: '' })

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
        alert('Organisasi berhasil dihapus')
      } catch (err) {
        alert('Gagal menghapus organisasi')
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
      alert(`Paket ${promptData.plan} berhasil diberikan kepada owner ${promptData.orgName}`)
      setPromptData({ isOpen: false, ownerId: '', orgName: '', plan: '' })
    } catch (err) {
      alert('Gagal memberikan paket')
    }
  }

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
      <div className="mb-6">
        <Link href="/admin" className="text-blue-600 font-semibold hover:underline text-sm mb-2 inline-block">
          &larr; Kembali ke Admin Panel
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 />
          Daftar Organisasi
        </h1>
        <p className="text-slate-500 mt-1">Impersonate, hapus, atau kelola langganan secara paksa.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari organisasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Memuat data...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(org => (
            <div key={org.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {org.logo_url ? <img src={org.logo_url} className="w-full h-full object-cover" /> : <Building2 className="text-slate-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{org.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> {org.owner?.full_name || 'Tanpa Owner'}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">/{org.slug}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button onClick={() => openGrantPrompt(org.owner_id, org.name)} title="Beri Langganan Gratis" className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </button>
                <Link href={`/org/${org.slug}/dashboard`} title="God Mode: Masuk Dasbor" className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button onClick={() => handleDelete(org.id, org.name)} title="Hard Delete" className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
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
                {['school', 'enterprise', 'pro'].map(p => (
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-6 shadow-sm shadow-blue-600/20 transition-all"
              >
                Konfirmasi Pemberian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
