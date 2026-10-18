'use client'

import toast from 'react-hot-toast'
import { useState, useEffect, useMemo, useRef, Suspense, Fragment } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { 
  ArrowLeft, 
  Plus, 
  CalendarDots as Calendar, 
  Clock, 
  MapPin, 
  Trash as Trash2, 
  Power, 
  Users, 
  CheckCircle as CheckCircle2, 
  QrCode, 
  PlayCircle, 
  WarningCircle as AlertCircle, 
  MagnifyingGlass as Search, 
  ShieldCheck, 
  Key as KeyRound, 
  ArrowClockwise as RotateCw, 
  CircleNotch as Loader2, 
  Check, 
  Lock, 
  CaretRight as ChevronRight, 
  CalendarDots as CalendarDays,
  X,
  Eye,
  ChartBar as BarChart2,
  Checks as CheckCheck,
  XCircle,
  FileDoc as FileCheck2,
  ArrowRight,
  Compass,
  Camera,
  CameraRotate,
  IdentificationCard,
  Bell,
  BellSlash,
  Sparkle
} from '@phosphor-icons/react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

interface SessionMember {
  id: string
  profile_id: string
  organization_id: string
  role: string
  profile: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  organization?: {
    name: string
  }
  attendance?: {
    id: string
    status: 'present' | 'late' | 'excused' | 'sick' | 'absent'
    check_in_time: string | null
    check_out_time: string | null
    notes: string | null
  } | null
}

interface ValidationRecord {
  id: string
  session_id: string
  profile_id: string
  status: 'present' | 'late' | 'excused' | 'sick' | 'absent'
  check_in_time: string
  check_out_time: string | null
  proof_url: string | null
  notes: string | null
  profile?: {
    full_name: string | null
    email: string
    avatar_url?: string | null
  }
  session?: {
    title: string
    session_type: string
  }
}

