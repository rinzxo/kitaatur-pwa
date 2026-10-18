'use client'

import toast from 'react-hot-toast'
import { useState, useEffect, Suspense, useMemo } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  CircleNotch, 
  CalendarDots, 
  Lock, 
  UploadSimple, 
  CheckCircle, 
  FileText, 
  X,
  WarningCircle,
  Info
} from '@phosphor-icons/react'
import { CustomSelect } from '@/components/ui/CustomSelect'

function ScanAttendanceContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string

  const querySessionId = searchParams?.get('sessionId') || ''
  const queryStatus = searchParams?.get('status') || 'present'

  const [agendas, setAgendas] = useState<any[]>([])
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(querySessionId)
  
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState(queryStatus === 'excused' || queryStatus === 'sick' ? queryStatus : 'present')
  const [notes, setNotes] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const res = await api.get(`/org-attendance/${orgSlug}/agenda`)
        const agendaList = res.data || []
        setAgendas(agendaList)
        
        if (querySessionId && agendaList.some((a: any) => a.id === querySessionId)) {
          setSelectedAgendaId(querySessionId)
        } else if (agendaList.length > 0 && !selectedAgendaId) {
          // Default to ongoing or first upcoming
          const now = new Date()
          const ongoing = agendaList.find((a: any) => 
            a.is_active && 
            new Date(a.start_time) <= now && 
            new Date(a.end_time) >= now
          )
          setSelectedAgendaId(ongoing?.id || agendaList[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch agendas', err)
      }
    }
    fetchAgendas()
  }, [orgSlug, querySessionId])

  const currentAgenda = useMemo(() => {
    return agendas.find(a => a.id === selectedAgendaId) || null
  }, [agendas, selectedAgendaId])

  const now = new Date()
  const isUpcoming = currentAgenda ? new Date() < new Date(currentAgenda.start_time) : false
  const isOngoing = currentAgenda ? (new Date() >= new Date(currentAgenda.start_time) && new Date() <= new Date(currentAgenda.end_time)) : false

  // If user switched to an upcoming session while on 'present', suggest switching to excused or sick
  useEffect(() => {
    if (isUpcoming && status === 'present' && queryStatus !== 'present') {
      setStatus(queryStatus)
    }
  }, [isUpcoming, queryStatus])

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAgendaId) {
      toast.error('Silakan pilih agenda/sesi terlebih dahulu.')
      return
    }

    if (isUpcoming && status === 'present') {
      toast.error('Sesi ini belum dimulai. Anda hanya dapat mengajukan Izin atau Sakit lebih awal.')
      return
    }

    if (status === 'present' && pin.length !== 4) {
      toast.error('PIN harus 4 angka.')
      return
    }

    if (status !== 'present' && !proofUrl) {
      toast.error('Bukti surat keterangan wajib diunggah.')
      return
    }

    setLoading(true)

    if (status === 'present') {
      setLocationStatus('Mendapatkan lokasi GPS...')
      if (!navigator.geolocation) {
        toast.error('Browser Anda tidak mendukung Geolocation. Mengirim data tanpa GPS...')
        await submitData(null, null, null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationStatus('Mengirim data kehadiran...')
          await submitData(position.coords.latitude, position.coords.longitude, position.coords.accuracy)
        },
        async () => {
          toast.error('Gagal mendapatkan lokasi. Presensi dikirim tanpa data GPS.')
          setLocationStatus('Mengirim data kehadiran (Tanpa GPS)...')
          await submitData(null, null, null)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setLocationStatus('Mengirim pengajuan izin/sakit...')
      await submitData(null, null)
    }
  }

  const submitData = async (lat: number | null, lng: number | null, accuracy: number | null = null) => {
    try {
      const payload = {
        session_id: selectedAgendaId,
        pin: status === 'present' ? pin : undefined,
        status,
        notes,
        proof_url: proofUrl,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy
      }
      const res = await api.post(`/org-attendance/${orgSlug}/scan`, payload)
      
      const successMsg = res.data.message || (status !== 'present' ? 'Pengajuan izin/sakit berhasil dikirim!' : 'Presensi berhasil dicatat!')
      if (res.data?.alreadyRecorded) {
        toast(successMsg, { icon: 'ℹ️' })
      } else {
        toast.success(successMsg)
      }
      router.push(`/org/${orgSlug}/attendance`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Gagal melakukan check-in.')
    } finally {
      setLoading(false)
      setLocationStatus('')
    }
  }

  const isFormValid = () => {
    if (!selectedAgendaId) return false
    if (isUpcoming && status === 'present') return false
    if (status === 'present') return pin.length === 4
    return proofUrl !== ''
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8">
        <header className="mb-6 text-left">
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={14} weight="bold" />
            Kembali ke Presensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle size={30} weight="duotone" className="text-blue-600" />
            Formulir Kehadiran
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-2">
            Pilih agenda yang sesuai dan isi kehadiran atau pengajuan izin/sakit Anda.
          </p>
        </header>

        <form onSubmit={handleCheckIn} className="space-y-5">
          
          {/* PEMILIHAN AGENDA */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Agenda / Sesi</label>
            <div className="relative">
              <CalendarDots size={20} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <CustomSelect
                value={selectedAgendaId}
                onChange={val => setSelectedAgendaId(val)}
                placeholder="-- Pilih Agenda --"
                options={agendas.map(agenda => {
                  const ongoing = new Date() >= new Date(agenda.start_time) && new Date() <= new Date(agenda.end_time)
                  const upcoming = new Date() < new Date(agenda.start_time)
                  return {
                    label: `${agenda.title} (${new Date(agenda.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}) ${ongoing ? ' - Sedang Berjalan' : upcoming ? ' - Mendatang (Bisa Izin/Sakit)' : ' - Selesai'}`,
                    value: agenda.id
                  }
                })}
                className="w-full pl-10"
              />
            </div>
            {agendas.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Tidak ada agenda aktif atau mendatang.</p>
            )}
          </div>

          {/* UPCOMING NOTICE BANNER */}
          {isUpcoming && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
              status === 'present'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              {status === 'present' ? (
                <div className="flex items-start gap-2.5">
                  <WarningCircle size={18} weight="duotone" className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Sesi Ini Belum Dimulai</p>
                    <p className="mt-0.5 text-amber-700">
                      Jadwal mulai: <strong>{new Date(currentAgenda.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>. 
                      Untuk mengajukan izin atau sakit lebih awal, silakan ubah status kehadiran di bawah menjadi <strong>Izin</strong> atau <strong>Sakit</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <FileText size={18} weight="duotone" className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Pengajuan Izin/Sakit Lebih Awal</p>
                    <p className="mt-0.5 text-emerald-700">
                      Anda sedang mengajukan izin/sakit sebelum sesi dimulai. Silakan lampirkan surat keterangan dokter atau bukti izin resmi.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATUS KEHADIRAN */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status Kehadiran</label>
            <CustomSelect
              value={status}
              onChange={(val) => {
                setStatus(val)
                if (val === 'present') setProofUrl('')
              }}
              options={[
                { label: 'Hadir (Membutuhkan PIN & GPS)', value: 'present' },
                { label: 'Izin (Membutuhkan Bukti Surat)', value: 'excused' },
                { label: 'Sakit (Membutuhkan Bukti Surat)', value: 'sick' }
              ]}
              className="w-full"
            />
          </div>

          {/* HADIR = PIN INPUT */}
          {status === 'present' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-1">PIN Kehadiran</label>
              <input 
                type="text" 
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 4921"
                disabled={isUpcoming}
                className="w-full text-center text-4xl tracking-[0.3em] font-black p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                required
              />
              <p className="text-xs text-slate-400 text-center mt-2">
                {isUpcoming 
                  ? 'PIN hanya dapat dimasukkan saat sesi telah dimulai oleh panitia.' 
                  : 'Dapatkan PIN dari Sekretaris/Ketua yang sedang bertugas.'}
              </p>
            </div>
          )}

          {/* IZIN/SAKIT = UPLOAD BUKTI */}
          {status !== 'present' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-1">Bukti Surat (Gambar / PDF)</label>
              
              {!proofUrl ? (
                <div className="relative w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                  <input 
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (file.size > 5000000) {
                        toast.error('Ukuran file maksimal 5MB')
                        return
                      }

                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'demo')

                      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'

                      setLoading(true)
                      setLocationStatus('Mengunggah bukti...')
                      try {
                        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                          method: 'POST',
                          body: formData
                        })
                        const data = await res.json()
                        if (data.secure_url) {
                          setProofUrl(data.secure_url)
                        } else {
                          throw new Error('Upload gagal')
                        }
                      } catch (err) {
                        console.error('Upload Error', err)
                        toast.error('Gagal mengunggah file ke server.')
                      } finally {
                        setLoading(false)
                        setLocationStatus('')
                      }
                    }}
                  />
                  <UploadSimple size={32} weight="duotone" className="mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">Unggah Surat Keterangan / Izin</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF (Maksimal 5MB)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} weight="duotone" className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold">Surat Keterangan Terlampir</p>
                      <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline">
                        Lihat Berkas Terunggah
                      </a>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setProofUrl('')} 
                    className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors"
                  >
                    <X size={15} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Catatan / Alasan</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Mengikuti lomba olimpiade / Surat dokter dari RS..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0087FF] outline-none bg-white text-sm"
              rows={2}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#0087FF] hover:bg-[#0077E6] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95"
          >
            {loading ? (
              <>
                <CircleNotch size={20} weight="bold" className="animate-spin" />
                <span>{locationStatus}</span>
              </>
            ) : isUpcoming && status === 'present' ? (
              <>
                <Clock size={20} weight="duotone" />
                <span>Sesi Belum Dimulai (Pilih Izin/Sakit)</span>
              </>
            ) : status !== 'present' ? (
              <>
                <FileText size={20} weight="duotone" />
                <span>Kirim Pengajuan {status === 'sick' ? 'Sakit' : 'Izin'}</span>
              </>
            ) : (
              <>
                <MapPin size={20} weight="duotone" />
                <span>Kirim Kehadiran</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ScanAttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <CircleNotch size={28} weight="bold" className="animate-spin text-blue-600" />
      </div>
    }>
      <ScanAttendanceContent />
    </Suspense>
  )
}
