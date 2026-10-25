'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  MagnifyingGlass as Search, 
  Check, 
  GearSix as Settings, 
  X, 
  Receipt, 
  Plus, 
  DownloadSimple as Download,
  Compass,
  CalendarBlank as Calendar
} from '@phosphor-icons/react'
import { SpotlightTour, type TourStep } from '@/components/ui/SpotlightTour'

interface Member {
  id: string
  joined_at: string
  profile: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  }
  role: string
  custom_data?: any
}

interface OrgSettings {
  dues_target_amount: string | null
  dues_presets: string | null
  dues_start_period?: string | null
  dues_end_period?: string | null
}

// Helpers for Auto-Formatting Currency Inputs
const formatNumberWithDots = (val: string) => {
  if (!val) return ''
  const numericOnly = val.replace(/\D/g, '')
  if (!numericOnly) return ''
  return new Intl.NumberFormat('id-ID').format(parseInt(numericOnly, 10))
}

const parseNumberFromDots = (val: string) => {
  return parseInt(val.replace(/\D/g, ''), 10) || 0
}

export default function OrgDuesCollectionPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  // Data states
  const [members, setMembers] = useState<Member[]>([])
  const [paidTotals, setPaidTotals] = useState<Record<string, number>>({}) // profile_id -> total paid this month
  const [settings, setSettings] = useState<OrgSettings>({ dues_target_amount: null, dues_presets: null, dues_start_period: null, dues_end_period: null })
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid')
  
  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [targetAmountStr, setTargetAmountStr] = useState('')
  const [presetList, setPresetList] = useState<number[]>([10000, 20000, 50000])
  const [newPresetStr, setNewPresetStr] = useState('')
  const [periodMode, setPeriodMode] = useState<'auto' | 'custom'>('auto')
  const [duesStartPeriod, setDuesStartPeriod] = useState<string>('')
  const [duesEndPeriod, setDuesEndPeriod] = useState<string>('')
  const [savingSettings, setSavingSettings] = useState(false)

  // Payment Modal state (Central Input)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [amountStr, setAmountStr] = useState('')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  })
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'bayar' | 'rincian'>('rincian')

  // Spotlight Walkthrough Tour
  const [showTour, setShowTour] = useState(false)
  const duesTourSteps: TourStep[] = [
    {
      target: '[data-tour="tour-target-header"]',
      title: 'Target Kas Bulanan',
      description: 'Menampilkan target nominal iuran kas rutin per anggota per bulan. Nominal ini dijadikan acuan dasar kewajiban kas bulanan anggota.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-period-badge"]',
      title: 'Rentang Periode Kas Organisasi',
      description: 'Periode kas dapat dibatasi sesuai masa kepengurusan (misal: September 2026 s.d. September 2027) atau berjalan otomatis sejak anggota bergabung. Klik badge ini kapan saja untuk mengubahnya.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-dues-settings"]',
      title: 'Pengaturan Target, Periode & Preset',
      description: 'Pengurus (Ketua & Bendahara) dapat mengubah target kas, menentukan batas bulan mulai & selesai periode, serta mengatur tombol nominal preset cepat untuk mempermudah pencatatan.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-dues-tabs"]',
      title: 'Daftar Nunggak vs Aman / Lunas',
      description: 'Tunggakan kas HANYA dihitung dari bulan mulai periode sampai bulan saat ini yang telah jatuh tempo. Bulan-bulan di depan belum jatuh tempo dan tidak dihitung sebagai tunggakan!',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-tagih-btn"]',
      title: 'Catat Kas & Rincian Bulanan',
      description: 'Klik kartu anggota untuk membuka lembar tagihan: pantau rincian bulan yang sudah lunas, lunasi tunggakan, catat pembayaran kas di awal (prepaid) untuk bulan mendatang, atau kirim tagihan WhatsApp otomatis.',
      position: 'bottom'
    },
    {
      target: '[data-tour="tour-export-excel"]',
      title: 'Ekspor Rekapitulasi Kas Excel',
      description: 'Unduh rekapitulasi data pembayaran kas seluruh anggota dalam format Excel rapi untuk arsip pertanggungjawaban bendahara, lengkap dengan status akumulasi dan periode kas.',
      position: 'bottom'
    }
  ]

  // User States
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const isEditor = currentUserRole === 'bendahara' || currentUserRole === 'head' || currentUserRole === 'vice_head'

  const router = useRouter()

  // Derived state
  const targetAmount = settings.dues_target_amount ? parseFloat(settings.dues_target_amount) : 0
  const presets = presetList.length > 0 ? presetList : [10000, 20000, 50000]

  useEffect(() => {
    checkRoleAndLoad()
  }, [orgSlug])

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUserId(user.id)

    try {
      const membersRes = await api.get(`/org/${orgSlug}/members`)
      const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
      if (currentMember) {
        setCurrentUserRole(currentMember.role)
      } else {
        router.push('/personal/dashboard')
        return
      }
      await fetchData(membersRes.data)
    } catch (err) {
      console.error('Error fetching role:', err)
      setLoading(false)
    }
  }

  const fetchData = async (membersData: Member[]) => {
    try {
      const [recordsRes, settingsRes] = await Promise.all([
        api.get(`/org-financial/${orgSlug}`),
        api.get(`/org/${orgSlug}/settings`)
      ])
      
      setMembers(membersData.filter(m => m.role !== 'auditor'))
      setSettings(settingsRes.data)
      
      // Populate settings states
      if (settingsRes.data?.dues_target_amount) {
        setTargetAmountStr(formatNumberWithDots(settingsRes.data.dues_target_amount))
      } else {
        setTargetAmountStr('50.000')
      }

      if (settingsRes.data?.dues_presets) {
        const arr = settingsRes.data.dues_presets.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
        if (arr.length > 0) setPresetList(arr)
      }

      if (settingsRes.data?.dues_start_period) {
        setDuesStartPeriod(settingsRes.data.dues_start_period)
        setPeriodMode('custom')
      } else {
        setDuesStartPeriod('')
        setPeriodMode('auto')
      }
      setDuesEndPeriod(settingsRes.data?.dues_end_period || '')
      
      if (settingsRes.data?.custom_fields_schema) {
        setCustomFieldsSchema(settingsRes.data.custom_fields_schema)
      }
      
      // Track paid totals all-time
      const totals: Record<string, number> = {}
      
      recordsRes.data.forEach((record: any) => {
        if (record.category === 'Uang Kas') {
          totals[record.profile_id] = (totals[record.profile_id] || 0) + parseFloat(record.amount)
        }
      })
      
      setPaidTotals(totals)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPreset = () => {
    const val = parseNumberFromDots(newPresetStr)
    if (val > 0 && !presetList.includes(val)) {
      setPresetList([...presetList, val].sort((a, b) => a - b))
      setNewPresetStr('')
    }
  }

  const handleRemovePreset = (valToRemove: number) => {
    setPresetList(presetList.filter(p => p !== valToRemove))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const parsedTarget = parseNumberFromDots(targetAmountStr)
      const presetsString = presetList.join(',')
      
      const payload: any = {
        dues_target_amount: parsedTarget > 0 ? parsedTarget : null,
        dues_presets: presetsString,
        dues_start_period: periodMode === 'custom' && duesStartPeriod ? duesStartPeriod : null,
        dues_end_period: periodMode === 'custom' && duesStartPeriod && duesEndPeriod ? duesEndPeriod : null
      }

      const res = await api.patch(`/org/${orgSlug}/settings`, payload)
      setSettings(res.data)
      setIsSettingsOpen(false)
      toast.success('Pengaturan iuran & periode kas berhasil disimpan!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengaturan')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedMember) {
      toast.error('Pilih anggota terlebih dahulu!')
      return
    }
    const finalAmount = parseNumberFromDots(amountStr)
    if (!finalAmount || finalAmount <= 0) {
      toast.error('Masukkan nominal yang valid!')
      return
    }

    setProcessing(selectedMember.id)
    try {
      const res = await api.post(`/org-financial/${orgSlug}`, {
        amount: finalAmount,
        type: 'income',
        category: 'Uang Kas',
        description: `Pembayaran Uang Kas ${month} - ${selectedMember.profile.full_name}`,
        member_profile_id: selectedMember.profile.id
      })

      const newRecord = res.data

      // Update state locally
      setPaidTotals(prev => ({
        ...prev,
        [selectedMember.profile.id]: (prev[selectedMember.profile.id] || 0) + finalAmount
      }))
      
      // Close modal
      setSelectedMember(null)
      setAmountStr('')
      
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal memproses pembayaran')
    } finally {
      setProcessing(null)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
  }

  const formatPeriodLabel = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr) return 'Sejak Bergabung (Otomatis)'
    const [sY, sM] = startStr.split('-').map(Number)
    const startDate = new Date(sY, sM - 1, 1)
    const startName = startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    
    if (endStr) {
      const [eY, eM] = endStr.split('-').map(Number)
      const endDate = new Date(eY, eM - 1, 1)
      const endName = endDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
      const count = (eY - sY) * 12 + (eM - sM) + 1
      return `${startName} - ${endName} (${count} Bulan)`
    }
    
    return `Mulai ${startName} (Berjalan)`
  }

  const getPeriodMonthsList = () => {
    const startStr = settings.dues_start_period
    const endStr = settings.dues_end_period
    
    if (!startStr) return null // auto mode
    
    const [sYear, sMonth] = startStr.split('-').map(Number)
    let eYear: number
    let eMonth: number
    
    if (endStr) {
      const [endY, endM] = endStr.split('-').map(Number)
      eYear = endY
      eMonth = endM
    } else {
      const now = new Date()
      eYear = now.getFullYear()
      eMonth = now.getMonth() + 1
    }
    
    const count = (eYear - sYear) * 12 + (eMonth - sMonth) + 1
    if (count <= 0) return []
    
    const list = []
    for (let i = 0; i < count; i++) {
      const d = new Date(sYear, sMonth - 1 + i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthName = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
      list.push({ monthStr, monthName, date: d })
    }
    return list
  }

  const calculateMonthsSinceJoined = (joinedAt: string) => {
    if (!joinedAt) return 1
    const joined = new Date(joinedAt)
    const now = new Date()
    const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1
    return months > 0 ? months : 1
  }

  // Menghitung jumlah bulan yang sudah berjalan/jatuh tempo sampai saat ini (now)
  const calculateElapsedMonths = (m?: Member) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    const startStr = settings.dues_start_period
    const endStr = settings.dues_end_period

    if (startStr) {
      const [sY, sM] = startStr.split('-').map(Number)

      // Jika sekarang masih sebelum bulan mulai periode, belum ada bulan yang jatuh tempo (0 bulan)
      if (currentYear < sY || (currentYear === sY && currentMonth < sM)) {
        return 0
      }

      // Default batas akhir adalah bulan berjalan sekarang (now)
      let eY = currentYear
      let eM = currentMonth

      // Namun jika ada bulan selesai dan sekarang sudah melewati bulan selesai, batasi sampai bulan selesai
      if (endStr) {
        const [endY, endM] = endStr.split('-').map(Number)
        if (currentYear > endY || (currentYear === endY && currentMonth >= endM)) {
          eY = endY
          eM = endM
        }
      }

      const elapsed = (eY - sY) * 12 + (eM - sM) + 1
      return Math.max(0, elapsed)
    }

    // Mode Otomatis (sejak tanggal bergabung sampai sekarang)
    if (!m?.joined_at) return 1
    const joined = new Date(m.joined_at)
    const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1
    return Math.max(1, months)
  }

  const getTunggakan = (m: Member) => {
    // Tunggakan HANYA dihitung dari bulan start sampai bulan berjalan sekarang (elapsed), bukan bulan di depannya
    const elapsedMonths = calculateElapsedMonths(m)
    const expected = elapsedMonths * targetAmount
    const paid = paidTotals[m.profile.id] || 0
    return Math.max(0, expected - paid)
  }

  const generateMonthlyBreakdown = (m: Member) => {
    if (targetAmount <= 0) return []
    const paid = paidTotals[m.profile.id] || 0
    const customList = getPeriodMonthsList()
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const breakdown = []
    let currentExpected = 0
    
    if (customList !== null) {
      for (const item of customList) {
        currentExpected += targetAmount
        let isPaid = paid >= currentExpected
        let shortfall = 0
        if (!isPaid) {
          if (paid > currentExpected - targetAmount) {
            shortfall = currentExpected - paid
          } else {
            shortfall = targetAmount
          }
        }

        const [itemY, itemM] = item.monthStr.split('-').map(Number)
        const isFuture = (itemY > currentYear) || (itemY === currentYear && itemM > currentMonth)

        breakdown.push({
          monthName: item.monthName,
          isPaid,
          shortfall,
          isFuture
        })
      }
    } else {
      if (!m.joined_at) return []
      const joined = new Date(m.joined_at)
      const totalMonths = calculateMonthsSinceJoined(m.joined_at)
      for (let i = 0; i < totalMonths; i++) {
        const d = new Date(joined.getFullYear(), joined.getMonth() + i, 1)
        const monthName = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
        currentExpected += targetAmount
        
        let isPaid = paid >= currentExpected
        let shortfall = 0
        if (!isPaid) {
          if (paid > currentExpected - targetAmount) {
            shortfall = currentExpected - paid
          } else {
            shortfall = targetAmount
          }
        }

        const isFuture = (d.getFullYear() > currentYear) || (d.getFullYear() === currentYear && (d.getMonth() + 1) > currentMonth)

        breakdown.push({
          monthName,
          isPaid,
          shortfall,
          isFuture
        })
      }
    }
    
    return breakdown.reverse() // show latest first
  }

  const handleExportExcel = async () => {
    const dataToExport = members.map(m => {
      const tunggakan = getTunggakan(m)
      const isUnpaid = tunggakan > 0
      
      const rowData: any = {
        'Nama Anggota': m.profile.full_name || 'Tanpa Nama',
        'Email': m.profile.email,
        'Role': m.role,
        'Tanggal Bergabung': m.joined_at ? new Date(m.joined_at).toLocaleDateString('id-ID') : '-',
        'Periode Kas': formatPeriodLabel(settings.dues_start_period, settings.dues_end_period),
        'Bulan Jatuh Tempo': calculateElapsedMonths(m),
        'Akumulasi Dibayar': paidTotals[m.profile.id] || 0,
        'Jumlah Nunggak': isUnpaid ? tunggakan : 0,
        'Status': isUnpaid ? 'Nunggak' : 'Aman/Lunas'
      }
      
      // Add custom fields
      customFieldsSchema.forEach(field => {
        rowData[field.label] = m.custom_data ? (m.custom_data[field.id] || '-') : '-'
      })
      
      rowData['Akumulasi Dibayar'] = paidTotals[m.profile.id] || 0
      rowData['Jumlah Nunggak'] = isUnpaid ? tunggakan : 0
      rowData['Status'] = isUnpaid ? 'Nunggak' : 'Aman/Lunas'
      
      return rowData
    })

    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tunggakan Kas")
    XLSX.writeFile(workbook, `Tunggakan_Kas_${orgSlug}_${new Date().getTime()}.xlsx`)
  }

  const filteredMembers = members.filter(m => 
    m.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unpaidMembers = filteredMembers.filter(m => getTunggakan(m) > 0)
  const paidMembers = filteredMembers.filter(m => getTunggakan(m) <= 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 relative animate-pulse">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div>
              <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-32 bg-slate-200 rounded mb-1"></div>
              <div className="h-4 w-40 bg-slate-200 rounded"></div>
            </div>
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
          <div className="space-y-4">
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
            <div className="h-10 w-full bg-slate-200 rounded-xl"></div>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 md:p-5 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-slate-200 rounded"></div>
                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="h-8 w-20 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <Link 
              href={`/org/${orgSlug}/financial`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Keuangan
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-blue-600" />
              Tagih Kas
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p data-tour="tour-target-header" className="text-slate-500 font-medium text-xs">
                Target: <strong className="text-blue-600">{formatCurrency(targetAmount)}</strong> / bulan
              </p>
              <span className="text-slate-300">•</span>
              <p className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
                <span>Periode:</span>
                <button
                  data-tour="tour-period-badge"
                  type="button"
                  onClick={() => isEditor && setIsSettingsOpen(true)}
                  disabled={!isEditor}
                  className={`font-bold px-2 py-0.5 rounded-md text-[11px] transition-all ${
                    settings.dues_start_period 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-slate-100 text-slate-700'
                  } ${isEditor ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer' : 'cursor-default'}`}
                  title={isEditor ? "Klik untuk mengubah periode kas" : undefined}
                >
                  {formatPeriodLabel(settings.dues_start_period, settings.dues_end_period)}
                </button>
              </p>
            </div>
          </div>
          {isEditor && (
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowTour(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl font-bold text-xs transition-colors shadow-2xs"
                title="Panduan Interaktif Fitur"
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
              <button
                data-tour="tour-export-excel"
                onClick={handleExportExcel}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-600 transition-colors shadow-sm"
                title="Export Excel"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                data-tour="tour-dues-settings"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                title="Pengaturan Target & Periode"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold w-full outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            />
          </div>

          <div data-tour="tour-dues-tabs" className="flex bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'unpaid' 
                  ? 'bg-white text-rose-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Nunggak ({unpaidMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('paid')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'paid' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Aman / Lunas ({paidMembers.length})
            </button>
          </div>
        </div>

        {/* Info Helper Text */}
        {activeTab === 'unpaid' && unpaidMembers.length > 0 && (
          <p className="text-xs font-medium text-slate-500 text-center">
            Pilih tombol <strong>Tagih</strong> pada anggota di bawah ini untuk mencatat kas.
          </p>
        )}

        {/* Member List */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {activeTab === 'unpaid' && (
            <div className="divide-y divide-slate-100">
              {unpaidMembers.map((member, index) => {
                const paid = paidTotals[member.profile.id] || 0
                const tunggakan = getTunggakan(member)
                
                return (
                  <button
                    key={member.id}
                    data-tour={index === 0 ? "tour-tagih-btn" : undefined}
                    onClick={() => {
                      if (!isEditor) return;
                      setSelectedMember(member)
                      setAmountStr('') // reset amount when opening modal
                      setActiveModalTab('rincian')
                    }}
                    className={`w-full text-left p-4 flex flex-col gap-3 group transition-colors ${isEditor ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center font-bold text-lg transition-colors shrink-0 overflow-hidden relative">
                          {member.profile.avatar_url ? (
                            <img src={member.profile.avatar_url} alt={member.profile.full_name || ''} className="w-full h-full object-cover" />
                          ) : (
                            member.profile.full_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {member.profile.full_name || 'Tanpa Nama'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Akumulasi: <span className="font-bold text-slate-700">{formatCurrency(paid)}</span> | Nunggak: <span className="font-bold text-rose-600">{formatCurrency(tunggakan)}</span>
                          </p>
                        </div>
                      </div>
                      {isEditor && (
                        <div className="bg-[#0087FF] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm group-hover:shadow-md group-hover:bg-blue-500 transition-all shrink-0">
                          Tagih
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
              {unpaidMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                  Semua anggota sudah lunas bulan ini.
                </div>
              )}
            </div>
          )}

          {activeTab === 'paid' && (
            <div className="divide-y divide-slate-100">
              {paidMembers.map((member, index) => (
                <div 
                  key={member.id} 
                  data-tour={index === 0 && unpaidMembers.length === 0 ? "tour-tagih-btn" : undefined}
                  onClick={() => {
                    if (!isEditor) return;
                    setSelectedMember(member)
                    setAmountStr('')
                    setActiveModalTab('rincian')
                  }}
                  className={`p-4 flex justify-between items-center bg-slate-50/50 transition-colors ${
                    isEditor ? 'hover:bg-blue-50 cursor-pointer group' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-emerald-400">
                        {member.profile.avatar_url ? (
                          <img src={member.profile.avatar_url} alt={member.profile.full_name || ''} className="w-full h-full object-cover" />
                        ) : (
                          member.profile.full_name?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white">
                        <Check className="w-3 h-3 text-white font-bold" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {member.profile.full_name || 'Tanpa Nama'}
                      </h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">AMAN / LUNAS (Akumulasi: {formatCurrency(paidTotals[member.profile.id] || 0)})</p>
                    </div>
                  </div>
                  {isEditor && (
                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors">
                      Lihat Rincian
                    </span>
                  )}
                </div>
              ))}
              {paidMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                  Belum ada anggota yang lunas.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal (Bottom Sheet on Mobile) */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900">Catat Pembayaran Kas</h3>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-1.5 bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Member Info */}
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden">
                  {selectedMember.profile.avatar_url ? (
                    <img src={selectedMember.profile.avatar_url} alt={selectedMember.profile.full_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    selectedMember.profile.full_name?.charAt(0) || '?'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedMember.profile.full_name || 'Tanpa Nama'}</h3>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Terkumpul: <span className="font-bold text-blue-600">{formatCurrency(paidTotals[selectedMember.profile.id] || 0)}</span> | Nunggak: <span className="font-bold text-rose-600">{formatCurrency(getTunggakan(selectedMember))}</span>
                  </div>
                </div>
              </div>

              {/* Tabs Modal */}
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveModalTab('rincian')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeModalTab === 'rincian' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Rincian per Bulan
                </button>
                <button
                  onClick={() => setActiveModalTab('bayar')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeModalTab === 'bayar' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Bayar Manual
                </button>
              </div>

              {activeModalTab === 'rincian' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Tagihan Virtual</h4>
                  <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                    {generateMonthlyBreakdown(selectedMember).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-800 text-sm">{item.monthName}</p>
                            {item.isFuture && !item.isPaid && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                Bulan Mendatang
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-bold mt-0.5 ${
                            item.isPaid 
                              ? 'text-emerald-600' 
                              : item.isFuture 
                                ? 'text-slate-500' 
                                : 'text-rose-500'
                          }`}>
                            {item.isPaid 
                              ? (item.isFuture ? 'LUNAS (DI MUKA)' : 'LUNAS') 
                              : item.isFuture 
                                ? `Belum Jatuh Tempo (${formatCurrency(item.shortfall)})` 
                                : `NUNGGAK (${formatCurrency(item.shortfall)})`}
                          </p>
                        </div>
                        {!item.isPaid && (
                          <button
                            onClick={() => {
                              setMonth(`Kas ${item.monthName}`)
                              setAmountStr(formatNumberWithDots(item.shortfall.toString()))
                              setActiveModalTab('bayar')
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm border ${
                              item.isFuture
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            {item.isFuture ? 'Bayar di Awal' : 'Bayar Ini'}
                          </button>
                        )}
                        {item.isPaid && (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    {generateMonthlyBreakdown(selectedMember).length === 0 && (
                      <p className="text-center text-sm text-slate-500">Belum ada tagihan.</p>
                    )}
                  </div>
                </div>
              )}

              {activeModalTab === 'bayar' && (
                <div className="space-y-6">
                  {/* Input Periode Pembayaran */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Periode Pembayaran
                    </label>
                    <input 
                      type="text" 
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      placeholder="Misal: Januari-Maret 2026"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Anda bisa mengubah keterangan periode secara bebas.</p>
                  </div>

                  {/* Nominal Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Pilih Nominal Masuk
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {presets.map(preset => {
                        const presetStr = formatNumberWithDots(preset.toString())
                        return (
                          <button
                            key={preset}
                            onClick={() => setAmountStr(presetStr)}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                              amountStr === presetStr 
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {presetStr}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">Rp</span>
                      </div>
                      <input 
                        type="text" 
                        value={amountStr}
                        onChange={(e) => setAmountStr(formatNumberWithDots(e.target.value))}
                        placeholder="Nominal lainnya (Manual)..."
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleProcessPayment()
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    disabled={processing !== null || parseNumberFromDots(amountStr) <= 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Memproses...' : 'Simpan Pembayaran'}
                    {!processing && <CheckCircle className="h-5 w-5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                Pengaturan Iuran & Periode Kas
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Target Iuran */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Target Kas per Bulan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-sm">Rp</span>
                  </div>
                  <input 
                    type="text" 
                    value={targetAmountStr}
                    onChange={(e) => setTargetAmountStr(formatNumberWithDots(e.target.value))}
                    placeholder="50.000"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Periode Kas Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Periode Perhitungan Kas</span>
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    Opsi Periode
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Pilih apakah iuran dihitung otomatis sejak tanggal bergabung anggota, atau ditentukan rentang bulan tertentu oleh bendahara.
                </p>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPeriodMode('auto')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      periodMode === 'auto'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Otomatis (Join Date)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodMode('custom')
                      if (!duesStartPeriod) {
                        const now = new Date()
                        setDuesStartPeriod(`${now.getFullYear()}-01`)
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      periodMode === 'custom'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Atur Periode Khusus
                  </button>
                </div>

                {periodMode === 'custom' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Bulan Mulai (Dari)
                        </label>
                        <input
                          type="month"
                          value={duesStartPeriod}
                          onChange={(e) => setDuesStartPeriod(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Bulan Selesai (Sampai)
                        </label>
                        <input
                          type="month"
                          value={duesEndPeriod}
                          onChange={(e) => setDuesEndPeriod(e.target.value)}
                          placeholder="Kosongkan jika berjalan"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                      {duesStartPeriod ? (
                        <>
                          <strong>Status:</strong> Kas hanya akan ditagihkan untuk rentang{' '}
                          <span className="font-extrabold underline">
                            {formatPeriodLabel(duesStartPeriod, duesEndPeriod || null)}
                          </span>
                          . Bulan di luar rentang ini tidak akan dihitung sebagai tunggakan.
                        </>
                      ) : (
                        'Pilih bulan mulai untuk mengaktifkan periode perhitungan kas.'
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Presets List */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Daftar Pilihan Nominal (Preset)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {presetList.map(preset => (
                    <div key={preset} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-bold">
                      Rp {formatNumberWithDots(preset.toString())}
                      <button 
                        onClick={() => handleRemovePreset(preset)}
                        className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add New Preset */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-bold text-sm">Rp</span>
                    </div>
                    <input 
                      type="text" 
                      value={newPresetStr}
                      onChange={(e) => setNewPresetStr(formatNumberWithDots(e.target.value))}
                      placeholder="Nominal baru..."
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPreset()
                      }}
                    />
                  </div>
                  <button
                    onClick={handleAddPreset}
                    disabled={!newPresetStr}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-2.5 font-bold text-sm text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex-1 py-2.5 font-bold text-sm text-white bg-[#0087FF] hover:bg-[#0077E6] rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Spotlight Tour */}
      <SpotlightTour
        tourKey="financial_dues"
        steps={duesTourSteps}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

    </div>
  )
}
