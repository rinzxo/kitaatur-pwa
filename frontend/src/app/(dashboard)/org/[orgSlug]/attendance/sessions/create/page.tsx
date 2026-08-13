'use client'
import toast from 'react-hot-toast'


import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { api } from '@/lib/api'
import { Calendar, Clock, MapPin, ChevronLeft, Save, Search, MapPinIcon, Users, X } from 'lucide-react'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function CreateSessionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string

  const [title, setTitle] = useState('Sesi Absensi')
  const [sessionType, setSessionType] = useState<'in_only' | 'in_out'>('in_only')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [lateTime, setLateTime] = useState('')
  const [checkoutStartTime, setCheckoutStartTime] = useState('')
  const [radius, setRadius] = useState(50)
  
  const [locationSource, setLocationSource] = useState<'device' | 'manual'>('device')
  const [addressSearch, setAddressSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number, display_name: string} | null>(null)

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const orgSearchTimeout = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(false)

  const [invitedOrgs, setInvitedOrgs] = useState<{id: string, name: string}[]>([])
  const [orgSearch, setOrgSearch] = useState('')
  const [orgResults, setOrgResults] = useState<any[]>([])
  const [isSearchingOrg, setIsSearchingOrg] = useState(false)

  const handleSearchOrg = (query: string) => {
    setOrgSearch(query)
    
    if (orgSearchTimeout.current) {
      clearTimeout(orgSearchTimeout.current)
    }

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
        console.error('Error fetching orgs:', err)
      } finally {
        setIsSearchingOrg(false)
      }
    }, 500)
  }

  const addInvitedOrg = (org: any) => {
    if (org.slug === orgSlug) {
      toast.error('Tidak bisa mengundang organisasi sendiri')
      return
    }
    if (invitedOrgs.find(o => o.id === org.id)) {
      toast.error('Organisasi sudah ditambahkan')
      return
    }
    setInvitedOrgs([...invitedOrgs, { id: org.id, name: org.name }])
    setOrgSearch('')
    setOrgResults([])
  }

  const removeInvitedOrg = (id: string) => {
    setInvitedOrgs(invitedOrgs.filter(o => o.id !== id))
  }

  const handleSearchAddress = (query: string) => {
    setAddressSearch(query)
    setSelectedLocation(null)
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    // Cek apakah user mem-paste koordinat langsung (contoh: -6.2088, 106.8456)
    const coordRegex = /^(-?\d+\.\d+)(?:,|\s+)\s*(-?\d+\.\d+)$/
    const coordMatch = query.match(coordRegex)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lon = parseFloat(coordMatch[2])
      setSelectedLocation({ lat, lon, display_name: `Koordinat Manual: ${lat}, ${lon}` })
      setSearchResults([])
      return
    }

    // Cek apakah user mem-paste URL Google Maps (mengandung @lat,lng)
    const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
    const urlMatch = query.match(urlRegex)
    if (urlMatch) {
      const lat = parseFloat(urlMatch[1])
      const lon = parseFloat(urlMatch[2])
      setSelectedLocation({ lat, lon, display_name: `Lokasi dari Google Maps` })
      setSearchResults([])
      return
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
          headers: {
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
          }
        })
        const data = await res.json()
        setSearchResults(data)
      } catch (err) {
        console.error('Error fetching address:', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const startDt = new Date(startTime)
    const endDt = new Date(endTime)

    if (endDt <= startDt) {
      toast.error('Waktu Selesai harus lebih besar dari Waktu Mulai')
      setLoading(false)
      return
    }

    if (lateTime) {
      const lateDt = new Date(lateTime)
      if (lateDt <= startDt || lateDt >= endDt) {
        toast.error('Batas keterlambatan harus berada di antara Waktu Mulai dan Waktu Selesai')
        setLoading(false)
        return
      }
    }

    if (sessionType === 'in_out' && checkoutStartTime) {
      const checkoutDt = new Date(checkoutStartTime)
      if (checkoutDt <= startDt || checkoutDt >= endDt) {
        toast.error('Waktu mulai absen pulang harus di antara Waktu Mulai dan Waktu Selesai')
        setLoading(false)
        return
      }
    }

    const submitData = async (latitude: number, longitude: number) => {
      try {
        const payload = {
          title,
          session_type: sessionType,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          late_time: lateTime ? new Date(lateTime).toISOString() : null,
          checkout_start_time: (sessionType === 'in_out' && checkoutStartTime) ? new Date(checkoutStartTime).toISOString() : null,
          latitude,
          longitude,
          radius_meters: radius,
          invitedOrgs: invitedOrgs.map(o => o.id)
        }

        await api.post(`/org-attendance/${orgSlug}/sessions`, payload)
        toast.success('Sesi berhasil dibuat!')
        router.push(`/org/${orgSlug}/attendance/sessions`)
      } catch (err: any) {
        toast.error('Gagal membuat sesi absensi: ' + (err.response?.data?.error || err.message))
      } finally {
        setLoading(false)
      }
    }

    if (locationSource === 'manual') {
      if (!selectedLocation) {
        toast.error('Pilih lokasi pada peta terlebih dahulu.')
        setLoading(false)
        return
      }
      await submitData(selectedLocation.lat, selectedLocation.lon)
      return
    }

    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung GPS.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => submitData(position.coords.latitude, position.coords.longitude),
      (error) => {
        toast.error('Gagal mendapatkan lokasi. Izinkan akses GPS terlebih dahulu.')
        setLoading(false)
      }, 
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Buat Sesi Absensi</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Sesi (Acara/Kegiatan)</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                placeholder="Contoh: Rapat Paripurna"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Absensi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionType('in_only')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    sessionType === 'in_only' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Hanya Datang
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('in_out')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    sessionType === 'in_out' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Datang & Pulang
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" /> Pengaturan Waktu
            </h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Mulai</label>
              <input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Selesai (Tutup Sesi)</label>
              <input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Batas Keterlambatan (Opsional)</label>
              <input 
                type="datetime-local" 
                value={lateTime}
                onChange={(e) => setLateTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 font-medium text-slate-800"
              />
              <p className="text-xs text-slate-500 mt-1">Jika dikosongkan, anggota tidak akan pernah ditandai terlambat.</p>
            </div>
            
            {sessionType === 'in_out' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold mb-2 text-orange-600">Waktu Mulai Absen Pulang</label>
                <input 
                  type="datetime-local" 
                  value={checkoutStartTime}
                  onChange={(e) => setCheckoutStartTime(e.target.value)}
                  required
                  className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 font-medium text-slate-800"
                />
                <p className="text-xs text-orange-600/80 mt-1">
                  Anggota tidak bisa absen pulang sebelum waktu ini. Mencegah anggota "titip absen pulang" di awal acara.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Koordinat Kehadiran
            </h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sumber Lokasi</label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setLocationSource('device')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    locationSource === 'device' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  GPS Perangkat
                </button>
                <button
                  type="button"
                  onClick={() => setLocationSource('manual')}
                  className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all ${
                    locationSource === 'manual' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Input Manual (Maps)
                </button>
              </div>
            </div>

            {locationSource === 'device' ? (
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                Titik GPS pusat akan otomatis diambil dari lokasi perangkat Anda saat Anda menekan tombol "Simpan & Buat Sesi". Pastikan Anda berada di lokasi acara saat membuat sesi ini dan mengizinkan akses lokasi.
              </p>
            ) : (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cari alamat lalu geser peta untuk menentukan titik koordinat yang paling akurat.
                </p>
                <div>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      value={addressSearch}
                      onChange={(e) => handleSearchAddress(e.target.value)}
                      placeholder="Cari lokasi (contoh: Monas, Jakarta)..."
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium text-slate-800 transition-all"
                    />
                    {isSearching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute z-50 left-4 right-4 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto mb-4">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation({ lat: parseFloat(result.lat), lon: parseFloat(result.lon), display_name: result.name || result.display_name.split(',')[0] })
                            setAddressSearch(result.name || result.display_name.split(',')[0])
                            setSearchResults([])
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-3"
                        >
                          <MapPinIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{result.name || result.display_name.split(',')[0]}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{result.display_name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 relative z-0">
                    <MapPicker 
                      initialPosition={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lon } : undefined}
                      onLocationSelect={(lat, lng) => {
                        setSelectedLocation({ lat, lon: lng, display_name: "Titik Pin Peta" })
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      *Klik dimana saja pada peta untuk meletakkan atau memindahkan pin lokasi.
                    </p>
                  </div>

                  {selectedLocation && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                      <MapPinIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Titik Koordinat Terpilih</p>
                        <p className="text-xs text-blue-800 line-clamp-2 mt-0.5">{selectedLocation.display_name}</p>
                        <p className="text-xs font-mono text-blue-600 mt-1">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Radius Maksimal (Meter)</label>
              <input 
                type="number" 
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" /> Kolaborasi Agenda (Opsional)
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              Undang organisasi lain untuk bergabung di sesi absensi ini secara bersamaan.
            </p>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                value={orgSearch}
                onChange={(e) => handleSearchOrg(e.target.value)}
                placeholder="Cari nama organisasi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 text-sm font-medium text-slate-800 transition-all"
              />
              {isSearchingOrg && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {orgResults.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-h-60 overflow-y-auto mt-2">
                {orgResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => addInvitedOrg(result)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-800">{result.name}</p>
                    <p className="text-xs text-slate-500">@{result.slug}</p>
                  </button>
                ))}
              </div>
            )}

            {invitedOrgs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {invitedOrgs.map((org) => (
                  <div key={org.id} className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    {org.name}
                    <button type="button" onClick={() => removeInvitedOrg(org.id)} className="text-blue-500 hover:text-blue-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" /> Simpan & Buat Sesi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