function AttendanceManagementContent() {
  const confirm = useConfirm()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params?.orgSlug as string

  // Main Tabs: 'sessions' | 'izin' | 'schedules'
  const initialTab = (searchParams.get('tab') as 'sessions' | 'izin' | 'schedules') || 'sessions'
  const [mainTab, setMainTab] = useState<'sessions' | 'izin' | 'schedules'>(initialTab)

  // -------------------------------------------------------------
  // TAB 1: SESSIONS STATE
  // -------------------------------------------------------------
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sessionSubTab, setSessionSubTab] = useState<'ongoing' | 'upcoming' | 'past'>('ongoing')

  // -------------------------------------------------------------
  // TAB 2: BANTU ABSEN & SCAN QR STATE
  // -------------------------------------------------------------
  // Sub-view: 'scan' (Scan QR Kamera) | 'manual' (Daftar Roll-Call 1 HP) | 'validation' (Validasi Bukti AI)
  const initialMode = searchParams.get('mode')
  const initialIzinSubTab: 'scan' | 'manual' | 'validation' = 
    initialMode === 'manual'
      ? 'manual'
      : initialMode === 'validation'
      ? 'validation'
      : initialMode === 'scan'
      ? 'scan'
      : (searchParams.get('sessionId') ? 'manual' : 'scan')

  const [izinSubTab, setIzinSubTab] = useState<'scan' | 'manual' | 'validation'>(initialIzinSubTab)

  // Scanner State for Sub-view: Scan QR Kamera
  const [scanLoading, setScanLoading] = useState(false)
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [manualTokenInput, setManualTokenInput] = useState('')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [recentScans, setRecentScans] = useState<Array<{
    id: string
    name: string
    time: string
    status: 'present' | 'late' | 'checkout' | 'guest'
    role?: string
    message: string
  }>>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // State for Sub-view: Validation
  const [validationRecords, setValidationRecords] = useState<ValidationRecord[]>([])
  const [loadingValidation, setLoadingValidation] = useState(false)
  const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [validationSearch, setValidationSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)
  const [selectedPreviewRecord, setSelectedPreviewRecord] = useState<ValidationRecord | null>(null)
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null)
  const [aiValidationResults, setAiValidationResults] = useState<Record<string, { is_valid: boolean; summary: string; confidence: string }>>({})

  // State for Sub-view: Bantu Absen (Manual)
  const [agendas, setAgendas] = useState<any[]>([])
  const [selectedAgendaId, setSelectedAgendaId] = useState<string>(searchParams.get('sessionId') || '')
  const [members, setMembers] = useState<SessionMember[]>([])
  const [pin, setPin] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIzinFilter, setActiveIzinFilter] = useState<'unmarked' | 'attended' | 'excused' | 'all'>('unmarked')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const pinInputRef = useRef<HTMLInputElement>(null)

  // -------------------------------------------------------------
  // TAB 3: SCHEDULES (JADWAL OTOMATIS) STATE
  // -------------------------------------------------------------
  const [schedules, setSchedules] = useState<any[]>([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)

  // -------------------------------------------------------------
  // SPOTLIGHT WALKTHROUGH TOUR STATE
  // -------------------------------------------------------------
  const [showTour, setShowTour] = useState(false)

  const tourSteps: TourStep[] = useMemo(() => {
    if (mainTab === 'izin') {
      return [
        {
          target: '[data-tour="tour-izin-switcher"]',
          title: '3 Mode Pusat Presensi & Bantu Absen',
          description: 'Pilih antara Scan QR Kamera (pindai langsung kartu QR siswa), Daftar Roll-Call (1-klik hadir semua per siswa), atau Validasi Bukti (surat dokter/izin).'
        },
        {
          target: '[data-tour="tour-agenda-select"]',
          title: 'Pilih Sesi Kegiatan',
          description: 'Pilih sesi kegiatan yang sedang berjalan atau agenda mendatang. Anda dapat langsung mencatat Izin atau Sakit untuk siswa sebelum acara dimulai.'
        },
        {
          target: '[data-tour="tour-bulk-checkin"]',
          title: 'Tandai Hadir Semua (1-Klik)',
          description: 'Cukup 1-klik untuk langsung menandai seluruh siswa yang belum absen menjadi Hadir dalam 1 detik tanpa perlu memasukkan PIN sesi.'
        },
        {
          target: '[data-tour="tour-member-status-actions"]',
          title: 'Ubah Status Per Anggota',
          description: 'Bila ada siswa yang telat, sakit, izin, atau alpa, klik status bersangkutan secara langsung pada baris siswa secara instan.'
        }
      ]
    }

    return [
      {
        target: '[data-tour="tour-main-tabs"]',
        title: '3 Tab Pusat Presensi',
        description: 'Kelola Sesi (daftar rapat & latihan), Bantu Absen & Scan QR (scanner HP, roll-call cepat 1 HP, & validasi surat), serta Jadwal Otomatis mingguan.'
      },
      {
        target: '[data-tour="tour-create-session"]',
        title: 'Buka Sesi Presensi Instan',
        description: 'Buka sesi kegiatan baru dalam 15 detik dengan durasi otomatis tanpa kendala sinyal GPS.'
      },
      {
        target: '[data-tour="tour-izin-tab-btn"]',
        title: 'Bantu Absen & Scan QR (1 HP)',
        description: 'Pengurus cukup membuka tab ini untuk scan QR siswa atau roll-call presensi seluruh anggota di tempat tanpa siswa wajib bawa HP.'
      },
      {
        target: '[data-tour="tour-tools-hub"]',
        title: 'Alat Presensi Terintegrasi',
        description: 'Akses cepat scanner mandiri QR, pencatatan data tamu/siswa luar, serta analitik grafik kedisiplinan organisasi.'
      }
    ]
  }, [mainTab])

  // Sync tab with URL
  const switchTab = (tab: 'sessions' | 'izin' | 'schedules', extraParam?: string) => {
    setMainTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    if (extraParam) {
      url.searchParams.set('sessionId', extraParam)
    } else if (tab !== 'izin') {
      url.searchParams.delete('sessionId')
      url.searchParams.delete('mode')
    }
    window.history.replaceState({}, '', url.toString())
    if (tab === 'izin') {
      fetchMembers(false)
      fetchValidationRecords()
    }
  }

  // Switch subtab for Tab 2 (Scan, Manual, Validation)
  const switchSubTab = (mode: 'scan' | 'manual' | 'validation') => {
    setIzinSubTab(mode)
    const url = new URL(window.location.href)
    url.searchParams.set('mode', mode)
    window.history.replaceState({}, '', url.toString())
    if (mode === 'manual' || mode === 'scan') {
      fetchMembers(false)
    }
    if (mode === 'validation') {
      fetchValidationRecords()
    }
  }

  // -------------------------------------------------------------
  // FETCHERS
  // -------------------------------------------------------------
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true)
      const res = await api.get(`/org-attendance/${orgSlug}/sessions`)
      setSessions(res.data || [])
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Akses ditolak: Hanya Ketua & Sekretaris.')
        router.push(`/org/${orgSlug}/attendance`)
      }
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchValidationRecords = async () => {
    try {
      setLoadingValidation(true)
      const res = await api.get(`/org-attendance/${orgSlug}`)
      const all: any[] = res.data || []
      const filtered = all.filter((r: any) => r.status === 'excused' || r.status === 'sick' || r.status === 'absent')
      setValidationRecords(filtered)
    } catch (err: any) {
      console.error('Failed to fetch validation records:', err)
    } finally {
      setLoadingValidation(false)
    }
  }

  const fetchAgendas = async () => {
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/agenda`)
      const agendaList = res.data || []
      setAgendas(agendaList)

      if (agendaList.length > 0) {
        if (!selectedAgendaId) {
          const now = new Date()
          const ongoing = agendaList.find((a: any) => 
            a.is_active && 
            new Date(a.start_time) <= now && 
            new Date(a.end_time) >= now
          )
          const firstActive = agendaList.find((a: any) => a.is_active)
          const chosen = ongoing || firstActive || agendaList[0]
          setSelectedAgendaId(chosen.id)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch agendas', err)
    }
  }

  const fetchMembers = async (showSpinner = true) => {
    if (!selectedAgendaId) return
    if (showSpinner) setLoadingMembers(true)
    try {
      const res = await api.get(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/members`)
      setMembers(res.data || [])
    } catch (err: any) {
      toast.error('Gagal memuat anggota sesi')
    } finally {
      if (showSpinner) setLoadingMembers(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true)
      const res = await api.get(`/org-schedule/${orgSlug}`)
      setSchedules(res.data || [])
    } catch (err: any) {
      console.error('Failed to fetch schedules', err)
    } finally {
      setLoadingSchedules(false)
    }
  }

  // Initial Load
  useEffect(() => {
    if (!orgSlug) return
    fetchSessions()
    fetchValidationRecords()
    fetchAgendas()
    fetchSchedules()
  }, [orgSlug])

  // When selectedAgendaId changes, fetch PIN and members
  useEffect(() => {
    if (!selectedAgendaId) return
    const cachedPin = localStorage.getItem(`kitaatur_bantu_absen_pin_${selectedAgendaId}`) || ''
    setPin(cachedPin)
    fetchMembers(true)
  }, [selectedAgendaId])

  const handlePinChange = (val: string) => {
    setPin(val)
    if (selectedAgendaId) {
      if (val) {
        localStorage.setItem(`kitaatur_bantu_absen_pin_${selectedAgendaId}`, val)
      } else {
        localStorage.removeItem(`kitaatur_bantu_absen_pin_${selectedAgendaId}`)
      }
    }
  }

  // -------------------------------------------------------------
  // TAB 1 (SESSIONS) HELPERS
  // -------------------------------------------------------------
  const now = new Date()
  const ongoingSessions = useMemo(() => sessions.filter(s => s.is_active && new Date(s.start_time) <= now && new Date(s.end_time) >= now), [sessions])
  const upcomingSessions = useMemo(() => sessions.filter(s => s.is_active && new Date(s.start_time) > now), [sessions])
  const pastSessions = useMemo(() => sessions.filter(s => !s.is_active || new Date(s.end_time) < now), [sessions])

  // -------------------------------------------------------------
  // TAB 2 (IZIN & SAKIT - VALIDASI BUKTI) ACTIONS & HELPERS
  // -------------------------------------------------------------
  const validationStats = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0

    validationRecords.forEach(r => {
      const isValidated = r.notes?.includes('[VALIDATED]')
      if (r.status === 'absent') {
        rejected++
      } else if (isValidated) {
        approved++
      } else {
        pending++
      }
    })

    return {
      total: validationRecords.length,
      pending,
      approved,
      rejected
    }
  }, [validationRecords])

  const filteredValidationRecords = useMemo(() => {
    const q = validationSearch.toLowerCase().trim()
    return validationRecords.filter(r => {
      const name = (r.profile?.full_name || '').toLowerCase()
      const email = (r.profile?.email || '').toLowerCase()
      const sessionTitle = (r.session?.title || '').toLowerCase()
      const cleanNotes = (r.notes || '').replace(/\[VALIDATED\]|\[MANUAL_BY_ADMIN[^\]]*\]/g, '').toLowerCase()
      
      const matchSearch = !q || name.includes(q) || email.includes(q) || sessionTitle.includes(q) || cleanNotes.includes(q)
      if (!matchSearch) return false

      const isValidated = r.notes?.includes('[VALIDATED]')
      if (validationFilter === 'pending') {
        return !isValidated && r.status !== 'absent'
      }
      if (validationFilter === 'approved') {
        return isValidated && r.status !== 'absent'
      }
      if (validationFilter === 'rejected') {
        return r.status === 'absent'
      }
      return true
    })
  }, [validationRecords, validationSearch, validationFilter])

  const handleApproveRecord = async (recordId: string) => {
    const ok = await confirm({
      title: 'Setujui Surat Izin / Sakit',
      message: 'Apakah Anda yakin ingin menyetujui surat izin/sakit ini?',
      confirmText: 'Ya, Setujui',
      variant: 'success'
    })
    if (!ok) return
    setActionLoadingId(recordId)
    try {
      await api.put(`/org-attendance/${orgSlug}/attendance/${recordId}/validate`)
      toast.success('Pengajuan izin/sakit berhasil disetujui.')
      setValidationRecords(prev => prev.map(r => {
        if (r.id === recordId) {
          const cur = r.notes || ''
          const updated = cur.includes('[VALIDATED]') ? cur : `${cur} [VALIDATED]`.trim()
          return { ...r, notes: updated }
        }
        return r
      }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyetujui izin.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectRecord = async (recordId: string) => {
    const ok = await confirm({
      title: 'Tolak Surat Izin / Sakit',
      message: 'Tolak izin/sakit ini dan ubah status kehadiran anggota menjadi Alpa?',
      confirmText: 'Tolak & Jadikan Alpa',
      variant: 'danger'
    })
    if (!ok) return
    setActionLoadingId(recordId)
    try {
      await api.put(`/org-attendance/${orgSlug}/attendance/${recordId}/status`, { status: 'absent' })
      toast.success('Pengajuan ditolak dan status diubah menjadi Alpa.')
      setValidationRecords(prev => prev.map(r => {
        if (r.id === recordId) {
          return { ...r, status: 'absent' }
        }
        return r
      }))
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menolak izin.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleValidateWithAi = async (record: ValidationRecord) => {
    if (!record.proof_url) {
      toast.error('Tidak ada gambar bukti surat untuk diperiksa.')
      return
    }
    setAiLoadingId(record.id)
    try {
      const res = await api.post(`/org-attendance/${orgSlug}/validate-proof`, {
        attendanceId: record.id
      })
      if (res.data) {
        setAiValidationResults(prev => ({
          ...prev,
          [record.id]: res.data
        }))
        const statusText = res.data.is_valid ? 'Valid / Resmi' : 'Perlu Ditinjau Ulang'
        toast.success(`Analisis AI Selesai: Dokumen ${statusText} (Kepercayaan: ${res.data.confidence || 'Sedang'})`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memvalidasi bukti dengan AI.')
    } finally {
      setAiLoadingId(null)
    }
  }

  // -------------------------------------------------------------
  // TAB 2 (BANTU ABSEN & SCAN QR) ACTIONS & HELPERS
  // -------------------------------------------------------------
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.16)
    } catch (e) {}
  }

  const processQRToken = async (qrToken: string) => {
    if (!selectedAgendaId) {
      toast.error('Pilih sesi kegiatan terlebih dahulu!')
      return
    }
    if (scanLoading) return

    setScanLoading(true)
    setLastScannedToken(qrToken)

    try {
      const res = await api.post(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/scan`, {
        qrToken
      })

      if (soundEnabled) {
        playBeep()
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([80, 40, 80]) } catch (e) {}
      }

      const attendeeName = res.data.member?.name || res.data.guest?.name || res.data.attendeeName || 'Peserta'
      const isCheckOut = !!res.data.isCheckOut
      const isAlready = !!res.data.alreadyRecorded
      const status: 'present' | 'late' | 'checkout' | 'guest' = isCheckOut 
        ? 'checkout' 
        : res.data.attendeeType === 'guest' 
        ? 'guest' 
        : (res.data.data?.status || 'present')

      if (isAlready) {
        toast(res.data.message || `${attendeeName} sudah tercatat sebelumnya`, { icon: 'ℹ️' })
      } else {
        toast.success(res.data.message || `Check-in berhasil: ${attendeeName}`)
      }

      setRecentScans(prev => [
        {
          id: `${Date.now()}-${Math.random()}`,
          name: attendeeName,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
          status,
          role: res.data.member?.role,
          message: res.data.message
        },
        ...prev.slice(0, 9)
      ])

      // Refresh members silently to update real-time counters
      fetchMembers(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memproses QR Code')
    } finally {
      setScanLoading(false)
      setTimeout(() => {
        setLastScannedToken(null)
      }, 3000)
    }
  }

  const handleScanQR = async (rawResult: any) => {
    if (!rawResult || !rawResult[0] || !rawResult[0].rawValue) return
    const token = rawResult[0].rawValue.trim()
    if (!token || token === lastScannedToken) return
    await processQRToken(token)
  }

  const handleManualTokenSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!manualTokenInput.trim()) {
      toast.error('Masukkan token atau UUID anggota')
      return
    }
    await processQRToken(manualTokenInput.trim())
    setManualTokenInput('')
  }

  const currentAgenda = useMemo(() => {
    return agendas.find(a => a.id === selectedAgendaId) || null
  }, [agendas, selectedAgendaId])

  const getPredictedStatus = (): 'present' | 'late' => {
    if (currentAgenda?.late_time) {
      const isLate = new Date() > new Date(currentAgenda.late_time)
      return isLate ? 'late' : 'present'
    }
    return 'present'
  }

  const stats = useMemo(() => {
    let present = 0
    let late = 0
    let excusedOrSick = 0
    let absent = 0
    let unmarked = 0

    members.forEach(m => {
      const st = m.attendance?.status
      if (st === 'present') present++
      else if (st === 'late') late++
      else if (st === 'excused' || st === 'sick') excusedOrSick++
      else if (st === 'absent') absent++
      else unmarked++
    })

    return {
      present,
      late,
      excusedOrSick,
      absent,
      unmarked,
      total: members.length
    }
  }, [members])

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return members.filter(m => {
      const name = (m.profile?.full_name || '').toLowerCase()
      const email = (m.profile?.email || '').toLowerCase()
      const matchSearch = !q || name.includes(q) || email.includes(q)
      if (!matchSearch) return false

      const st = m.attendance?.status
      if (activeIzinFilter === 'unmarked') {
        return !st
      }
      if (activeIzinFilter === 'attended') {
        return st === 'present' || st === 'late'
      }
      if (activeIzinFilter === 'excused') {
        return st === 'excused' || st === 'sick'
      }
      if ((activeIzinFilter as any) === 'absent') {
        return st === 'absent'
      }
      return true
    })
  }, [members, searchQuery, activeIzinFilter])

  const unmarkedMembers = useMemo(() => {
    return members.filter(m => {
      const st = m.attendance?.status
      return !st
    })
  }, [members])

  const handleUpdateMemberStatus = async (
    member: SessionMember, 
    targetStatus: 'present' | 'excused' | 'sick' | 'absent',
    isCheckOut: boolean = false
  ) => {
    const pid = member.profile_id
    if (submittingIds.has(pid)) return

    const predicted = targetStatus === 'present' ? getPredictedStatus() : targetStatus
    const prevAttendance = member.attendance

    setMembers(prev => prev.map(m => {
      if (m.profile_id === pid) {
        return {
          ...m,
          attendance: {
            id: 'temp-' + Date.now(),
            status: predicted,
            check_in_time: new Date().toISOString(),
            check_out_time: isCheckOut ? new Date().toISOString() : prevAttendance?.check_out_time || null,
            notes: `[OPTIMISTIC: ${targetStatus}]`
          }
        }
      }
      return m
    }))

    setSubmittingIds(prev => new Set(prev).add(pid))

    try {
      const payload: any = {
        profileIds: [pid],
        status: targetStatus,
        isCheckOut: isCheckOut
      }
      if (pin.trim()) {
        payload.pin = pin.trim()
      }

      const res = await api.post(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/manual-checkin`, payload)
      const finalStatus = res.data?.computedStatus || predicted
      const label = finalStatus === 'excused' ? 'Izin' : finalStatus === 'sick' ? 'Sakit' : finalStatus === 'late' ? 'Telat' : finalStatus === 'absent' ? 'Alpa' : 'Hadir'
      toast.success(`${member.profile.full_name || 'Anggota'} dicatat: ${isCheckOut ? 'Pulang' : label}`)
      
      // Also sync members & validation records in background
      fetchMembers(false)
      fetchValidationRecords()
    } catch (err: any) {
      setMembers(prev => prev.map(m => {
        if (m.profile_id === pid) {
          return { ...m, attendance: prevAttendance }
        }
        return m
      }))
      toast.error(err.response?.data?.error || 'Gagal mengubah status kehadiran.')
    } finally {
      setSubmittingIds(prev => {
        const next = new Set(prev)
        next.delete(pid)
        return next
      })
    }
  }

  const handleRevokeMemberAttendance = async (member: SessionMember) => {
    const pid = member.profile_id
    if (submittingIds.has(pid)) return

    const prevAttendance = member.attendance

    // Optimistically clear attendance so the member returns to "Belum Hadir"
    setMembers(prev => prev.map(m => {
      if (m.profile_id === pid) {
        return {
          ...m,
          attendance: null
        }
      }
      return m
    }))

    setSubmittingIds(prev => new Set(prev).add(pid))

    try {
      const payload: any = {
        profileIds: [pid],
        action: 'revoke',
        status: 'unmarked'
      }
      if (pin.trim()) {
        payload.pin = pin.trim()
      }

      await api.post(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/manual-checkin`, payload)
      toast.success(`Kehadiran ${member.profile?.full_name || 'Anggota'} berhasil dicabut.`)

      // Sync data in background
      fetchMembers(false)
      fetchValidationRecords()
    } catch (err: any) {
      setMembers(prev => prev.map(m => {
        if (m.profile_id === pid) {
          return { ...m, attendance: prevAttendance }
        }
        return m
      }))
      toast.error(err.response?.data?.error || 'Gagal mencabut kehadiran.')
    } finally {
      setSubmittingIds(prev => {
        const next = new Set(prev)
        next.delete(pid)
        return next
      })
    }
  }

  const handleCheckInAllUnmarked = async () => {
    if (unmarkedMembers.length === 0) {
      toast.error('Semua anggota sudah diabsenkan atau izin/sakit.')
      return
    }

    const ok = await confirm({
      title: 'Presensi Massal Kilat',
      message: `Tandai ${unmarkedMembers.length} anggota yang belum absen menjadi Hadir sekaligus?`,
      confirmText: 'Ya, Tandai Hadir Semua',
      variant: 'primary'
    })
    if (!ok) return

    const pids = unmarkedMembers.map(m => m.profile_id)
    const predicted = getPredictedStatus()
    const prevMembers = [...members]

    setMembers(prev => prev.map(m => {
      const st = m.attendance?.status
      if (!st) {
        return {
          ...m,
          attendance: {
            id: 'temp-' + Date.now(),
            status: predicted,
            check_in_time: new Date().toISOString(),
            check_out_time: null,
            notes: '[BULK_OPTIMISTIC]'
          }
        }
      }
      return m
    }))

    setBulkSubmitting(true)

    try {
      const payload: any = {
        profileIds: pids,
        status: 'present'
      }
      if (pin.trim()) {
        payload.pin = pin.trim()
      }

      const res = await api.post(`/org-attendance/${orgSlug}/sessions/${selectedAgendaId}/manual-checkin`, payload)
      toast.success(res.data?.message || `Berhasil mencatat ${pids.length} anggota Hadir.`)
      fetchMembers(false)
      fetchValidationRecords()
    } catch (err: any) {
      setMembers(prevMembers)
      toast.error(err.response?.data?.error || 'Gagal memproses presensi masal.')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // -------------------------------------------------------------
  // TAB 3 (SCHEDULES) ACTIONS
  // -------------------------------------------------------------
  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/org-schedule/${orgSlug}/${id}/toggle`, { is_active: !currentStatus })
      toast.success('Status jadwal berhasil diubah')
      fetchSchedules()
    } catch (err) {
      toast.error('Gagal mengubah status jadwal')
    }
  }

  const deleteSchedule = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus Jadwal Otomatis',
      message: 'Apakah Anda yakin ingin menghapus jadwal otomatis ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Jadwal',
      variant: 'danger'
    })
    if (!ok) return
    try {
      await api.delete(`/org-schedule/${orgSlug}/${id}`)
      toast.success('Jadwal berhasil dihapus')
      fetchSchedules()
    } catch (err) {
      toast.error('Gagal menghapus jadwal')
    }
  }

  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 md:pb-24 font-sans">
      
      {/* Top Header & Unified Tab Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-3">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link 
              href={`/org/${orgSlug}/attendance`} 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Modul Presensi</span>
            </Link>
          </div>

          {/* Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Pusat Alat & Kelola Presensi</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kelola sesi, validasi surat izin/sakit, bantu absen manual, dan jadwal otomatis dalam 1 modul.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                title="Panduan Interaktif Fitur"
              >
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Panduan Fitur</span>
              </button>

              {mainTab === 'sessions' && (
                <Link
                  href={`/org/${orgSlug}/attendance/sessions/create`}
                  data-tour="tour-create-session"
                  className="bg-[#0087FF] hover:bg-[#0077E6] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Buat Sesi</span>
                </Link>
              )}

              {mainTab === 'schedules' && (
                <Link
                  href={`/org/${orgSlug}/attendance/schedules/new`}
                  className="bg-[#0087FF] hover:bg-[#0077E6] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Jadwal Baru</span>
                </Link>
              )}

              {mainTab === 'izin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (izinSubTab === 'validation') {
                      fetchValidationRecords()
                    } else {
                      fetchMembers(true)
                    }
                  }}
                  disabled={loadingMembers || loadingValidation}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  title="Segarkan Data"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${(loadingMembers || loadingValidation) ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Unified Main Tabs */}
          <div data-tour="tour-main-tabs" className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => switchTab('sessions')}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mainTab === 'sessions'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Kelola Sesi</span>
              {ongoingSessions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
            </button>

            <button
              type="button"
              data-tour="tour-izin-tab-btn"
              onClick={() => switchTab('izin')}
              className={`flex-1 min-w-[180px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mainTab === 'izin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Bantu Absen & Scan QR</span>
              {validationStats.pending > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-rose-500 text-white rounded-full">
                  {validationStats.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchTab('schedules')}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mainTab === 'schedules'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Jadwal Otomatis</span>
              {schedules.filter(s => s.is_active).length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded-full">
                  {schedules.filter(s => s.is_active).length}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">

        {/* ========================================================= */}
        {/* TAB 1: KELOLA SESI */}
        {/* ========================================================= */}
        {mainTab === 'sessions' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Sub-Tabs: Ongoing, Upcoming, Past */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button 
                onClick={() => setSessionSubTab('ongoing')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  sessionSubTab === 'ongoing' ? 'bg-[#0087FF] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Sedang Berlangsung ({ongoingSessions.length})</span>
              </button>

              <button 
                onClick={() => setSessionSubTab('upcoming')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  sessionSubTab === 'upcoming' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Akan Datang ({upcomingSessions.length})</span>
              </button>

              <button 
                onClick={() => setSessionSubTab('past')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  sessionSubTab === 'past' ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai ({pastSessions.length})</span>
              </button>
            </div>

            {loadingSessions ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                    <div className="h-6 w-1/2 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-1/3 bg-slate-100 rounded-md" />
                    <div className="h-10 bg-slate-50 rounded-xl mt-4" />
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const activeList = sessionSubTab === 'ongoing' 
                  ? ongoingSessions 
                  : sessionSubTab === 'upcoming' 
                  ? upcomingSessions 
                  : pastSessions

                if (activeList.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm">
                      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        {sessionSubTab === 'ongoing' && 'Tidak ada sesi yang sedang berlangsung'}
                        {sessionSubTab === 'upcoming' && 'Tidak ada agenda sesi yang akan datang'}
                        {sessionSubTab === 'past' && 'Belum ada riwayat sesi selesai'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {sessionSubTab === 'ongoing' && 'Buat sesi baru sekarang atau aktifkan jadwal otomatis.'}
                        {sessionSubTab === 'upcoming' && 'Rencanakan rapat atau kegiatan mendatang.'}
                        {sessionSubTab === 'past' && 'Sesi yang telah berakhir akan tampil di sini.'}
                      </p>
                      {sessionSubTab !== 'past' && (
                        <Link 
                          href={`/org/${orgSlug}/attendance/sessions/create`}
                          className="inline-flex items-center gap-1.5 mt-4 bg-[#0087FF] hover:bg-[#0077E6] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Buat Sesi Baru</span>
                        </Link>
                      )}
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeList.map(session => {
                      const isOngoing = session.is_active && new Date(session.start_time) <= now && new Date(session.end_time) >= now
                      const isUpcoming = session.is_active && new Date(session.start_time) > now

                      let badgeLabel = 'Selesai'
                      let badgeClasses = 'bg-slate-100 text-slate-600 border border-slate-200'

                      if (isOngoing) {
                        badgeLabel = 'Sedang Berjalan'
                        badgeClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      } else if (isUpcoming) {
                        badgeLabel = 'Akan Datang'
                        badgeClasses = 'bg-blue-50 text-blue-700 border border-blue-200'
                      } else if (!session.is_active && new Date(session.end_time) >= now) {
                        badgeLabel = 'Ditutup'
                        badgeClasses = 'bg-rose-50 text-rose-700 border border-rose-200'
                      } else {
                        badgeLabel = 'Selesai'
                        badgeClasses = 'bg-slate-100 text-slate-600 border border-slate-200'
                      }

                      return (
                        <div 
                          key={session.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 uppercase tracking-wide">
                                {session.session_type === 'in_out' ? 'Masuk & Pulang' : 'Hanya Datang'}
                              </span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeClasses}`}>
                                {badgeLabel}
                              </span>
                            </div>

                          <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1">{session.title}</h3>

                          <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(session.start_time).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {new Date(session.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </span>
                            </div>
                            {session.location_name && (
                              <div className="flex items-center gap-2 text-slate-500 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{session.location_name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <Link 
                            href={`/org/${orgSlug}/attendance/sessions/${session.id}`}
                            className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Detail Sesi</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => switchTab('izin', session.id)}
                            className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            <span>Bantu Absen</span>
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                )
              })()
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BANTU ABSEN & SCAN QR (SCANNER + ROLL-CALL + VALIDASI) */}
        {/* ========================================================= */}
        {mainTab === 'izin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Segmented Switcher: Scan QR Kamera vs Roll-Call Manual vs Validasi Bukti */}
            <div data-tour="tour-izin-switcher" className="flex p-1 bg-slate-200/80 rounded-2xl max-w-xl mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => switchSubTab('scan')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  izinSubTab === 'scan'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Scan QR Kamera</span>
              </button>

              <button
                type="button"
                onClick={() => switchSubTab('manual')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  izinSubTab === 'manual'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Daftar Roll-Call</span>
              </button>

              <button
                type="button"
                onClick={() => switchSubTab('validation')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  izinSubTab === 'validation'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Validasi Izin</span>
                {validationStats.pending > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {validationStats.pending}
                  </span>
                )}
              </button>
            </div>

            {/* --------------------------------------------------------- */}
            {/* SUB-VIEW 1: SCAN QR KAMERA (KAMERA REAL-TIME) */}
            {/* --------------------------------------------------------- */}
            {izinSubTab === 'scan' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Selector Sesi Kegiatan */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <span>Pindai QR Presensi Anggota</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Arahkan kamera ke QR Code milik anggota di layar HP siswa atau kartu cetak fisik.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          soundEnabled 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        title={soundEnabled ? 'Suara Bunyi Aktif' : 'Suara Bunyi Senyap'}
                      >
                        {soundEnabled ? (
                          <>
                            <Bell className="w-3.5 h-3.5" />
                            <span>Suara On</span>
                          </>
                        ) : (
                          <>
                            <BellSlash className="w-3.5 h-3.5" />
                            <span>Senyap</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/org/${orgSlug}/members/qr`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <IdentificationCard className="w-4 h-4 text-blue-600" />
                        <span>Cetak QR</span>
                      </Link>
                    </div>
                  </div>

                  {/* Sesi Dropdown */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Sesi / Agenda yang Sedang Berlangsung</span>
                      </span>
                      {selectedAgendaId && (
                        <span className="text-[11px] text-blue-600 font-semibold">
                          ID: {selectedAgendaId.slice(0, 8)}...
                        </span>
                      )}
                    </label>

                    <CustomSelect
                      value={selectedAgendaId}
                      onChange={val => setSelectedAgendaId(val)}
                      options={agendas.map(agenda => {
                        const isOngoing = agenda.is_active && new Date(agenda.start_time) <= now && new Date(agenda.end_time) >= now
                        const isUpcoming = agenda.is_active && new Date(agenda.start_time) > now
                        return {
                          label: `${agenda.title} (${new Date(agenda.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}) - ${isOngoing ? 'Sedang Berjalan' : isUpcoming ? 'Akan Datang' : 'Selesai'}`,
                          value: agenda.id
                        }
                      })}
                      className="w-full"
                    />
                  </div>

                  {currentAgenda && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                        currentAgenda.is_active && new Date(currentAgenda.start_time) <= now && new Date(currentAgenda.end_time) >= now
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {currentAgenda.session_type === 'in_out' ? 'Tipe: Masuk & Pulang' : 'Tipe: Datang Saja'}
                      </span>
                      {currentAgenda.late_time && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          Batas Tepat: {new Date(currentAgenda.late_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      )}
                      {currentAgenda.pin_code && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold">
                          PIN: {currentAgenda.pin_code}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Main 2-Column Scanner Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Live Camera Card & Token Fallback */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-slate-900 border-4 border-white shadow-2xl rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden flex flex-col items-center">
                      <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-300">
                        <span className="font-bold flex items-center gap-1.5 text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Kamera Aktif
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <CameraRotate className="w-3.5 h-3.5" />
                            <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Viewfinder Frame */}
                      <div className="w-full max-w-[340px] aspect-square relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black flex items-center justify-center">
                        {isClient && selectedAgendaId ? (
                          <Scanner
                            onScan={handleScanQR}
                            formats={['qr_code']}
                            constraints={{
                              facingMode: facingMode,
                              width: { ideal: 1280, min: 640 },
                              height: { ideal: 720, min: 480 },
                              advanced: [{ focusMode: "continuous" }] as any
                            }}
                            components={{
                              onOff: true,
                              torch: true,
                              zoom: true,
                              finder: true
                            }}
                            styles={{
                              container: { width: '100%', height: '100%' },
                              video: { objectFit: 'cover' }
                            }}
                          />
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
                            <p>Menyiapkan modul kamera...</p>
                          </div>
                        )}

                        {scanLoading && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-2" />
                            <p className="font-bold text-sm text-white">Mencatat Presensi...</p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 text-center mt-3 max-w-xs leading-relaxed">
                        Posisikan QR Code di dalam kotak pemindai. Sistem akan otomatis memvalidasi identitas anggota atau tamu.
                      </p>
                    </div>

                    {/* Fallback Manual Token Input */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                      <form onSubmit={handleManualTokenSubmit} className="flex gap-2">
                        <input
                          type="text"
                          value={manualTokenInput}
                          onChange={e => setManualTokenInput(e.target.value)}
                          placeholder="Ketik UUID / Token manual jika kamera bermasalah..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={scanLoading || !manualTokenInput.trim()}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                        >
                          Absenkan
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Live Counters & Recent Scans Feed */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Live Stats */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Statistik Sesi Real-Time
                        </span>
                        <span className="text-xs font-black text-blue-600">
                          {stats.total > 0 ? `${Math.round(((stats.present + stats.late) / stats.total) * 100)}%` : '0%'} Hadir
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            Hadir Tepat
                          </span>
                          <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                            {stats.present}
                          </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                            Terlambat
                          </span>
                          <span className="text-xl font-black text-amber-700 mt-0.5 block">
                            {stats.late}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Belum Absen
                          </span>
                          <span className="text-xl font-black text-slate-700 mt-0.5 block">
                            {stats.unmarked}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => switchSubTab('manual')}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Buka Roll-Call Manual ({stats.unmarked} Belum)</span>
                        </button>
                      </div>
                    </div>

                    {/* Feed of Recent Scans */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Riwayat Scan Terkini</span>
                        </h4>
                        {recentScans.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {recentScans.length} tercatat
                          </span>
                        )}
                      </div>

                      {recentScans.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                          <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs font-semibold text-slate-600">Belum ada scan pada sesi ini</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Setiap siswa yang di-scan akan langsung muncul di sini.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1 space-y-2">
                          {recentScans.map(item => (
                            <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400">{item.time}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] whitespace-nowrap ${
                                item.status === 'checkout'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : item.status === 'late'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {item.status === 'checkout' ? 'Pulang' : item.status === 'late' ? 'Telat' : 'Hadir'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* SUB-VIEW A: VALIDASI BUKTI IZIN & SAKIT (AI) */}
            {/* --------------------------------------------------------- */}
            {izinSubTab === 'validation' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Validation Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-sm">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Total Pengajuan
                    </span>
                    <span className="text-2xl font-bold text-slate-900 mt-0.5 block">
                      {validationStats.total}
                    </span>
                  </div>

                  <div className="bg-white border border-amber-200/80 rounded-2xl p-4 text-center shadow-sm bg-amber-50/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
                      Perlu Validasi
                    </span>
                    <span className="text-2xl font-bold text-amber-600 mt-0.5 block">
                      {validationStats.pending}
                    </span>
                  </div>

                  <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 text-center shadow-sm bg-emerald-50/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
                      Disetujui
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 mt-0.5 block">
                      {validationStats.approved}
                    </span>
                  </div>

                  <div className="bg-white border border-rose-200/80 rounded-2xl p-4 text-center shadow-sm bg-rose-50/30">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">
                      Ditolak / Alpa
                    </span>
                    <span className="text-2xl font-bold text-rose-600 mt-0.5 block">
                      {validationStats.rejected}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-3 space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={validationSearch}
                      onChange={e => setValidationSearch(e.target.value)}
                      placeholder="Cari nama anggota, email, catatan, atau sesi..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    {validationSearch && (
                      <button
                        onClick={() => setValidationSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        batal
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
                    {[
                      { key: 'all', label: `Semua (${validationStats.total})` },
                      { key: 'pending', label: `Perlu Validasi (${validationStats.pending})` },
                      { key: 'approved', label: `Disetujui (${validationStats.approved})` },
                      { key: 'rejected', label: `Ditolak (${validationStats.rejected})` },
                    ].map(f => {
                      const isActive = validationFilter === f.key
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setValidationFilter(f.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                            isActive
                              ? 'bg-[#0087FF] text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Validation Records Table & Cards */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                  {loadingValidation ? (
                    <div className="p-10 text-center text-slate-500 space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0087FF]" />
                      <p className="text-xs font-medium">Memuat data pengajuan izin & sakit...</p>
                    </div>
                  ) : filteredValidationRecords.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <FileCheck2 className="w-10 h-10 mx-auto opacity-30 text-[#0087FF]" />
                      <h4 className="text-sm font-bold text-slate-700">Tidak ada data izin atau sakit</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {validationFilter === 'pending' 
                          ? 'Semua pengajuan izin dan sakit telah diperiksa dan tervalidasi.'
                          : 'Belum ada pengajuan izin atau sakit yang sesuai dengan filter ini.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                              <th className="py-3 px-4">Tanggal & Sesi</th>
                              <th className="py-3 px-4">Anggota</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Alasan / Catatan</th>
                              <th className="py-3 px-4 text-center">Bukti</th>
                              <th className="py-3 px-4 text-right">Aksi Validasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredValidationRecords.map(record => {
                              const isValidated = record.notes?.includes('[VALIDATED]')
                              const cleanNotes = (record.notes || '').replace(/\[VALIDATED\]|\[MANUAL_BY_ADMIN[^\]]*\]/g, '').trim()
                              const isActionLoading = actionLoadingId === record.id

                              return (
                                <Fragment key={record.id}>
                                  <tr className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="text-xs font-bold text-slate-900">
                                        {new Date(record.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                        {record.session?.title || 'Sesi Mandiri'}
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      <div className="font-bold text-slate-900">
                                        {record.profile?.full_name || 'Tanpa Nama'}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {record.profile?.email}
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                      {record.status === 'excused' && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                          Izin
                                        </span>
                                      )}
                                      {record.status === 'sick' && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                                          Sakit
                                        </span>
                                      )}
                                      {record.status === 'absent' && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                          Alpa
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-[220px]">
                                      <p className="line-clamp-2" title={cleanNotes || '-'}>
                                        {cleanNotes || <span className="text-slate-400 italic">Tanpa catatan</span>}
                                      </p>
                                    </td>

                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                      {record.proof_url ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPreviewProofUrl(record.proof_url)
                                              setSelectedPreviewRecord(record)
                                            }}
                                            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            title="Buka lampiran surat"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Lihat Bukti</span>
                                          </button>

                                          {/* Bantuan Validasi AI Button */}
                                          <button
                                            type="button"
                                            onClick={() => handleValidateWithAi(record)}
                                            disabled={aiLoadingId === record.id}
                                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-2xs active:scale-95 ${
                                              aiValidationResults[record.id]
                                                ? aiValidationResults[record.id].is_valid
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                : 'bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 border border-purple-200/80'
                                            }`}
                                            title="Minta AI memvalidasi keaslian surat/bukti ini"
                                          >
                                            {aiLoadingId === record.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                            ) : (
                                              <Sparkle className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                                            )}
                                            <span>
                                              {aiLoadingId === record.id
                                                ? 'Memeriksa...'
                                                : aiValidationResults[record.id]
                                                ? aiValidationResults[record.id].is_valid ? 'AI: Valid' : 'AI: Ragu'
                                                : 'Validasi AI'}
                                            </span>
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400 italic">Tanpa Bukti</span>
                                      )}
                                    </td>

                                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                      {isValidated ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Disetujui</span>
                                        </span>
                                      ) : record.status === 'absent' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/70 px-2.5 py-1 rounded-lg">
                                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                          <span>Ditolak</span>
                                        </span>
                                      ) : (
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRecord(record.id)}
                                            disabled={isActionLoading}
                                            className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
                                          >
                                            Setujui
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectRecord(record.id)}
                                            disabled={isActionLoading}
                                            className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
                                          >
                                            Tolak
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                  {aiValidationResults[record.id] && (
                                    <tr className="bg-purple-50/50 border-b border-purple-100">
                                      <td colSpan={6} className="px-4 py-2.5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-purple-200/90 rounded-xl p-3 shadow-2xs">
                                          <div className="flex items-start gap-2.5">
                                            <div className={`p-1.5 rounded-lg shrink-0 ${aiValidationResults[record.id].is_valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                              <Sparkle className="w-4 h-4 fill-current" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${aiValidationResults[record.id].is_valid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                  {aiValidationResults[record.id].is_valid ? '✓ Terindikasi Surat Resmi / Valid' : '⚠️ Surat Perlu Pengecekan Manual'}
                                                </span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                                  Tingkat Keyakinan: {aiValidationResults[record.id].confidence}
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-600 mt-1">
                                                <span className="font-semibold text-slate-700">Ringkasan Dokumen:</span> {aiValidationResults[record.id].summary}
                                              </p>
                                            </div>
                                          </div>

                                          {!isValidated && record.status !== 'absent' && (
                                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => handleApproveRecord(record.id)}
                                                disabled={isActionLoading}
                                                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-xs"
                                              >
                                                Setujui
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRejectRecord(record.id)}
                                                disabled={isActionLoading}
                                                className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-all"
                                              >
                                                Tolak
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
                        {filteredValidationRecords.map(record => {
                          const isValidated = record.notes?.includes('[VALIDATED]')
                          const cleanNotes = (record.notes || '').replace(/\[VALIDATED\]|\[MANUAL_BY_ADMIN[^\]]*\]/g, '').trim()
                          const isActionLoading = actionLoadingId === record.id

                          return (
                            <div key={record.id} className="pt-3 first:pt-0 space-y-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400">
                                    {new Date(record.check_in_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {record.session?.title || 'Sesi Mandiri'}
                                  </div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {record.profile?.full_name || record.profile?.email}
                                  </div>
                                </div>

                                <div>
                                  {record.status === 'excused' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                      Izin
                                    </span>
                                  )}
                                  {record.status === 'sick' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/60">
                                      Sakit
                                    </span>
                                  )}
                                  {record.status === 'absent' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                      Alpa
                                    </span>
                                  )}
                                </div>
                              </div>

                              {cleanNotes && (
                                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="font-bold text-slate-700 block mb-0.5">Catatan/Alasan:</span>
                                  {cleanNotes}
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {record.proof_url ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewProofUrl(record.proof_url)
                                        setSelectedPreviewRecord(record)
                                      }}
                                      className="flex-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Lihat Bukti</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleValidateWithAi(record)}
                                      disabled={aiLoadingId === record.id}
                                      className="flex-1 text-xs font-bold bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 border border-purple-200/80 py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                                    >
                                      {aiLoadingId === record.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                      ) : (
                                        <Sparkle className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                                      )}
                                      <span>
                                        {aiLoadingId === record.id
                                          ? 'Memeriksa...'
                                          : aiValidationResults[record.id]
                                          ? aiValidationResults[record.id].is_valid ? 'AI: Valid' : 'AI: Ragu'
                                          : 'Validasi AI'}
                                      </span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex-1 text-center text-xs text-slate-400 italic py-2 bg-slate-50 rounded-xl">
                                    Tanpa Bukti Surat
                                  </div>
                                )}

                                {isValidated ? (
                                  <div className="flex-[1.2] text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 py-2 rounded-xl flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Disetujui</span>
                                  </div>
                                ) : record.status === 'absent' ? (
                                  <div className="flex-[1.2] text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/70 py-2 rounded-xl flex items-center justify-center gap-1">
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Ditolak</span>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveRecord(record.id)}
                                      disabled={isActionLoading}
                                      className="flex-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white py-2 rounded-xl transition-all active:scale-95"
                                    >
                                      Setujui
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectRecord(record.id)}
                                      disabled={isActionLoading}
                                      className="flex-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white py-2 rounded-xl transition-all active:scale-95"
                                    >
                                      Tolak
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* SUB-VIEW B: BANTU ABSEN (INPUT MANUAL PER SESI) */}
            {/* --------------------------------------------------------- */}
            {izinSubTab === 'manual' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Selector Agenda & PIN */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                  {/* Pilih Sesi */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pilih Sesi / Agenda Presensi</span>
                      </span>
                      {selectedAgendaId && (
                        <span className="text-[11px] text-blue-600 font-semibold">
                          ID: {selectedAgendaId.slice(0, 8)}...
                        </span>
                      )}
                    </label>

                    <div data-tour="tour-agenda-select">
                      <CustomSelect
                        value={selectedAgendaId}
                        onChange={val => setSelectedAgendaId(val)}
                        options={agendas.map(agenda => {
                          const isOngoing = agenda.is_active && new Date(agenda.start_time) <= now && new Date(agenda.end_time) >= now
                          const isUpcoming = agenda.is_active && new Date(agenda.start_time) > now
                          return {
                            label: `${agenda.title} (${new Date(agenda.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}) - ${isOngoing ? 'Sedang Berjalan' : isUpcoming ? 'Akan Datang (Bisa Izin/Sakit)' : 'Selesai'}`,
                            value: agenda.id
                          }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Catatan Izin/Sakit Sebelum Sesi Dimulai */}
                  <div className="bg-[#E0F4FE]/70 border border-[#b9e5fa] rounded-xl px-3.5 py-2.5 flex items-start gap-2 text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-[#0087FF] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Izin & Sakit Lebih Awal:</strong> Anda dapat langsung mencatat Izin atau Sakit untuk anggota pada sesi mendatang sebelum sesi dimulai tanpa perlu memasukkan PIN sesi.
                    </p>
                  </div>

                  {/* Quick Roll-Call Header & One-Click Bulk Action */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {currentAgenda?.pin_code && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>PIN Siswa: <strong className="tracking-widest text-slate-900 font-bold">{currentAgenda.pin_code}</strong></span>
                        </div>
                      )}
                    </div>

                    <div className="sm:self-end">
                      <button
                        type="button"
                        data-tour="tour-bulk-checkin"
                        onClick={handleCheckInAllUnmarked}
                        disabled={bulkSubmitting || unmarkedMembers.length === 0}
                        className="w-full sm:w-auto h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {bulkSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Tandai Hadir Semua ({unmarkedMembers.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Batas Waktu Telat */}
                  {currentAgenda?.late_time && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Batas waktu tepat: <strong>{new Date(currentAgenda.late_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>. 
                        Absen lewat waktu ini otomatis tercatat <strong>Telat</strong>.
                      </span>
                    </div>
                  )}
                </div>

                {/* Real-Time Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Hadir
                    </span>
                    <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                      {stats.present}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Telat
                    </span>
                    <span className="text-xl font-black text-amber-600 mt-0.5 block">
                      {stats.late}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Izin / Sakit
                    </span>
                    <span className="text-xl font-black text-indigo-600 mt-0.5 block">
                      {stats.excusedOrSick}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Alpa
                    </span>
                    <span className="text-xl font-black text-rose-600 mt-0.5 block">
                      {stats.absent}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-sm col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Belum Hadir
                    </span>
                    <span className="text-xl font-black text-slate-800 mt-0.5 block">
                      {stats.unmarked}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-3 space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Cari nama atau email anggota..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        batal
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
                    {[
                      { key: 'unmarked', label: `Belum Hadir (${stats.unmarked})` },
                      { key: 'attended', label: `Sudah Hadir (${stats.present + stats.late})` },
                      { key: 'excused', label: `Izin / Sakit (${stats.excusedOrSick})` },
                      { key: 'absent', label: `Alpa (${stats.absent})` },
                      { key: 'all', label: `Semua (${stats.total})` },
                    ].map(tab => {
                      const isActive = activeIzinFilter === tab.key
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveIzinFilter(tab.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* List Anggota */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {loadingMembers ? (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                      <p className="text-xs font-medium">Memuat data anggota...</p>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-1">
                      <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">
                        Tidak ada anggota pada daftar ini.
                      </p>
                      {searchQuery && (
                        <p className="text-xs text-slate-400">
                          Coba kata kunci pencarian yang lain.
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredMembers.map((member, idx) => {
                      const status = member.attendance?.status
                      const isPresent = status === 'present'
                      const isLate = status === 'late'
                      const isExcused = status === 'excused'
                      const isSick = status === 'sick'
                      const isAbsent = status === 'absent'
                      const isCheckedOut = !!member.attendance?.check_out_time
                      const isSubmitting = submittingIds.has(member.profile_id)

                      return (
                        <div 
                          key={member.profile_id}
                          className="p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Left: Avatar & Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                              {member.profile?.avatar_url ? (
                                <img 
                                  src={member.profile.avatar_url} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                (member.profile?.full_name || member.profile?.email || 'A').charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-slate-900 truncate">
                                  {member.profile?.full_name || 'Tanpa Nama'}
                                </p>
                                {member.organization?.name && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium shrink-0">
                                    {member.organization.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {member.profile?.email}
                              </p>
                            </div>
                          </div>

                          {/* Right: Status Badges & Quick Action Buttons */}
                          <div data-tour={idx === 0 ? "tour-member-status-actions" : undefined} className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                            {/* Status Badges */}
                            {isExcused && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
                                <Check className="w-3 h-3" />
                                Izin
                              </span>
                            )}

                            {isSick && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/60">
                                <Check className="w-3 h-3" />
                                Sakit
                              </span>
                            )}

                            {isPresent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                                <Check className="w-3 h-3" />
                                Hadir
                              </span>
                            )}

                            {isLate && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
                                <Clock className="w-3 h-3" />
                                Telat
                              </span>
                            )}

                            {isAbsent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200/60">
                                <X className="w-3 h-3" />
                                Alpa
                              </span>
                            )}

                            {isCheckedOut && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                                Pulang: {new Date(member.attendance!.check_out_time!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}

                            {/* Action Buttons for Secretary */}
                            <div className="flex items-center gap-1.5 ml-1">
                              {/* If already marked present / late: Option to Revoke attendance ("Cabut Hadir") */}
                              {(isPresent || isLate) ? (
                                <>
                                  {/* Optional Pulang Button (if session is in_out) */}
                                  {currentAgenda?.session_type === 'in_out' && !isCheckedOut && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMemberStatus(member, 'present', true)}
                                      disabled={isSubmitting}
                                      className="h-8 px-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200/70"
                                      title="Tandai Pulang"
                                    >
                                      Pulang
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRevokeMemberAttendance(member)}
                                    disabled={isSubmitting}
                                    className="h-8 px-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center gap-1"
                                    title="Cabut kehadiran anggota ini (kembalikan ke belum hadir)"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <X className="w-3 h-3 stroke-[2.5]" />
                                    )}
                                    <span>Cabut Hadir</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Not Attended (Unmarked or Alpa or Excused): Primary action is "Catat Hadir" */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMemberStatus(member, 'present')}
                                    disabled={isSubmitting}
                                    className="h-8 px-3 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    title="Tandai Hadir (Otomatis tercatat Telat jika melewati batas waktu)"
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                    <span>{isExcused || isSick ? 'Ubah ke Hadir' : 'Catat Hadir'}</span>
                                  </button>

                                  {/* Secondary quick option: Alpa (if unmarked) or Cabut (if excused/sick) */}
                                  {isExcused || isSick ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeMemberAttendance(member)}
                                      disabled={isSubmitting}
                                      className="h-8 px-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all active:scale-95"
                                      title="Cabut izin/sakit"
                                    >
                                      Cabut
                                    </button>
                                  ) : !isAbsent ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMemberStatus(member, 'absent')}
                                      disabled={isSubmitting}
                                      className="h-8 px-2.5 rounded-xl font-semibold text-xs text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-all active:scale-95"
                                      title="Tandai Alpa"
                                    >
                                      Alpa
                                    </button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <p className="text-center text-xs text-slate-400 mt-4 font-normal">
                  Pengurus sekretaris dapat menandai kehadiran secara langsung (Hadir, Izin, atau Sakit) tanpa batasan geofencing GPS.
                </p>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: JADWAL OTOMATIS */}
        {/* ========================================================= */}
        {mainTab === 'schedules' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header info banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Otomatisasi Sesi Rutin
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem akan secara otomatis membuka sesi presensi sesuai jam dan hari yang Anda tentukan di bawah.
                </p>
              </div>

              <Link 
                href={`/org/${orgSlug}/attendance/schedules/new`}
                className="bg-[#0087FF] hover:bg-[#0077E6] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Buat Jadwal Baru</span>
              </Link>
            </div>

            {loadingSchedules ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 h-44 space-y-3">
                    <div className="h-5 w-1/2 bg-slate-200 rounded" />
                    <div className="h-4 w-1/3 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-50 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Belum Ada Jadwal Otomatis</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Buat jadwal mingguan (misal: Rapat Rutin tiap Sabtu, atau Masuk Sekolah tiap Senin-Jumat) agar sesi otomatis aktif tanpa dibuat manual.
                </p>
                <Link 
                  href={`/org/${orgSlug}/attendance/schedules/new`}
                  className="inline-flex items-center gap-1.5 mt-4 bg-[#0087FF] hover:bg-[#0077E6] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Atur Jadwal Pertama</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map(schedule => (
                  <div 
                    key={schedule.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{schedule.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E0F4FE] text-[#0087FF] rounded-md inline-block mt-1">
                            Setiap {daysMap[schedule.day_of_week]}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          schedule.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {schedule.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB</span>
                        </div>
                        {schedule.late_time && (
                          <div className="flex items-center gap-2 text-amber-700 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Batas Telat: {schedule.late_time.slice(0, 5)} WIB</span>
                          </div>
                        )}
                        {schedule.location_name && (
                          <div className="flex items-center gap-2 text-slate-500 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{schedule.location_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          schedule.is_active 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{schedule.is_active ? 'Matikan' : 'Aktifkan'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* QUICK TOOLS HUB: AKSES ALAT PRESENSI TERKAIT LAINNYA */}
        {/* ========================================================= */}
        <div data-tour="tour-tools-hub" className="pt-6 border-t border-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Alat & Fitur Presensi Terkait
            </h4>
            <span className="text-[11px] text-slate-400">Modul Terintegrasi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href={`/org/${orgSlug}/attendance/scan`}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-[#0087FF]/40 rounded-2xl p-3.5 transition-all group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0087FF] transition-colors" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#0087FF] transition-colors">Scan Presensi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Check-in mandiri anggota</p>
              </div>
            </Link>

            <Link
              href={`/org/${orgSlug}/attendance/guests`}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-[#0087FF]/40 rounded-2xl p-3.5 transition-all group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0087FF] transition-colors" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#0087FF] transition-colors">Data Tamu / Siswa</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Kelola tiket & scan tamu</p>
              </div>
            </Link>

            <Link
              href={`/org/${orgSlug}/attendance/analysis`}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-[#0087FF]/40 rounded-2xl p-3.5 transition-all group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#E0F4FE] text-[#0087FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0087FF] transition-colors" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-[#0087FF] transition-colors">Analisis Kehadiran</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Klasemen & statistik kehadiran</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL 1: PREVIEW BUKTI DOKUMEN & AI ASSISTANT */}
      {/* ========================================================= */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Modal Header Toolbar */}
            <div className="p-3 sm:p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400">Lampiran Bukti Surat</p>
                <h4 className="text-sm font-bold text-white truncate">
                  {selectedPreviewRecord?.profile?.full_name || selectedPreviewRecord?.profile?.email || 'Bukti Kehadiran'}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedPreviewRecord && (
                  <button
                    type="button"
                    onClick={() => handleValidateWithAi(selectedPreviewRecord)}
                    disabled={aiLoadingId === selectedPreviewRecord.id}
                    className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    {aiLoadingId === selectedPreviewRecord.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Sparkle className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    )}
                    <span>{aiLoadingId === selectedPreviewRecord.id ? 'Menganalisis Dokumen...' : 'Validasi AI'}</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    setPreviewProofUrl(null)
                    setSelectedPreviewRecord(null)
                  }}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-colors"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Analysis Result Callout inside Modal */}
            {selectedPreviewRecord && aiValidationResults[selectedPreviewRecord.id] && (
              <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-b border-purple-800/60 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${aiValidationResults[selectedPreviewRecord.id].is_valid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                    <Sparkle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${aiValidationResults[selectedPreviewRecord.id].is_valid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {aiValidationResults[selectedPreviewRecord.id].is_valid ? '✓ Terindikasi Surat Resmi / Valid' : '⚠️ Surat Perlu Pengecekan Ulang'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                        Kepercayaan: {aiValidationResults[selectedPreviewRecord.id].confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      <strong>Ringkasan AI:</strong> {aiValidationResults[selectedPreviewRecord.id].summary}
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons inside modal */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveRecord(selectedPreviewRecord.id)
                      setPreviewProofUrl(null)
                      setSelectedPreviewRecord(null)
                    }}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    Setujui Langsung
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRejectRecord(selectedPreviewRecord.id)
                      setPreviewProofUrl(null)
                      setSelectedPreviewRecord(null)
                    }}
                    className="text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            )}

            {/* Document Image / PDF Viewer */}
            <div className="flex-1 overflow-auto p-3 flex items-center justify-center bg-slate-950/60 max-h-[70vh]">
              {previewProofUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewProofUrl} className="w-full h-[65vh] rounded-xl bg-white" title="Lampiran Bukti PDF" />
              ) : (
                <img src={previewProofUrl} alt="Bukti Surat Izin / Sakit" className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* SPOTLIGHT TOUR COMPONENT */}
      {/* ========================================================= */}
      <SpotlightTour
        tourKey={`sessions_${mainTab}`}
        steps={tourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}

export default function AttendanceManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    }>
      <AttendanceManagementContent />
    </Suspense>
  )
}
