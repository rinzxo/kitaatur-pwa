'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api, supabase } from '@/lib/api'
import { CustomUpload } from '@/components/ui/CustomUpload'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const res = await api.get('/personal/profile')
      const profile = res.data
      
      // If profile already has full_name, no need to onboard
      if (profile?.full_name) {
        router.push('/personal/dashboard')
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error('Error checking profile:', e)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi')
      return
    }

    setSaving(true)
    try {
      await api.put('/personal/profile', {
        full_name: fullName,
        avatar_url: avatarUrl || null
      })
      toast.success('Profil berhasil disimpan!')
      router.push('/personal/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Gagal menyimpan profil')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-blue-500/5">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg shadow-blue-500/30">
            K
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lengkapi Profil</h1>
          <p className="text-slate-500 text-sm mt-2">Mari saling mengenal sebelum Anda mulai menggunakan KitaAtur.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <p className="text-sm font-semibold text-slate-700 mb-3">Foto Profil (Opsional)</p>
            <CustomUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              bucket="avatars"
              className="w-24 h-24 rounded-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan nama lengkap Anda"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Simpan & Lanjutkan"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
