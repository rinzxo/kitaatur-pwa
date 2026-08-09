'use client'
import toast from 'react-hot-toast'
import { useState, useEffect, Suspense, useRef } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Download, ScanLine, Printer, Users, CheckCircle2, XCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

function GuestsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string
  const sessionId = searchParams?.get('sessionId')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/org-attendance/${orgSlug}/guests`)
      setGuests(res.data)
    } catch (err) {
      toast.error('Gagal memuat daftar peserta eksternal')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama: "Budi Santoso", ID: "NIM-12345" },
      { Nama: "Siti Aminah", ID: "NIK-98765" }
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "Template_Peserta_Eksternal.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { raw: false })

        // Parse data
        const payload = data.map((row: any) => ({
          name: String(row['Nama'] || row['nama'] || row['Name'] || row['name'] || '').trim(),
          identifier: String(row['ID'] || row['id'] || row['Identifier'] || row['NIM'] || row['nim'] || row['NIK'] || '').trim()
        })).filter(g => g.name && g.identifier)

        if (payload.length === 0) {
          toast.error("Format file tidak sesuai. Pastikan ada kolom 'Nama' dan 'ID'.")
          setUploading(false)
          return
        }

        const uploadRes = await api.post(`/org-attendance/${orgSlug}/guests`, { guests: payload })
        toast.success(uploadRes.data.message)
        fetchGuests()
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Gagal mengupload data')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 pt-6 pb-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link 
              href={sessionId && sessionId !== 'null' ? `/org/${orgSlug}/attendance/generate?sessionId=${sessionId}` : `/org/${orgSlug}/attendance`}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              {sessionId && sessionId !== 'null' ? 'Kembali ke Sesi' : 'Kembali ke Absensi'}
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Peserta Eksternal
            </h1>
            <p className="text-sm text-slate-500 mt-1">Kelola tamu dan hasilkan QR Code absensi</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/org/${orgSlug}/attendance/guests/analytics`)}
              className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4" />
              Statistik Tamu
            </button>
            <button 
              onClick={() => router.push(`/org/${orgSlug}/attendance/guests/print`)}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              Cetak QR
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Upload Data Peserta (Excel)</h3>
              <p className="text-sm text-slate-500">Format wajib: Kolom <b>Nama</b> dan <b>ID</b></p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Template
              </button>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengupload...' : 'Upload Excel'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Daftar Tamu ({guests.length})</h3>
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500">Memuat data...</div>
          ) : guests.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Belum ada peserta eksternal yang diupload.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 border-b border-slate-200">Nama</th>
                    <th className="text-left font-semibold text-slate-500 p-4 w-1/4">Identifier</th>
                    <th className="text-left font-semibold text-slate-500 p-4 w-1/3">Token QR</th>
                    <th className="px-6 py-3 border-b border-slate-200">Waktu Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, idx) => (
                    <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{g.name}</td>
                      <td className="px-6 py-4">{g.identifier}</td>
                      <td className="p-4 text-slate-500 font-mono text-sm max-w-[200px] truncate">{g.qr_token}</td>
                      <td className="px-6 py-4">
                        {g.check_in_time 
                          ? new Date(g.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>}>
      <GuestsContent />
    </Suspense>
  )
}
