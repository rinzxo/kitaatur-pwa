'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Users, CheckCircle, Clock, AlertTriangle, Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

interface GuestStat {
  id: string
  name: string
  identifier: string
  kelas?: string | null
  stats: {
    tepat: number
    terlambat: number
    izin: number
    sakit: number
    alpha: number
    percentage: number
  }
}

export default function GuestAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [data, setData] = useState<{
    overall: any,
    dailyTrend: any[],
    guestList: any[]
  } | null>(null)
  const [isSchool, setIsSchool] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/guests/analytics`)
      setData(res.data)

      try {
        const settingsRes = await api.get(`/org/${orgSlug}/settings`)
        setIsSchool(settingsRes.data?.is_edu || false)
      } catch (e) {}
    } catch (err) {
      toast.error('Gagal memuat analitik tamu')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async () => {
    if (!data) return

    try {
      const sortedList = [...data.guestList].sort((a, b) => a.name.localeCompare(b.name))
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(isSchool ? 'Rekap Kehadiran Siswa' : 'Rekap Kehadiran Tamu')

      // Define columns
      worksheet.columns = [
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'Kelas', key: 'kelas', width: 15 },
        { header: 'ID', key: 'id', width: 25, style: { numFmt: '@' } },
        { header: 'TEPAT', key: 'tepat', width: 12 },
        { header: 'TERLAMBAT', key: 'terlambat', width: 15 },
        { header: 'IZIN', key: 'izin', width: 12 },
        { header: 'SAKIT', key: 'sakit', width: 12 },
        { header: 'ALPHA', key: 'alpha', width: 12 },
      ]

      // Add Data
      sortedList.forEach((guest) => {
        worksheet.addRow({
          nama: guest.name,
          kelas: guest.kelas || '-',
          id: guest.identifier,
          tepat: guest.stats.tepat,
          terlambat: guest.stats.terlambat,
          izin: guest.stats.izin,
          sakit: guest.stats.sakit,
          alpha: guest.stats.alpha
        })
      })

      // Styling: Add Borders and center align header & numbers
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          // Borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          
          // Header style
          if (rowNumber === 1) {
            cell.font = { bold: true }
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else {
            // Data alignment: Nama & ID left, Numbers right/center
            if (colNumber > 2) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' }
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'left' }
            }
          }
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `Rekap_Kehadiran_${isSchool ? 'Siswa' : 'Tamu'}_${orgSlug}.xlsx`)
      toast.success('Berhasil mengekspor Excel!')
    } catch (err) {
      toast.error('Gagal mengekspor file Excel.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-600 font-medium">Memuat Statistik...</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-white border-b border-slate-200 pt-6 pb-4 px-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <Link 
            href={`/org/${orgSlug}/attendance/guests`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Data {isSchool ? 'Siswa' : 'Tamu'}
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            Statistik Kehadiran {isSchool ? 'Siswa' : 'Tamu'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi kehadiran {isSchool ? 'siswa' : 'tamu'} dari seluruh sesi absensi otomatis.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Total Tamu</p>
              <p className="text-2xl font-black text-slate-900">{data.overall.totalGuests}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase">Total Tepat</p>
              <p className="text-2xl font-black text-emerald-900">{data.overall.tepat}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase">Total Terlambat</p>
              <p className="text-2xl font-black text-amber-900">{data.overall.terlambat}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-bold uppercase">Total Izin</p>
              <p className="text-2xl font-black text-purple-900">{data.overall.izin}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase">Total Sakit</p>
              <p className="text-2xl font-black text-orange-900">{data.overall.sakit}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-rose-600 font-bold uppercase">Total Alpha</p>
              <p className="text-2xl font-black text-rose-900">{data.overall.alpha}</p>
            </div>
          </div>
        </div>

        {/* Individual Guest Stats Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Rekapitulasi Kehadiran Individu</h3>
              <p className="text-sm text-slate-500">Menampilkan jumlah kehadiran setiap tamu di seluruh sesi (Total {data.overall.totalSessions} Sesi Berjalan).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button 
                onClick={exportToExcel}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama tamu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50/50">
            {(() => {
              const filteredGuests = data.guestList
                .filter(g => 
                  g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (g.kelas && g.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .sort((a, b) => a.name.localeCompare(b.name)) // Selalu diurutkan berdasarkan nama (A-Z)
              
              if (filteredGuests.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                    Belum ada data tamu atau pencarian tidak ditemukan.
                  </div>
                );
              }
              
              return (
                <div>
                  {/* Mobile View: Cards */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {filteredGuests.map((guest) => (
                      <div key={guest.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{guest.name}</h4>
                          <div className="flex gap-2 items-center mt-1">
                            {guest.kelas && <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{guest.kelas}</span>}
                            <span className="text-sm text-slate-500 font-mono">{guest.identifier}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Tepat</p>
                            <p className="font-black text-emerald-700 text-lg">{guest.stats.tepat}</p>
                          </div>
                          <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                            <p className="text-[10px] uppercase font-bold text-amber-600 mb-1">Terlambat</p>
                            <p className="font-black text-amber-700 text-lg">{guest.stats.terlambat}</p>
                          </div>
                          <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                            <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Alpha</p>
                            <p className="font-black text-rose-700 text-lg">{guest.stats.alpha}</p>
                          </div>
                          <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex flex-col justify-center items-center">
                            <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Hadir</p>
                            <p className="font-black text-blue-700 text-lg">{guest.stats.percentage}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/50">
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">No</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">Nama Tamu</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700">Kelas</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-center">Tepat</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-center">Terlambat</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-center">Izin</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-center">Sakit</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-center">Alpha</th>
                          <th className="px-4 py-3 text-sm font-bold text-slate-700 text-right">% Hadir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGuests.map((guest, idx) => (
                          <tr key={guest.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{guest.name}</div>
                              <div className="text-xs font-mono text-slate-500 mt-0.5">{guest.identifier}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-bold text-slate-600">
                                {guest.kelas || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg border border-emerald-100 min-w-[40px]">
                                {guest.stats.tepat}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 font-bold text-sm rounded-lg border border-amber-100 min-w-[40px]">
                                {guest.stats.terlambat}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 font-bold text-sm rounded-lg border border-purple-100 min-w-[40px]">
                                {guest.stats.izin}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-orange-50 text-orange-700 font-bold text-sm rounded-lg border border-orange-100 min-w-[40px]">
                                {guest.stats.sakit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2 py-1 bg-rose-50 text-rose-700 font-bold text-sm rounded-lg border border-rose-100 min-w-[40px]">
                                {guest.stats.alpha}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center justify-center px-3 py-1 font-bold text-sm rounded-xl ${
                                guest.stats.percentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                                guest.stats.percentage >= 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {guest.stats.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

      </div>
    </div>
  )
}
