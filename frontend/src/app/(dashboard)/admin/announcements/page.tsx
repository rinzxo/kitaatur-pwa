'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Megaphone, Plus, Trash2, Calendar } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const confirm = useConfirm()
  
  const [formData, setFormData] = useState({ title: '', content: '', type: 'info' })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements')
      setAnnouncements(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm('Hapus Pengumuman', 'Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      try {
        await api.delete(`/admin/announcements/${id}`)
        setAnnouncements(announcements.filter(a => a.id !== id))
      } catch (err) {
        alert('Gagal menghapus')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/admin/announcements', formData)
      setAnnouncements([res.data, ...announcements])
      setIsAdding(false)
      setFormData({ title: '', content: '', type: 'info' })
    } catch (err) {
      alert('Gagal membuat pengumuman')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-blue-600 font-semibold hover:underline text-sm mb-2 inline-block">
            &larr; Kembali ke Admin Panel
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone />
            Pusat Pengumuman
          </h1>
          <p className="text-slate-500 mt-1">Kirim pesan yang akan muncul di layar semua pengguna.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
          {isAdding ? 'Batal' : <><Plus className="w-5 h-5"/> Buat Baru</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="font-bold mb-4">Buat Pengumuman Baru</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Judul</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-200" placeholder="Contoh: Pemeliharaan Sistem" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Isi Pesan</label>
              <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-200" rows={3} placeholder="Sistem akan dimatikan pada..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipe</label>
              <CustomSelect 
                options={[
                  { label: 'Info (Biru)', value: 'info' },
                  { label: 'Warning (Kuning)', value: 'warning' },
                  { label: 'Error (Merah)', value: 'error' }
                ]}
                value={formData.type}
                onChange={(val) => setFormData({...formData, type: val})}
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white font-bold py-3 rounded-xl mt-2">Kirim Broadcast</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-500">Memuat data...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className={`text-xs font-bold px-2 py-1 inline-block rounded-md mb-2 uppercase tracking-wider ${a.type === 'error' ? 'bg-rose-100 text-rose-700' : a.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {a.type}
                </div>
                <h3 className="font-bold text-lg">{a.title}</h3>
                <p className="text-slate-600 text-sm mt-1">{a.content}</p>
                <div className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Dibuat: {new Date(a.created_at).toLocaleString('id-ID')}
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)} className="self-end md:self-center p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
              Belum ada pengumuman.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
