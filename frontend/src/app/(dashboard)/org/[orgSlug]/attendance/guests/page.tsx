'use client'
import toast from 'react-hot-toast'
import { useState, useEffect, Suspense, useRef } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Download, ScanLine, Printer, Users, CheckCircle2, XCircle, Search, Clock } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

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
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      setLoading(true)
      const url = sessionId && sessionId !== 'null' 
        ? `/org-attendance/${orgSlug}/guests?sessionId=${sessionId}`
        : `/org-attendance/${orgSlug}/guests`
      const res = await api.get(url)
      setGuests(res.data)
    } catch (err) {
      toast.error('Gagal memuat daftar peserta eksternal')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Template')

    // Define columns
    worksheet.columns = [
      { header: 'Nama', key: 'nama', width: 30 },
      { header: 'ID', key: 'id', width: 25, style: { numFmt: '@' } }, // Format as Text
      { header: 'Kelas', key: 'kelas', width: 15 }
    ]

    // Header styling
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { horizontal: 'center' }

    // Add Sample Data
    worksheet.addRow({ nama: 'Budi Santoso', id: '10A-12345', kelas: '10A' })
    worksheet.addRow({ nama: 'Siti Aminah', id: '10B-98765', kelas: '10B' })
    
    // Add extra empty rows with text formatting for ID column just in case
    for(let i = 0; i < 50; i++) {
        const row = worksheet.addRow({})
        row.getCell('id').numFmt = '@' 
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, 'Template_Peserta_Eksternal.xlsx')
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
          identifier: String(row['ID'] || row['id'] || row['Identifier'] || row['NIM'] || row['nim'] || row['NIK'] || '').trim(),
          kelas: row['Kelas'] || row['kelas'] || row['Class'] || row['class'] ? String(row['Kelas'] || row['kelas'] || row['Class'] || row['class']).trim() : null
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
              <p className="text-sm text-slate-500">Format wajib: Kolom <b>Nama</b> dan <b>ID</b>. Opsional: <b>Kelas</b></p>
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
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50">
            <h3 className="font-bold text-slate-800">Daftar Tamu ({guests.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50/50">
            {loading ? (
              <div className="p-10 text-center text-slate-500">Memuat data...</div>
            ) : guests.length === 0 ? (
              <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">Belum ada peserta eksternal yang diupload.</div>
            ) : (() => {
              const filteredGuests = guests.filter(g => 
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (g.identifier && g.identifier.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (g.kelas && g.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
              );
              
              if (filteredGuests.length === 0) {
                return (
                  <div className="p-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    Pencarian tidak ditemukan.
                  </div>
                );
              }
              
              return (
                <div>
                  {/* Mobile View: Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredGuests.map((g) => (
                      <div key={g.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="mb-4">
                          <h4 className="font-bold text-slate-900 text-lg">{g.name}</h4>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs uppercase">ID</span>
                              <span className="font-mono">{g.identifier || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs uppercase">Token</span>
                            <span className="font-mono text-xs truncate max-w-[150px]">{g.qr_token}</span>
                          </div>
                          {g.kelas && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs uppercase">Kelas</span>
                              <span className="font-bold text-xs">{g.kelas}</span>
                            </div>
                          )}
                        </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                          {g.check_in_time ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {new Date(g.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                              <Clock className="w-3.5 h-3.5" />
                              Belum Hadir
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/50">
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">Nama Tamu</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">Kelas</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">ID / Identitas</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">Token QR</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-right">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuests.map((g) => (
                          <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{g.name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-bold text-slate-600">
                                {g.kelas || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md inline-block">
                                {g.identifier || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-mono text-slate-500 truncate max-w-[150px]">
                                {g.qr_token}
                              </div>
                            </td>
                            <td className="px-4 py-3 flex justify-end">
                              {g.check_in_time ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {new Date(g.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Belum Hadir
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
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
