'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { 
  CalendarDots as Calendar, 
  Clock, 
  MapPin, 
  CaretLeft as ChevronLeft, 
  CaretDown,
  CaretUp,
  CircleNotch, 
  Check, 
  Users, 
  MagnifyingGlass as Search,
  NavigationArrow,
  SlidersHorizontal,
  Compass,
  X 
} from '@phosphor-icons/react'
import SpotlightTour, { TourStep } from '@/components/ui/SpotlightTour'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function CreateSessionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string
  const [showTour, setShowTour] = useState(false)

  const createSessionTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-session-title"]',
      title: 'Nama Sesi & Preset Instan',
      description: 'Ketik nama kegiatan presensi atau gunakan tombol preset cepat (Latihan Rutin, Rapat Pengurus, dsb) untuk mengisi nama secara instan.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-session-timing"]',
      title: 'Waktu & Durasi Cepat',
      description: 'Pilih "Mulai Sekarang" dengan durasi cepat 1, 2, atau 3 Jam. Sistem otomatis menghitung jam selesai tanpa perlu repot memilih tanggal.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-session-type"]',
      title: 'Tipe Presensi',
      description: 'Pilih "Hanya Datang" untuk absen satu kali, atau "Datang & Pulang" bila anggota wajib absen kembali saat kegiatan usai.',
      position: 'top'
    },
    {
      target: '[data-tour="tour-session-map"]',
      title: 'Lokasi Kegiatan di Peta',
      description: 'Pilih titik lokasi latihan atau rapat melalui peta interaktif atau pencarian tempat. GPS bersifat data tambahan sehingga anggota tetap bisa presensi dengan bebas.',
      position: 'top'
    },
    {
      target: '[data-tour="tour-session-submit"]',
      title: 'Buka Sesi Presensi',
      description: 'Klik tombol ini untuk membuka sesi. Anggota dapat langsung melakukan absensi via QR code atau dicatat langsung oleh pengurus.',
      position: 'top'
    }
  ]

  // Core Form State
  const [title, setTitle] = useState('Latihan Rutin')
  const [sessionType, setSessionType] = useState<'in_only' | 'in_out'>('in_only')
  
  // Quick Timing State
  const [timingMode, setTimingMode] = useState<'now' | 'custom'>('now')
  const [durationHours, setDurationHours] = useState<number>(2)
  const [customStartTime, setCustomStartTime] = useState<string>('')
  const [customEndTime, setCustomEndTime] = useState<string>('')

  // Location on Map State (GPS bersifat data tambahan, bukan syarat wajib)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lon: number, display_name: string } | null>(null)
  const [addressSearch, setAddressSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Advanced / Optional Collapsible State
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [lateTime, setLateTime] = useState('')
  const [showCustomDateLate, setShowCustomDateLate] = useState(false)
  const [checkoutStartTime, setCheckoutStartTime] = useState('')

  // Helper to get base start time as Date
  const getBaseStartTime = () => {
    if (timingMode === 'now') return new Date()
    if (customStartTime) {
      const parsed = new Date(customStartTime)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  }

  // Format Date to "YYYY-MM-DDTHH:mm"
  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // Quick 1-tap late preset (+15m, +30m, +45m, +60m)
  const handleSetLatePreset = (minutes: number) => {
    const base = getBaseStartTime()
    const target = new Date(base.getTime() + minutes * 60 * 1000)
    setLateTime(formatDatetimeLocal(target))
  }

  // Quick time-only change (HH:mm) without date picker
  const handleQuickTimeChange = (timeStr: string) => {
    if (!timeStr) {
      setLateTime('')
      return
    }
    const base = getBaseStartTime()
    const pad = (n: number) => String(n).padStart(2, '0')
    const datePart = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`
    setLateTime(`${datePart}T${timeStr}`)
  }

  const quickTimeValue = lateTime && lateTime.includes('T') ? lateTime.split('T')[1].slice(0, 5) : ''

  // Collaboration State (in advanced)
  const [invitedOrgs, setInvitedOrgs] = useState<{ id: string, name: string }[]>([])
  const [orgSearch, setOrgSearch] = useState('')
  const [orgResults, setOrgResults] = useState<any[]>([])
  const [isSearchingOrg, setIsSearchingOrg] = useState(false)
  const [familyBranches, setFamilyBranches] = useState<any[]>([])
  const [includeAllFamily, setIncludeAllFamily] = useState(false)
  const orgSearchTimeout = useRef<NodeJS.Timeout | null>(null)

  const [submitting, setSubmitting] = useState(false)

  // Title Presets
  const titlePresets = ['Latihan Rutin', 'Rapat Pengurus', 'Kumpul Mingguan', 'Briefing']

  // Set default custom dates on mount
  useEffect(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const formatLocal = (d: Date) => 
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

    setCustomStartTime(formatLocal(now))
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    setCustomEndTime(formatLocal(later))
  }, [])

  // Load family branches if applicable
  useEffect(() => {
    if (orgSlug) {
      api.get(`/org/${orgSlug}/family/branches`)
        .then(res => {
          if (res.data?.is_family && res.data?.branches?.length > 1) {
            setFamilyBranches(res.data.branches)
          }
        })
        .catch(() => {})
    }
  }, [orgSlug])

  // Map Click / Coordinate Selection Handler with Reverse Geocoding
  const handleMapSelect = async (lat: number, lng: number) => {
    const defaultLabel = `Titik Lokasi (${lat.toFixed(5)}, ${lng.toFixed(5)})`
    setSelectedLocation({
      lat,
      lon: lng,
      display_name: defaultLabel
    })

    // Reverse Geocode to display real human-readable venue/street name
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' }
      })
      const data = await res.json()
      if (data?.display_name) {
        const shortName = data.name || data.display_name.split(',')[0] || data.display_name
        setSelectedLocation({
          lat,
          lon: lng,
          display_name: shortName
        })
        setAddressSearch(shortName)
      }
    } catch (e) {
      // Keep coordinate label if reverse lookup fails
    }
  }

  // Use current GPS location to center map & pin
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung pendeteksian GPS.')
      return
    }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        await handleMapSelect(lat, lng)
        setLocLoading(false)
        toast.success('Titik peta disetel ke lokasi GPS Anda saat ini!')
      },
      (err) => {
        setLocLoading(false)
        toast.error('Gagal membaca GPS. Pastikan izin lokasi aktif.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Clear selected location
  const handleClearLocation = () => {
    setSelectedLocation(null)
    setAddressSearch('')
    setSearchResults([])
    toast.success('Titik lokasi dihapus (sesi dibuka tanpa titik peta khusus).')
  }

  // Address search with Indonesian proximity prioritization
  const handleSearchAddress = (query: string) => {
    setAddressSearch(query)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearchingAddress(true)
      const centerLat = selectedLocation?.lat || -6.2088
      const centerLon = selectedLocation?.lon || 106.8456
      let combinedResults: any[] = []

      // 1. Nominatim restricted strictly to Indonesia (countrycodes=id) with proximity viewbox around current map
      try {
        const d = 0.6 // ~60km bounding box around current map center for prioritization
        const viewbox = `${centerLon - d},${centerLat + d},${centerLon + d},${centerLat - d}`
        const nUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=id&viewbox=${viewbox}&bounded=0&limit=5&addressdetails=1`
        const nRes = await fetch(nUrl, {
          headers: {
            'Accept-Language': 'id-ID,id;q=0.9',
            'User-Agent': 'KitaAtur-App/1.0'
          }
        })
        const nData = await nRes.json()
        if (Array.isArray(nData) && nData.length > 0) {
          const mapped = nData.map((d: any) => ({
            place_id: `nom-${d.place_id}`,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            name: d.name || d.display_name.split(',')[0],
            display_name: d.display_name
          }))
          combinedResults = [...combinedResults, ...mapped]
        }
      } catch (e) {}

      // 2. Photon strictly filtered to Indonesia
      if (combinedResults.length < 4) {
        try {
          const pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${centerLat}&lon=${centerLon}&limit=6`
          const pRes = await fetch(pUrl)
          const pData = await pRes.json()
          if (pData?.features?.length > 0) {
            const idFeatures = pData.features.filter((f: any) => {
              const code = f.properties?.countrycode?.toUpperCase()
              const country = f.properties?.country?.toLowerCase()
              return code === 'ID' || country === 'indonesia'
            })
            if (idFeatures.length > 0) {
              const mappedPhoton = idFeatures.map((f: any) => {
                const p = f.properties
                const shortName = p.name || p.street || query
                const details = [p.street, p.district, p.city || p.county, p.state, 'Indonesia']
                  .filter(Boolean)
                  .filter((x: string) => x !== shortName)
                  .join(', ')
                return {
                  place_id: `photon-${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`,
                  lat: f.geometry.coordinates[1],
                  lon: f.geometry.coordinates[0],
                  name: shortName,
                  display_name: details || 'Indonesia'
                }
              })
              combinedResults = [...combinedResults, ...mappedPhoton]
            }
          }
        } catch (e) {}
      }

      // Deduplicate by proximity coordinates
      const seen = new Set()
      const unique = combinedResults.filter(item => {
        const key = `${item.lat.toFixed(3)},${item.lon.toFixed(3)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setSearchResults(unique.slice(0, 5))
      setIsSearchingAddress(false)
    }, 350)
  }

  // Org search for collaboration
  const handleSearchOrg = (query: string) => {
    setOrgSearch(query)
    if (orgSearchTimeout.current) clearTimeout(orgSearchTimeout.current)
    if (!query.trim() || query.length < 2) {
      setOrgResults([])
      return
    }

    orgSearchTimeout.current = setTimeout(async () => {
      setIsSearchingOrg(true)
      try {
        const res = await api.get(`/org/search?q=${encodeURIComponent(query)}`)
        setOrgResults(res.data)
      } catch (err) {
        console.error('Error searching orgs:', err)
      } finally {
        setIsSearchingOrg(false)
      }
    }, 500)
  }

  const addInvitedOrg = (org: any) => {
    if (org.slug === orgSlug) {
      toast.error('Tidak bisa mengundang organisasi sendiri.')
      return
    }
    if (invitedOrgs.find(o => o.id === org.id)) {
      toast.error('Organisasi sudah ada di daftar undangan.')
      return
    }
    setInvitedOrgs([...invitedOrgs, { id: org.id, name: org.name }])
    setOrgSearch('')
    setOrgResults([])
  }

  const removeInvitedOrg = (id: string) => {
    setInvitedOrgs(invitedOrgs.filter(o => o.id !== id))
  }

  const handleToggleAllFamily = (checked: boolean) => {
    setIncludeAllFamily(checked)
    const otherBranches = familyBranches.filter(b => !b.is_current)
    if (checked) {
      const newInvited = [...invitedOrgs]
      otherBranches.forEach(b => {
        if (!newInvited.some(o => o.id === b.id)) {
          newInvited.push({ id: b.id, name: b.name })
        }
      })
      setInvitedOrgs(newInvited)
    } else {
      const otherIds = new Set(otherBranches.map(b => b.id))
      setInvitedOrgs(invitedOrgs.filter(o => !otherIds.has(o.id)))
    }
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Nama sesi tidak boleh kosong.')
      return
    }

    let startIso: string
    let endIso: string

    if (timingMode === 'now') {
      const startDt = new Date()
      const endDt = new Date(startDt.getTime() + durationHours * 60 * 60 * 1000)
      startIso = startDt.toISOString()
      endIso = endDt.toISOString()
    } else {
      if (!customStartTime || !customEndTime) {
        toast.error('Waktu mulai dan selesai wajib diisi.')
        return
      }
      const s = new Date(customStartTime)
      const e = new Date(customEndTime)
      if (e <= s) {
        toast.error('Waktu selesai harus lebih besar dari waktu mulai.')
        return
      }
      startIso = s.toISOString()
      endIso = e.toISOString()
    }

    // Coordinates: jika dipilih di peta, simpan lat/lon kegiatan. Jika tidak dipilih, 0 / 0.
    const finalLat = selectedLocation ? selectedLocation.lat : 0
    const finalLon = selectedLocation ? selectedLocation.lon : 0
    const finalRadius = 1000000 // Non-blocking radius karena GPS hanya data tambahan, bukan pembatas kehadiran

    // Late time check
    let lateIso: string | null = null
    if (lateTime) {
      const l = new Date(lateTime)
      const s = new Date(startIso)
      const e = new Date(endIso)
      if (l <= s || l >= e) {
        toast.error('Batas telat harus di antara waktu mulai dan waktu selesai.')
        return
      }
      lateIso = l.toISOString()
    }

    // Checkout start time check
    let checkoutStartIso: string | null = null
    if (sessionType === 'in_out' && checkoutStartTime) {
      const c = new Date(checkoutStartTime)
      const s = new Date(startIso)
      const e = new Date(endIso)
      if (c <= s || c >= e) {
        toast.error('Waktu mulai pulang harus di antara waktu mulai dan selesai.')
        return
      }
      checkoutStartIso = c.toISOString()
    }

    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        session_type: sessionType,
        start_time: startIso,
        end_time: endIso,
        late_time: lateIso,
        checkout_start_time: checkoutStartIso,
        latitude: finalLat,
        longitude: finalLon,
        radius_meters: finalRadius,
        invitedOrgs: invitedOrgs.map(o => o.id)
      }

      await api.post(`/org-attendance/${orgSlug}/sessions`, payload)
      toast.success('Sesi presensi berhasil dibuka!')
      router.push(`/org/${orgSlug}/attendance/sessions`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal membuat sesi presensi.')
    } finally {
      setSubmitting(false)
    }
  }

  // Computed summary for quick mode
  const now = new Date()
  const estimatedEnd = new Date(now.getTime() + durationHours * 60 * 60 * 1000)
  const formatHourMin = (d: Date) => 
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button 
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTour(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Panduan</span>
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sesi Baru
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Buat Sesi Presensi
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Buka sesi kehadiran kegiatan atau rapat secara cepat dalam hitungan detik.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* MAIN CARD: Quick & Simple Creation */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
            
            {/* 1. Nama Sesi + Quick Preset Chips */}
            <div data-tour="tour-session-title">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Sesi / Kegiatan
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Contoh: Latihan Rutin, Rapat Divisi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
              />

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {titlePresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTitle(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      title === preset
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pilihan Waktu & Durasi Sesi */}
            <div data-tour="tour-session-timing" className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Waktu & Durasi</span>
                </label>
                
                {/* Mode Switcher */}
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setTimingMode('now')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      timingMode === 'now' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Mulai Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimingMode('custom')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      timingMode === 'custom' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Jadwal Manual
                  </button>
                </div>
              </div>

              {timingMode === 'now' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { hours: 1, label: '1 Jam' },
                      { hours: 2, label: '2 Jam', isDefault: true },
                      { hours: 3, label: '3 Jam' },
                      { hours: 5, label: '5 Jam' }
                    ].map(opt => {
                      const isSelected = durationHours === opt.hours
                      return (
                        <button
                          key={opt.hours}
                          type="button"
                          onClick={() => setDurationHours(opt.hours)}
                          className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold ring-2 ring-blue-500/10'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs block">{opt.label}</span>
                          {opt.isDefault && (
                            <span className="text-[10px] text-blue-500 block font-semibold">Rekomendasi</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                    <span>Estimasi Sesi:</span>
                    <strong className="text-slate-900">
                      Hari ini, {formatHourMin(now)} - {formatHourMin(estimatedEnd)} WIB
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Waktu Mulai</label>
                    <input 
                      type="datetime-local" 
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      required={timingMode === 'custom'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Waktu Selesai</label>
                    <input 
                      type="datetime-local" 
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      required={timingMode === 'custom'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Tipe Presensi (Masuk Saja vs Datang & Pulang) */}
            <div data-tour="tour-session-type" className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tipe Presensi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionType('in_only')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    sessionType === 'in_only'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-xs font-bold ${sessionType === 'in_only' ? 'text-blue-700' : 'text-slate-800'}`}>
                    Hanya Datang
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Presensi kehadiran masuk saja (cocok untuk rapat/latihan rutin).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionType('in_out')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    sessionType === 'in_out'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-xs font-bold ${sessionType === 'in_out' ? 'text-blue-700' : 'text-slate-800'}`}>
                    Datang & Pulang
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Anggota wajib presensi saat datang dan saat kegiatan usai.
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Pemilihan Lokasi Latihan / Kegiatan (Peta Interaktif) */}
            <div data-tour="tour-session-map" className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#EA4335]" />
                    <span>Lokasi Kegiatan / Latihan (Google Maps)</span>
                    <span className="text-[11px] text-slate-400 font-normal lowercase">opsional</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tentukan titik kumpul di Google Maps. Anggota tetap bebas absen tanpa kendala GPS (GPS hanya data tambahan).
                  </p>
                </div>

                {/* Quick actions: Gunakan Lokasi Saya & Hapus */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 text-xs font-bold transition-all border border-blue-200"
                    title="Gunakan titik koordinat perangkat Anda saat ini"
                  >
                    {locLoading ? (
                      <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <NavigationArrow className="w-3.5 h-3.5" />
                    )}
                    <span>Gunakan Lokasi Saya</span>
                  </button>

                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-all"
                      title="Hapus titik lokasi peta"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Titik</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pencarian Alamat / Tempat */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={addressSearch}
                  onChange={(e) => handleSearchAddress(e.target.value)}
                  placeholder="Ketik nama tempat atau alamat di peta (contoh: GOR Bulungan, Lapangan Bola, Gedung Serbaguna)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {isSearchingAddress && (
                  <CircleNotch className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
                )}

                {/* Hasil Pencarian Tempat & Opsi Penamaan Kustom */}
                {(searchResults.length > 0 || (addressSearch.trim().length > 1 && !isSearchingAddress)) && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {/* Hasil Pencarian Tempat Indonesia */}
                    {searchResults.map((result) => {
                      const lat = parseFloat(result.lat);
                      const lon = parseFloat(result.lon);
                      const shortName = result.name || result.display_name.split(',')[0];
                      return (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation({
                              lat,
                              lon,
                              display_name: shortName
                            });
                            setAddressSearch(shortName);
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-blue-50/60 transition-colors text-xs text-slate-700 flex items-start gap-2.5"
                        >
                          <MapPin className="w-4 h-4 text-[#EA4335] shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 truncate">{shortName}</p>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">🇮🇩 Indonesia</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{result.display_name}</p>
                          </div>
                        </button>
                      );
                    })}

                    {/* Opsi Custom Name: Tetapkan teks yang diketik sebagai nama titik lokasi terpilih */}
                    {addressSearch.trim().length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const lat = selectedLocation?.lat || -6.2088;
                          const lon = selectedLocation?.lon || 106.8456;
                          setSelectedLocation({
                            lat,
                            lon,
                            display_name: addressSearch.trim()
                          });
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 hover:bg-blue-100/90 transition-colors text-xs text-blue-900 flex items-center gap-2.5 font-semibold"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-blue-950 truncate">
                            Gunakan nama: "{addressSearch.trim()}"
                          </p>
                          <p className="text-[10px] text-blue-600">
                            {selectedLocation 
                              ? `Terapkan nama ini pada titik pin peta terpilih (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lon.toFixed(4)})` 
                              : 'Pasang titik pin pada peta dengan nama ini'}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Lokasi Terpilih Banner */}
              {selectedLocation && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-blue-950 truncate">
                        {selectedLocation.display_name}
                      </p>
                      <p className="text-[10px] text-blue-600 font-mono">
                        Koordinat: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lon.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-white text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                    Titik Terpasang
                  </span>
                </div>
              )}

              {/* Komponen Peta Interaktif */}
              <div className="relative">
                <MapPicker 
                  initialPosition={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lon } : null}
                  onLocationSelect={handleMapSelect}
                  height="300px"
                />
                <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none">
                  <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
                  <span>Klik di peta untuk pasang / geser pin lokasi</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div data-tour="tour-session-submit" className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-[#0087FF] hover:bg-[#0077E6] active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    <span>Membuka Sesi...</span>
                  </>
                ) : (
                  <span>Buka Sesi Presensi Sekarang</span>
                )}
              </button>
            </div>

          </div>

          {/* ADVANCED SETTINGS COLLAPSIBLE */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Pengaturan Lanjutan (Batas Telat, Pulang, Peta, Kolaborasi)</span>
              </div>
              {showAdvanced ? <CaretUp className="w-4 h-4 text-slate-400" /> : <CaretDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showAdvanced && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-5 animate-in fade-in duration-200 text-xs">
                
                {/* Batas Waktu Keterlambatan */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Batas Waktu Telat (Opsional)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Absen melewati jam ini otomatis berstatus <strong>Telat</strong>.
                      </p>
                    </div>

                    {lateTime && (
                      <button
                        type="button"
                        onClick={() => setLateTime('')}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-all"
                      >
                        ✕ Hapus
                      </button>
                    )}
                  </div>

                  {/* 1-Tap Quick Presets */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Pilihan Cepat (Dari Jam Mulai)
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[15, 30, 45, 60].map((mins) => {
                        const base = getBaseStartTime()
                        const target = new Date(base.getTime() + mins * 60 * 1000)
                        const targetTime = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`
                        const isActive = quickTimeValue === targetTime

                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => handleSetLatePreset(mins)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1 ${
                              isActive
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200/90'
                            }`}
                          >
                            <span>+{mins >= 60 ? '1 Jam' : `${mins} Menit`}</span>
                            <span className={`text-[10px] font-medium opacity-80 ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                              ({targetTime})
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Input Jam Langsung (Tanpa Kalender) */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Atau Pilih Jam & Menit Langsung (Tanpa Tanggal):
                      </label>
                      <div className="relative max-w-[180px]">
                        <input 
                          type="time" 
                          value={quickTimeValue}
                          onChange={(e) => handleQuickTimeChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {lateTime && (
                      <div className="self-start sm:self-auto bg-amber-100/70 border border-amber-300/80 rounded-xl px-3 py-2 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Tercatat Telat Setelah: <strong>{new Date(lateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tanggal Lengkap (Kustom) Collapsible Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomDateLate(!showCustomDateLate)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      {showCustomDateLate ? 'Sembunyikan Pemilih Tanggal Lengkap' : 'Pilih Tanggal Lain (Jika Kegiatan Berbeda Hari)'}
                    </button>
                    {showCustomDateLate && (
                      <div className="mt-2 animate-in fade-in duration-150">
                        <input 
                          type="datetime-local" 
                          value={lateTime}
                          onChange={(e) => setLateTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Jam Pulang (jika in_out) */}
                {sessionType === 'in_out' && (
                  <div>
                    <label className="font-bold text-amber-700 block mb-1">
                      Waktu Mulai Absen Pulang (Opsional)
                    </label>
                    <input 
                      type="datetime-local" 
                      value={checkoutStartTime}
                      onChange={(e) => setCheckoutStartTime(e.target.value)}
                      className="w-full bg-amber-50/50 border border-amber-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mencegah siswa/anggota melakukan absen pulang sebelum jam kegiatan berakhir.
                    </p>
                  </div>
                )}



                {/* Kolaborasi Antar Organisasi */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700 block mb-1">
                    Kolaborasi dengan Organisasi Lain (Opsional)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Undang organisasi atau ekskul mitra untuk bergabung dalam agenda kegiatan bersama ini.
                  </p>

                  {familyBranches.length > 0 && (
                    <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={includeAllFamily}
                        onChange={(e) => handleToggleAllFamily(e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600 rounded"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        Undang semua cabang / divisi keluarga organisasi
                      </span>
                    </label>
                  )}

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={orgSearch}
                      onChange={(e) => handleSearchOrg(e.target.value)}
                      placeholder="Ketik nama organisasi mitra..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  {orgResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-md max-h-36 overflow-y-auto mb-2 divide-y divide-slate-100">
                      {orgResults.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => addInvitedOrg(org)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-medium text-slate-700 flex justify-between items-center"
                        >
                          <span>{org.name}</span>
                          <span className="text-[10px] text-blue-600 font-bold">+ Tambah</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {invitedOrgs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {invitedOrgs.map(org => (
                        <span 
                          key={org.id} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                        >
                          <span>{org.name}</span>
                          <button 
                            type="button" 
                            onClick={() => removeInvitedOrg(org.id)}
                            className="hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </form>

      </main>

      <SpotlightTour
        tourKey="attendance_create_session"
        steps={createSessionTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}
