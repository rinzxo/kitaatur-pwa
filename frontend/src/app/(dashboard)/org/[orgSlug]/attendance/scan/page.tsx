'use client'
import toast from 'react-hot-toast'


import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin, Loader2, Calendar, Lock, Upload, CheckCircle2, CheckCircle, FileText, X } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function ScanAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [agendas, setAgendas] = useState<any[]>([])
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>('')
  
  const [pin, setPin] = useState('')
  const [status, setStatus] = useState('present')
  const [notes, setNotes] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const res = await api.get(`/org-attendance/${orgSlug}/agenda`)
        setAgendas(res.data)
        if (res.data.length > 0) {
          setSelectedAgendaId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch agendas', err)
      }
    }
    fetchAgendas()
  }, [orgSlug])

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAgendaId) {
      toast.error('Silakan pilih agenda/sesi terlebih dahulu.')
      return
    }

    if (status === 'present' && pin.length !== 4) {
      toast.error('PIN harus 4 angka.')
      return
    }

    if (status !== 'present' && !proofUrl) {
      toast.error('Bukti surat wajib diunggah.')
      return
    }

    setLoading(true)

    if (status === 'present') {
      setLocationStatus('Mendapatkan lokasi GPS...')
      if (!navigator.geolocation) {
        toast.error('Browser Anda tidak mendukung Geolocation.')
        setLoading(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocationStatus('Mengirim data kehadiran...')
          await submitData(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif dan Anda mengizinkan akses lokasi.')
          setLoading(false)
        },
        { enableHighAccuracy: true }
      )
    } else {
      setLocationStatus('Mengirim data izin/sakit...')
      await submitData(null, null)
    }
  }

  const submitData = async (lat: number | null, lng: number | null) => {
    try {
      const payload = {
        session_id: selectedAgendaId,
        pin: status === 'present' ? pin : undefined,
        status,
        notes,
        proof_url: proofUrl,
        latitude: lat,
        longitude: lng
      }
      const res = await api.post(`/org-attendance/${orgSlug}/scan`, payload)
      
      const successMsg = res.data.message || 'Absen berhasil dicatat!'
      toast.error(successMsg)
      router.push(`/org/${orgSlug}/attendance`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal melakukan check-in.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    if (!selectedAgendaId) return false;
    if (status === 'present') return pin.length === 4;
    return proofUrl !== '';
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
        <header className="mb-6 text-left">
          <Link 
            href={`/org/${orgSlug}/attendance`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Absensi
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckCircle className="h-7 w-7 text-blue-600" />
            Formulir Kehadiran
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-2">
            Pilih agenda yang sesuai dan isi form kehadiran Anda.
          </p>
        </header>

        <form onSubmit={handleCheckIn} className="space-y-5">
          
          {/* PEMILIHAN AGENDA */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Agenda / Sesi</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
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
                className="w-full pl-10"
              />
            </div>
            {agendas.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Tidak ada agenda aktif atau mendatang.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status Kehadiran</label>
            <CustomSelect
              value={status}
              onChange={(val) => {
                setStatus(val);
                if (val === 'present') setProofUrl('');
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
                className="w-full text-center text-4xl tracking-[0.3em] font-black p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                required
              />
              <p className="text-xs text-slate-400 text-center mt-2">Dapatkan PIN dari Sekretaris/Ketua yang sedang bertugas.</p>
            </div>
          )}

          {/* IZIN/SAKIT = CLOUDINARY UPLOAD CUSTOM */}
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

                      // Upload ke Cloudinary lewat API langsung
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
                  <Upload className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">Klik atau Seret File Kesini</span>
                  <span className="text-xs mt-1 text-slate-400">Maksimal 5MB (JPG, PNG, PDF)</span>
                </div>
              ) : (
                <div className="w-full border border-emerald-200 bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-bold text-emerald-700">Bukti Berhasil Diunggah</p>
                      <a href={proofUrl} target="_blank" className="text-xs text-emerald-600 underline truncate block">{proofUrl}</a>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setProofUrl('')}
                    className="text-xs font-bold text-slate-500 hover:text-red-500 px-3 py-1 bg-white border border-slate-200 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <X className="w-3 h-3"/> Ganti
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Surat keterangan dokter dari RS..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none bg-white"
              rows={2}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {locationStatus}
              </>
            ) : (
              <>
                {status === 'present' ? <MapPin className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                Kirim Kehadiran
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
