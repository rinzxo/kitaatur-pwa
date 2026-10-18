'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  Coins, 
  CalendarDots as CalendarDays, 
  Users, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Copy,
  WhatsappLogo,
  CircleNotch,
  CheckCircle,
  Clock
} from '@phosphor-icons/react'

interface QuickOnboardingWizardProps {
  orgSlug: string
  orgName: string
  currentDuesTarget?: number
  onCompleted: () => void
  onDismiss: () => void
}

export default function QuickOnboardingWizard({
  orgSlug,
  orgName,
  currentDuesTarget = 0,
  onCompleted,
  onDismiss
}: QuickOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Dues / Kas
  const [selectedDuesPreset, setSelectedDuesPreset] = useState<number | 'custom' | 'none'>(
    currentDuesTarget > 0 ? currentDuesTarget : 10000
  )
  const [customDuesAmount, setCustomDuesAmount] = useState<string>(
    currentDuesTarget > 0 ? String(currentDuesTarget) : '10000'
  )

  // Step 2: Schedule
  const [selectedDay, setSelectedDay] = useState<number>(5) // Default Jumat (5)
  const [startTime, setStartTime] = useState<string>('15:30')
  const [endTime, setEndTime] = useState<string>('17:30')
  const [skipSchedule, setSkipSchedule] = useState<boolean>(false)

  // Step 3: Invite Code
  const [inviteCode, setInviteCode] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  const daysList = [
    { id: 1, label: 'Senin' },
    { id: 2, label: 'Selasa' },
    { id: 3, label: 'Rabu' },
    { id: 4, label: 'Kamis' },
    { id: 5, label: 'Jumat' },
    { id: 6, label: 'Sabtu' },
    { id: 0, label: 'Minggu' },
  ]

  const duesOptions = [
    { id: '2k_week', label: 'Rp 2.000 / minggu', value: 8000, desc: '~Rp 8.000 / bln' },
    { id: '5k_week', label: 'Rp 5.000 / minggu', value: 20000, desc: '~Rp 20.000 / bln' },
    { id: '10k_month', label: 'Rp 10.000 / bulan', value: 10000, desc: 'Paling Populer di Ekskul' },
    { id: '20k_month', label: 'Rp 20.000 / bulan', value: 20000, desc: 'Untuk Ekskul Aktif' },
  ]

  // Fetch invite code
  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const res = await api.get(`/org/${orgSlug}/invite-code`)
        if (res.data?.invite_code) {
          setInviteCode(res.data.invite_code)
        }
      } catch (err) {
        console.error('Failed to fetch invite code', err)
      }
    }
    fetchInviteCode()
  }, [orgSlug])

  // Submit Step 1: Kas
  const handleSaveDues = async () => {
    setLoading(true)
    try {
      let finalTarget = 0
      let presets = '5000,10000,20000,50000'

      if (selectedDuesPreset === 'none') {
        finalTarget = 0
      } else if (selectedDuesPreset === 'custom') {
        finalTarget = parseInt(customDuesAmount.replace(/\D/g, ''), 10) || 0
      } else {
        finalTarget = selectedDuesPreset
      }

      if (finalTarget > 0) {
        presets = `${Math.round(finalTarget / 2)},${finalTarget},${finalTarget * 2},${finalTarget * 5}`
      }

      await api.patch(`/org/${orgSlug}/settings`, {
        dues_target_amount: finalTarget,
        dues_presets: presets
      })

      toast.success(finalTarget > 0 ? `Target uang kas diatur ke Rp ${new Intl.NumberFormat('id-ID').format(finalTarget)}` : 'Uang kas dilewati sementara.')
      setCurrentStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengaturan uang kas.')
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 2: Schedule
  const handleSaveSchedule = async () => {
    if (skipSchedule) {
      setCurrentStep(3)
      return
    }

    setLoading(true)
    try {
      await api.post(`/org-schedule/${orgSlug}`, {
        title: `Latihan / Kumpul Rutin ${orgName}`,
        days_of_week: [selectedDay],
        start_time: startTime,
        end_time: endTime,
        session_type: 'in_only',
        latitude: 0,
        longitude: 0,
        radius_meters: 50
      })

      const dayName = daysList.find(d => d.id === selectedDay)?.label || 'Mingguan'
      toast.success(`Jadwal presensi otomatis berhasil dibuat setiap hari ${dayName}!`)
      setCurrentStep(3)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal membuat jadwal otomatis.')
    } finally {
      setLoading(false)
    }
  }

  // Submit Step 3: Done
  const handleFinish = () => {
    localStorage.setItem(`kitaatur_onboarding_completed_${orgSlug}`, 'true')
    toast.success('Setup organisasi selesai! Selamat mengelola!')
    onCompleted()
  }

  const inviteUrl = typeof window !== 'undefined' && inviteCode 
    ? `${window.location.origin}/auth/join?code=${inviteCode}`
    : ''

  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Link undangan berhasil disalin!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    if (!inviteUrl) return
    const text = encodeURIComponent(
      `Halo teman-teman pengurus & anggota *${orgName}*!\n\nYuk bergabung ke workspace resmi organisasi kita di KitaAtur untuk pencatatan uang kas dan presensi kegiatan:\n${inviteUrl}\n\nTerima kasih!`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/70 to-blue-50/40 border border-blue-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Decorative ambient gradients */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#01C4FB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#0087FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/70">
        <div>
          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Panduan Memulai</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Setup Kilat Organisasi {orgName}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Selesaikan 3 langkah mudah ini dalam 1 menit agar sistem kas dan absensi siap pakai.
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="self-end sm:self-center text-xs font-bold text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
        >
          <X size={14} weight="bold" />
          <span>Nanti Saja</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative z-10 grid grid-cols-3 gap-2 mb-8">
        {[
          { step: 1, title: '1. Uang Kas', icon: Coins },
          { step: 2, title: '2. Jadwal Rutin', icon: CalendarDays },
          { step: 3, title: '3. Undang Anggota', icon: Users },
        ].map(item => {
          const isCurrent = currentStep === item.step
          const isDone = currentStep > item.step
          const Icon = item.icon

          return (
            <div 
              key={item.step}
              className={`p-2.5 md:p-3 rounded-2xl border transition-all flex items-center gap-2 ${
                isCurrent 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white/80 text-slate-400 border-slate-200'
              }`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                isCurrent ? 'bg-white/20 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {isDone ? <Check size={14} weight="bold" /> : <Icon size={14} weight="bold" />}
              </div>
              <span className="text-xs font-bold truncate hidden sm:inline">
                {item.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* STEP 1: ATUR UANG KAS */}
      {currentStep === 1 && (
        <div className="relative z-10 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Coins size={20} className="text-amber-500" weight="duotone" />
              <span>Berapa target iuran uang kas per anggota?</span>
            </h3>
            <p className="text-xs text-slate-500">
              Pengurus dan anggota dapat melihat status pembayaran dan tunggakan kas secara transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {duesOptions.map(opt => {
              const isSelected = selectedDuesPreset === opt.value
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedDuesPreset(opt.value)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {opt.desc}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check size={12} weight="bold" />}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedDuesPreset('custom')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                selectedDuesPreset === 'custom' 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Kustom Nominal Lainnya
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuesPreset('none')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                selectedDuesPreset === 'none' 
                  ? 'border-slate-800 bg-slate-900 text-white' 
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Belum Ada Uang Kas (Lewati)
            </button>
          </div>

          {selectedDuesPreset === 'custom' && (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl animate-in fade-in">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Masukkan Nominal Kas per Bulan (Rp)
              </label>
              <input
                type="number"
                value={customDuesAmount}
                onChange={e => setCustomDuesAmount(e.target.value)}
                placeholder="Contoh: 15000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveDues}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? <CircleNotch size={16} className="animate-spin" /> : <span>Lanjut ke Jadwal Rutin</span>}
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ATUR JADWAL RUTIN */}
      {currentStep === 2 && (
        <div className="relative z-10 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-500" weight="duotone" />
              <span>Kapan jadwal latihan / kumpul rutin organisasi?</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sistem akan otomatis membuka sesi presensi mingguan sesuai jadwal ini sehingga pengurus tidak perlu membuka sesi manual setiap saat.
            </p>
          </div>

          {!skipSchedule ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Pilih Hari Kumpul:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {daysList.map(d => {
                    const isSelected = selectedDay === d.id
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDay(d.id)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600/30' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>Jam Mulai</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>Jam Selesai</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-600 font-medium">
              Jadwal otomatis dilewati. Anda dapat membuat sesi presensi secara mandiri kapan saja dari menu Modul Presensi.
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setSkipSchedule(!skipSchedule)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              {skipSchedule ? 'Gunakan Jadwal Rutin' : 'Lewati Jadwal (Buat Manual Nanti)'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? <CircleNotch size={16} className="animate-spin" /> : <span>Lanjut ke Undang Anggota</span>}
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: UNDANG ANGGOTA */}
      {currentStep === 3 && (
        <div className="relative z-10 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Users size={20} className="text-emerald-500" weight="duotone" />
              <span>Ajak Anggota Masuk ke Organisasi</span>
            </h3>
            <p className="text-xs text-slate-500">
              Bagikan link undangan ini ke grup WhatsApp ekstrakurikuler/organisasi agar anggota dapat bergabung secara instan.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-600 block">
              Tautan Undangan WhatsApp:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl || 'Memuat link...'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
              >
                {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <WhatsappLogo size={18} weight="fill" />
              <span>Bagikan Langsung ke Grup WhatsApp</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed font-medium">
            <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" weight="fill" />
            <p>
              <strong>Tips untuk Sekolah:</strong> Siswa tidak wajib memegang HP saat jam kumpul. Sekretaris cukup membuka menu <strong>Bantu Absen (1 HP)</strong> untuk mendata kehadiran siswa sekaligus dalam hitungan detik.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <CheckCircle size={18} weight="bold" />
              <span>Selesai & Masuk Dashboard</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
