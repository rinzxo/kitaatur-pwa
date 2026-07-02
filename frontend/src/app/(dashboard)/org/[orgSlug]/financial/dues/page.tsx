'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle, Search, Check, Settings, X, Receipt, Plus, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Member {
  id: string
  joined_at: string
  profile: {
    id: string
    full_name: string
    email: string
  }
  role: string
  custom_data?: any
}

interface OrgSettings {
  dues_target_amount: string | null
  dues_presets: string | null
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
  const [settings, setSettings] = useState<OrgSettings>({ dues_target_amount: null, dues_presets: null })
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

  // User States
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('member')
  const isEditor = currentUserRole === 'bendahara'

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
      
      setMembers(membersData)
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
      
      const res = await api.patch(`/org/${orgSlug}/settings`, {
        dues_target_amount: parsedTarget > 0 ? parsedTarget : null,
        dues_presets: presetsString
      })
      setSettings(res.data)
      setIsSettingsOpen(false)
      toast.success('Pengaturan berhasil disimpan!')
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

  const calculateMonthsSinceJoined = (joinedAt: string) => {
    if (!joinedAt) return 1
    const joined = new Date(joinedAt)
    const now = new Date()
    const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) + 1
    return months > 0 ? months : 1
  }

  const getTunggakan = (m: Member) => {
    const months = calculateMonthsSinceJoined(m.joined_at)
    const expected = months * targetAmount
    const paid = paidTotals[m.profile.id] || 0
    return expected - paid
  }

  const generateMonthlyBreakdown = (m: Member) => {
    if (!m.joined_at || targetAmount <= 0) return []
    const joined = new Date(m.joined_at)
    const now = new Date()
    const totalMonths = calculateMonthsSinceJoined(m.joined_at)
    const paid = paidTotals[m.profile.id] || 0
    
    const breakdown = []
    let currentExpected = 0
    
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
      
      breakdown.push({
        monthName,
        isPaid,
        shortfall
      })
    }
    
    return breakdown.reverse() // show latest first
  }

  const handleExportExcel = () => {
    const dataToExport = members.map(m => {
      const tunggakan = getTunggakan(m)
      const isUnpaid = tunggakan > 0
      
      const rowData: any = {
        'Nama Anggota': m.profile.full_name || 'Tanpa Nama',
        'Email': m.profile.email,
        'Role': m.role,
        'Tanggal Bergabung': m.joined_at ? new Date(m.joined_at).toLocaleDateString('id-ID') : '-',
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
            <p className="text-slate-500 font-medium text-xs mt-1">
              Target: <strong className="text-blue-600">{formatCurrency(targetAmount)}</strong> / bulan
            </p>
          </div>
          {isEditor && (
            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-600 transition-colors shadow-sm"
                title="Export Excel"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
                title="Pengaturan Target"
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

          <div className="flex bg-slate-200/50 p-1 rounded-xl">
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
          <p className="text-sm font-medium text-slate-500 text-center animate-pulse">
            👇 Klik tombol <strong>Tagih</strong> pada anggota di bawah ini.
          </p>
        )}

        {/* Member List */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {activeTab === 'unpaid' && (
            <div className="divide-y divide-slate-100">
              {unpaidMembers.map(member => {
                const paid = paidTotals[member.profile.id] || 0
                const tunggakan = getTunggakan(member)
                
                return (
                  <button
                    key={member.id}
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
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center font-bold text-lg transition-colors shrink-0">
                          {member.profile.full_name?.charAt(0) || '?'}
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
                        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm group-hover:shadow-md group-hover:bg-blue-500 transition-all shrink-0">
                          Tagih
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
              {unpaidMembers.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                  Semua anggota sudah lunas bulan ini! 🎉
                </div>
              )}
            </div>
          )}

          {activeTab === 'paid' && (
            <div className="divide-y divide-slate-100">
              {paidMembers.map(member => (
                <div key={member.id} className="p-4 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="w-5 h-5 font-bold" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {member.profile.full_name || 'Tanpa Nama'}
                      </h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">AMAN / LUNAS (Akumulasi: {formatCurrency(paidTotals[member.profile.id] || 0)})</p>
                    </div>
                  </div>
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
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                  {selectedMember.profile.full_name?.charAt(0) || '?'}
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
                          <p className="font-bold text-slate-800 text-sm">{item.monthName}</p>
                          <p className={`text-xs font-bold mt-0.5 ${item.isPaid ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {item.isPaid ? 'LUNAS' : `Kurang ${formatCurrency(item.shortfall)}`}
                          </p>
                        </div>
                        {!item.isPaid && (
                          <button
                            onClick={() => {
                              setMonth(`Tunggakan ${item.monthName}`)
                              setAmountStr(formatNumberWithDots(item.shortfall.toString()))
                              setActiveModalTab('bayar')
                            }}
                            className="text-xs font-bold bg-white border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors shadow-sm"
                          >
                            Bayar Ini
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                Pengaturan Target
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

              {/* Presets List */}
              <div>
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
                className="flex-1 py-2.5 font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {savingSettings ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
