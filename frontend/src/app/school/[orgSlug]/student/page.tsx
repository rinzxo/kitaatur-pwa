'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, GraduationCap, CheckCircle, Clock, AlertTriangle, UserCircle, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { CustomUpload } from '@/components/ui/CustomUpload'

export default function EduStudentDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgSlug as string

  const [pin, setPin] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState<any>(null)

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveType, setLeaveType] = useState('izin')
  const [leaveSessionId, setLeaveSessionId] = useState('')
  const [leaveNotes, setLeaveNotes] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [submittingLeave, setSubmittingLeave] = useState(false)
  const [uploadingProofFor, setUploadingProofFor] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    // Check PIN from session storage
    const savedPin = sessionStorage.getItem(`edu_pin_${orgId}`)
    if (!savedPin) {
      toast.error('Sesi berakhir. Silakan masukkan PIN kembali.')
      router.push(`/school/${orgId}`)
    } else {
      setPin(savedPin)
    }
  }, [orgId, router])

  const fetchStudentData = async (id: string, p: string) => {
    setLoading(true)
    setStudentData(null)
    
    try {
      const res = await api.post(`/school/schools/${orgId}/student`, { identifier: id, pin: p })
      setStudentData(res.data.student)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Data siswa tidak ditemukan.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !pin) return
    await fetchStudentData(identifier, pin)
  }

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveSessionId || !leaveType) return
    
    setSubmittingLeave(true)
    try {
      await api.post(`/school/schools/${orgId}/student/leave`, {
        identifier: studentData.identifier,
        type: leaveType,
        session_id: leaveSessionId,
        notes: leaveNotes,
        proof_url: proofUrl
      })
      toast.success('Pengajuan ketidakhadiran berhasil disimpan')
      setShowLeaveModal(false)
      // reset
      setLeaveType('izin')
      setLeaveSessionId('')
      setLeaveNotes('')
      setProofUrl('')
      
      // refresh stats
      await fetchStudentData(identifier, pin)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengajukan absen')
    } finally {
      setSubmittingLeave(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(`edu_pin_${orgId}`)
    router.push(`/school/${orgId}`)
  }

  const handleUploadProof = async (sessionId: string, url: string) => {
    setUploadingProof(true)
    try {
      await api.patch(`/school/schools/${orgId}/student/leave/proof`, {
        identifier: studentData.identifier,
        session_id: sessionId,
        proof_url: url
      })
      toast.success('Surat dokter berhasil diunggah!')
      setUploadingProofFor(null)
      await fetchStudentData(identifier, pin)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengunggah surat')
    } finally {
      setUploadingProof(false)
    }
  }

  if (!pin) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Keluar
            </button>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-black">
            <img src="/icons/KitaEdu.png" alt="KitaAtur School Logo" className="h-8 w-auto object-contain" />
            KitaAtur School
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {!studentData && (
          <div className="mb-8 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300 mt-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Cek Kehadiran</h2>
              <p className="text-sm text-slate-500">Masukkan Nomor Induk (NIM/NISN) atau ID Pelajar untuk melihat rekap kehadiran secara instan.</p>
            </div>
            
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ketik ID Pelajar..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-bold text-slate-900 text-center text-lg placeholder:font-medium placeholder:text-slate-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !identifier}
                className="bg-blue-600 text-white font-bold px-6 py-4 rounded-2xl hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 w-full"
              >
                Cari Data
              </button>
            </form>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-500 font-medium">Mencari data siswa...</p>
          </div>
        )}

        {studentData && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-500 ml-2">Menampilkan hasil untuk: <strong className="text-slate-900">{studentData.identifier}</strong></span>
              <button 
                onClick={() => {
                  setStudentData(null)
                  setIdentifier('')
                }}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-4 py-2 rounded-xl transition-all text-sm"
              >
                <Search className="w-4 h-4" /> Cari Data Lain
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <UserCircle className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 mb-1">{studentData.name}</h1>
                <p className="text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-md inline-block text-sm">ID: {studentData.identifier}</p>
              </div>
            </div>

            {(() => {
              const activeSession = studentData.history?.find((h: any) => h.is_active);
              if (!activeSession) return null;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                      Sesi Aktif Saat Ini: {activeSession.title}
                    </h3>
                    <p className="text-sm text-blue-800">
                      Status Anda: <strong className="uppercase bg-blue-200 px-2 py-0.5 rounded text-blue-900">
                        {activeSession.status === 'present' ? 'Hadir' : activeSession.status === 'late' ? 'Terlambat' : activeSession.status}
                      </strong>
                    </p>
                  </div>
                  {activeSession.status === 'alpha' && (
                    <button 
                      onClick={() => setShowLeaveModal(true)}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
                    >
                      Ajukan Ketidakhadiran
                    </button>
                  )}
                </div>
              )
            })()}

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase mb-2 truncate">Persentase</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.percentage}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1 truncate" title="Tepat Waktu"><CheckCircle className="w-3 h-3 flex-shrink-0"/> Tepat Waktu</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.tepat}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Kali hadir</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase mb-2 flex items-center gap-1 truncate" title="Terlambat"><Clock className="w-3 h-3 flex-shrink-0"/> Terlambat</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.terlambat}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Kali hadir</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1 truncate" title="Izin"><AlertTriangle className="w-3 h-3 flex-shrink-0"/> Izin</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.izin}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Kali izin</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase mb-2 flex items-center gap-1 truncate" title="Sakit"><AlertTriangle className="w-3 h-3 flex-shrink-0"/> Sakit</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.sakit}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Kali sakit</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase mb-2 flex items-center gap-1 truncate" title="Alpha (Alpa)"><AlertTriangle className="w-3 h-3 flex-shrink-0"/> Alpha (Alpa)</p>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">{studentData.stats.alpha}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 truncate">Kali tidak hadir</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-100 p-4 rounded-2xl text-center flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500 text-left">Statistik di atas dihitung berdasarkan total <span className="font-bold text-slate-700">{studentData.stats.total_sessions} sesi absensi</span> yang wajib diikuti oleh siswa sejak terdaftar di sistem.</p>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all whitespace-nowrap"
              >
                Ajukan Ketidakhadiran
              </button>
            </div>

            {studentData.history && studentData.history.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Riwayat Kehadiran Sesi</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {studentData.history.map((h: any) => (
                    <div key={h.session_id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {h.status === 'present' && <span className="text-[11px] font-bold px-2 py-1 rounded uppercase bg-emerald-100 text-emerald-700">Hadir</span>}
                          {h.status === 'late' && <span className="text-[11px] font-bold px-2 py-1 rounded uppercase bg-amber-100 text-amber-700">Terlambat</span>}
                          {h.status === 'izin' && <span className="text-[11px] font-bold px-2 py-1 rounded uppercase bg-purple-100 text-purple-700">Izin</span>}
                          {h.status === 'sakit' && <span className="text-[11px] font-bold px-2 py-1 rounded uppercase bg-orange-100 text-orange-700">Sakit</span>}
                          {h.status === 'alpha' && <span className="text-[11px] font-bold px-2 py-1 rounded uppercase bg-rose-100 text-rose-700">Alpha</span>}

                          <span className="text-sm font-bold text-slate-700">
                            {h.title}
                          </span>
                          {h.is_active && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">AKTIF</span>
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          Sesi dimulai: {new Date(h.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        
                        {h.check_in_time && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> 
                            {(h.status === 'present' || h.status === 'late') ? 'Waktu Check-in: ' : 'Waktu Pengajuan: '} 
                            {new Date(h.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        
                        {h.notes && <p className="text-sm text-slate-600 mt-3 bg-white p-3 rounded-xl border border-slate-200">{h.notes}</p>}
                        
                        {h.status === 'sakit' && !h.proof_url && (
                          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded w-fit">
                            <AlertTriangle className="w-3 h-3" /> Menunggu surat dokter (maks 1x24 jam).
                          </p>
                        )}
                      </div>
                      
                      <div>
                        {h.proof_url ? (
                          <button onClick={() => setViewProofUrl(h.proof_url)} className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors inline-block whitespace-nowrap">Lihat Bukti</button>
                        ) : (
                          h.status === 'sakit' ? (
                            uploadingProofFor === h.session_id ? (
                              <div className="space-y-2 min-w-[200px]">
                                <CustomUpload
                                  onUpload={(url) => handleUploadProof(h.session_id, url)}
                                  label={uploadingProof ? 'Mengunggah...' : 'Upload Surat Dokter'}
                                  className="!p-3 border-dashed border-2 rounded-xl text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setUploadingProofFor(null)}
                                  className="text-xs text-slate-500 hover:text-slate-700 w-full text-center"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUploadingProofFor(h.session_id)}
                                className="text-xs font-bold bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                              >
                                Upload Surat Sakit
                              </button>
                            )
                          ) : null
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showLeaveModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black text-slate-900 mb-1">Ajukan Ketidakhadiran</h3>
              <p className="text-sm text-slate-500 mb-6">Untuk siswa {studentData?.name}</p>
              
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipe Izin</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer border-2 p-3 rounded-xl flex items-center gap-2 transition-all ${leaveType === 'izin' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="type" value="izin" checked={leaveType === 'izin'} onChange={() => setLeaveType('izin')} className="hidden" />
                      <span className="font-bold text-sm mx-auto">Izin Biasa</span>
                    </label>
                    <label className={`cursor-pointer border-2 p-3 rounded-xl flex items-center gap-2 transition-all ${leaveType === 'sakit' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="type" value="sakit" checked={leaveType === 'sakit'} onChange={() => setLeaveType('sakit')} className="hidden" />
                      <span className="font-bold text-sm mx-auto">Sakit</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Sesi</label>
                  
                  {/* Custom Select Button */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full p-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium flex justify-between items-center cursor-pointer bg-white transition-all ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className={leaveSessionId ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}>
                      {leaveSessionId 
                        ? (() => {
                            const selected = studentData?.sessions?.find((s: any) => s.id === leaveSessionId);
                            return selected ? `${selected.title} (${new Date(selected.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })})` : '-- Pilih Sesi --';
                          })()
                        : '-- Pilih Sesi --'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Custom Dropdown List */}
                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close dropdown when clicking outside */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                      
                      <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-slate-50">
                        {(() => {
                          const activeSessions = studentData?.sessions?.filter((s: any) => {
                            if (!s.is_active) return false;
                            const sessionDate = new Date(s.start_time);
                            const today = new Date();
                            return sessionDate.getDate() === today.getDate() &&
                                   sessionDate.getMonth() === today.getMonth() &&
                                   sessionDate.getFullYear() === today.getFullYear();
                          });

                          if (!activeSessions || activeSessions.length === 0) {
                            return <div className="p-4 text-sm text-slate-500 text-center font-medium">Tidak ada sesi aktif hari ini</div>;
                          }

                          return activeSessions.map((s: any) => (
                            <div 
                              key={s.id} 
                              onClick={() => {
                                setLeaveSessionId(s.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`p-3.5 cursor-pointer transition-colors flex flex-col gap-1 relative overflow-hidden ${leaveSessionId === s.id ? 'bg-blue-50/80' : 'hover:bg-slate-50'}`}
                            >
                              {leaveSessionId === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>}
                              <span className={`text-sm ${leaveSessionId === s.id ? 'text-blue-700 font-bold' : 'text-slate-700 font-bold'}`}>{s.title}</span>
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(s.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Catatan / Keterangan</label>
                  <textarea value={leaveNotes} onChange={(e) => setLeaveNotes(e.target.value)} rows={2} placeholder="Alasan ketidakhadiran..." className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Bukti Surat (Opsional)</label>
                  {leaveType === 'sakit' && (
                    <p className="text-xs text-orange-600 mb-2 font-medium bg-orange-50 p-2 rounded-lg">Jika Anda belum memiliki surat dokter, Anda dapat mengunggahnya nanti (maks 1x24 jam sebelum otomatis menjadi Izin biasa).</p>
                  )}
                  {proofUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 inline-block w-full text-center p-2 bg-slate-50">
                      <img src={proofUrl} alt="Bukti" className="h-32 w-auto object-contain mx-auto" />
                      <button type="button" onClick={() => setProofUrl('')} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <CustomUpload onUpload={setProofUrl} label="Upload Surat (JPG/PNG)" className="!p-4 border-dashed border-2 rounded-xl" />
                  )}
                </div>

                <button type="submit" disabled={submittingLeave || !leaveSessionId} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 mt-2">
                  {submittingLeave ? 'Menyimpan...' : 'Kirim Pengajuan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {viewProofUrl && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200" onClick={() => setViewProofUrl(null)}>
            {/* Header / Top Bar */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-10" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-medium text-sm drop-shadow-md">Bukti Surat</h3>
              <button 
                onClick={() => setViewProofUrl(null)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 w-full h-full pt-16" onClick={e => e.stopPropagation()}>
              <img 
                src={viewProofUrl} 
                alt="Bukti Surat" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
