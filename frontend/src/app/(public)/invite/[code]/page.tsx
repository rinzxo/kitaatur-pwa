'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { api, supabase } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Link as LinkIcon, Building2, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

interface OrgPreview {
  id: string
  name: string
  slug: string
  logo_url: string | null
  custom_fields_schema?: any[]
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [org, setOrg] = useState<OrgPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [customData, setCustomData] = useState<any>({})

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsLoggedIn(!!session)

        const res = await api.get(`/org/invite/${code}`)
        setOrg(res.data.organization)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.error || 'Link invite tidak valid atau sudah kadaluarsa.')
      } finally {
        setLoading(false)
      }
    }
    fetchInvite()
  }, [code])

  const handleJoin = async () => {
    if (!isLoggedIn) {
      // Simpan URL saat ini (atau invite_code) agar setelah login bisa kembali ke sini
      localStorage.setItem('redirect_after_login', window.location.pathname)
      router.push('/login')
      return
    }

    setJoining(true)
    try {
      const res = await api.post('/org/join', { 
        invite_code: code,
        custom_data: Object.keys(customData).length > 0 ? customData : undefined
      })
      if (res.data.success) {
        // Berhasil gabung, arahkan ke dashboard organisasi
        router.push(`/org/${res.data.organization.slug}/dashboard`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal bergabung ke organisasi')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tautan Tidak Valid</h1>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link href="/" className="inline-block py-3 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-slate-200/50 border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-full shadow-md border-4 border-white relative z-10" />
          ) : (
            <div className="w-full h-full rounded-full shadow-md border-4 border-white bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold relative z-10">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4">
          <Building2 className="w-3.5 h-3.5" />
          Undangan Bergabung
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {org.name}
        </h1>
        <p className="text-slate-500 font-medium text-sm mb-8">
          Anda telah diundang untuk bergabung ke dalam workspace ini.
        </p>

        {org.custom_fields_schema && org.custom_fields_schema.length > 0 && (
          <div className="mb-8 text-left space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <h3 className="font-bold text-slate-900 text-sm">Data Tambahan yang Diperlukan:</h3>
            {org.custom_fields_schema.map((field) => (
              <div key={field.id}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type={field.type === 'text' ? 'text' : 'text'}
                  value={customData[field.id] || ''}
                  onChange={(e) => setCustomData({ ...customData, [field.id]: e.target.value })}
                  placeholder={`Masukkan ${field.label}`}
                  required={field.required}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            // Validate required fields before joining
            if (org.custom_fields_schema) {
              const missingFields = org.custom_fields_schema.filter(f => f.required && !customData[f.id])
              if (missingFields.length > 0) {
                toast.error(`Harap isi semua kolom wajib: ${missingFields.map(f => f.label).join(', ')}`)
                return
              }
            }
            handleJoin()
          }}
          disabled={joining}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
        >
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLoggedIn ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Gabung Sekarang
                </>
              ) : (
                <>
                  Masuk & Gabung
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </>
          )}
        </button>

        {!isLoggedIn && (
          <p className="text-xs text-slate-400 mt-4">
            Anda akan diarahkan ke halaman login atau pendaftaran sebelum bergabung.
          </p>
        )}
      </div>
    </div>
  )
}
