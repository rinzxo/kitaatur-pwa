'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Search, Calendar, User } from 'lucide-react'

export default function MeetingHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [minutes, setMinutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMinutes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const res = await api.get(`/org-meeting/${orgSlug}`)
      setMinutes(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Anda tidak memiliki akses ke fitur ini.')
        router.push(`/org/${orgSlug}/attendance`)
      } else {
        console.error('Failed to fetch meeting minutes:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMinutes()
  }, [orgSlug, router])

  const filteredMinutes = minutes.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.ai_summary && m.ai_summary.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-10 w-1/3 bg-slate-200 rounded-lg"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <header className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Absensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            Riwayat Notulensi
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Daftar semua hasil notulensi AI organisasi.</p>
        </div>

        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Cari notulensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto space-y-6">
        {filteredMinutes.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tidak Ada Notulensi</h3>
            <p className="text-slate-500 text-sm">Belum ada notulensi yang pernah dibuat atau cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          filteredMinutes.map(meeting => (
            <div key={meeting.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{meeting.title}</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(meeting.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {meeting.author?.full_name || 'Sekretaris'}
                    </span>
                  </div>
                </div>
              </div>

              {meeting.ai_summary ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-indigo-900 mb-3 uppercase tracking-wider">Ringkasan AI</h4>
                  <div className="prose prose-slate max-w-none text-indigo-900/80 text-sm whitespace-pre-wrap">
                    {meeting.ai_summary}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Catatan Kasar (Tanpa AI)</h4>
                  <div className="prose prose-slate max-w-none text-slate-600 text-sm whitespace-pre-wrap">
                    {meeting.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
