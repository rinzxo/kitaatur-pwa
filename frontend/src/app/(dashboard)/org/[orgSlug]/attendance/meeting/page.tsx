'use client'
import toast from 'react-hot-toast'


import { useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, Sparkles } from 'lucide-react'

export default function MeetingNotesPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !content) {
      toast.error('Judul dan isi notulensi tidak boleh kosong.')
      return
    }

    setLoading(true)

    try {
      const res = await api.post(`/org-meeting/${orgSlug}`, {
        title,
        content
      })
      setResult(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan notulensi.')
    } finally {
      setLoading(false)
    }
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
            Buat Notulensi Rapat
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Ketik catatan rapat kasar Anda, biarkan AI yang merapikannya.</p>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto space-y-8">
        
        {result ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Notulensi Berhasil Disimpan</h2>
                <p className="text-slate-500 text-sm">AI telah merangkum catatan rapat Anda.</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">{result.title}</h3>
              <p className="text-sm text-slate-500 mb-4">
                {new Date(result.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
              <h4 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wider">Ringkasan AI</h4>
              <div className="prose prose-slate max-w-none text-indigo-900/80 whitespace-pre-wrap">
                {result.ai_summary || "AI gagal membuat ringkasan, namun catatan asli tetap tersimpan."}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTitle(''); setContent(''); setResult(null);
                }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Buat Baru
              </button>
              <Link
                href={`/org/${orgSlug}/attendance/meeting/history`}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 text-center"
              >
                Lihat Riwayat
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Topik / Judul Rapat</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Evaluasi Bulanan"
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Kasar</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ketik poin-poin rapat di sini. Jangan khawatir soal kerapihan..."
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none min-h-[300px]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-4 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sedang Diproses AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Simpan & Rapihkan dengan AI
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  )
}
