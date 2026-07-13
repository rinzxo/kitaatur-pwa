'use client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle, Loader2, Search } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function BantuAbsenPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [members, setMembers] = useState<any[]>([])
  const [agendas, setAgendas] = useState<any[]>([])
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agendasRes = await api.get(`/org-attendance/${orgSlug}/agenda`)
        setAgendas(agendasRes.data)
        if (agendasRes.data.length > 0) {
          setSelectedAgendaId(agendasRes.data[0].id)
        } else {
          setLoading(false)
        }
      } catch (err: any) {
        toast.error('Gagal mengambil data agenda.')
        setLoading(false)
      } 
    }
    fetchData()
  }, [orgSlug])

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedAgendaId) return
      setLoading(true)
      try {
        const membersRes = await api.get(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/members`)
        setMembers(membersRes.data)
        setSelectedMembers(new Set()) // reset
      } catch (err: any) {
        toast.error('Gagal mengambil data anggota.')
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [selectedAgendaId, orgSlug])

  const toggleMember = (id: string) => {
    const newSet = new Set(selectedMembers)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedMembers(newSet)
  }

  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase()
    const name = (m.profile.full_name || '').toLowerCase()
    const email = (m.profile.email || '').toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  const selectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.profile_id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgendaId) {
      toast.error('Pilih agenda/sesi terlebih dahulu.')
      return
    }
    if (selectedMembers.size === 0) {
      toast.error('Pilih setidaknya satu anggota.')
      return
    }
    if (!pin) {
      toast.error('Masukkan PIN untuk keamanan.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        profileIds: Array.from(selectedMembers),
        pin
      }
      const res = await api.post(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/manual-checkin`, payload)
      toast.success(res.data.message || 'Berhasil mengabsenkan anggota.')
      router.push(`/org/${orgSlug}/attendance`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal melakukan check-in.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
        <header className="mb-6 text-left">
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Absensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            Bantu Absen Anggota
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-2">
            Pilih agenda dan anggota untuk diabsenkan secara masal tanpa validasi GPS. Anda wajib memasukkan PIN sesi untuk keamanan.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Agenda / Sesi</label>
            <CustomSelect
              value={selectedAgendaId}
              onChange={val => setSelectedAgendaId(val)}
              placeholder="-- Pilih Agenda --"
              options={agendas.map(agenda => {
                const isOngoing = new Date() >= new Date(agenda.start_time);
                return {
                  label: `${agenda.title} (${new Date(agenda.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}) ${isOngoing ? ' - Sedang Berjalan' : ' - Mendatang'}`,
                  value: agenda.id
                }
              })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">PIN Keamanan</label>
              <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="Masukkan PIN Sesi" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center tracking-[0.3em] font-bold text-lg" maxLength={10} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">Pilih Anggota Hadir</label>
              <button 
                type="button" 
                onClick={selectAll}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {selectedMembers.size === filteredMembers.length && filteredMembers.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              />
            </div>
            
            <div className="border border-slate-200 rounded-xl max-h-80 overflow-y-auto bg-slate-50 divide-y divide-slate-100">
              {filteredMembers.length > 0 ? filteredMembers.map(member => (
                <label key={member.id} className="flex items-center gap-3 p-3 hover:bg-slate-100 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedMembers.has(member.profile_id)}
                    onChange={() => toggleMember(member.profile_id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {member.profile.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (member.profile.full_name || member.profile.email || 'T').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-tight flex items-center gap-2">
                        {member.profile.full_name || 'Tanpa Nama'}
                        {member.organization?.name && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                            {member.organization.name}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{member.profile.email}</p>
                    </div>
                  </div>
                </label>
              )) : (
                <div className="p-4 text-center text-sm text-slate-500">Tidak ada anggota yang cocok.</div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Terpilih: {selectedMembers.size} dari {members.length} anggota total
            </p>
          </div>

          <button 
            type="submit"
            disabled={submitting || selectedMembers.size === 0 || !selectedAgendaId}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Proses Absensi
          </button>
        </form>
      </div>
    </div>
  )
}
