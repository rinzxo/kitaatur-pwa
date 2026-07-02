'use client'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, UserPlus, Loader2 } from 'lucide-react'
import { CustomSelect } from '@/components/ui/CustomSelect'

export default function InviteMemberPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'bendahara' | 'sekretaris' | 'member'>('member')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      await api.post(`/org/${orgSlug}/members`, {
        email: newEmail,
        fullName: newName,
        role: newRole
      })
      toast.success('Anggota berhasil ditambahkan!')
      router.push(`/org/${orgSlug}/members`)
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Gagal menambahkan anggota')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8">
        <header className="mb-6">
          <Link 
            href={`/org/${orgSlug}/members`} 
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Anggota
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-blue-600" />
            Tambah Anggota
          </h1>
          <p className="text-slate-500 font-medium text-xs mt-2">
            Masukkan email anggota baru. Jika email belum terdaftar di sistem, akun baru akan dibuatkan secara otomatis dengan sandi default `KitaAtur123!`.
          </p>
        </header>

        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              required
              placeholder="Nama Lengkap Anggota"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Email Anggota
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="email@anggota.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              Role Awal
            </label>
            <CustomSelect
              value={newRole}
              onChange={(val) => setNewRole(val as any)}
              options={[
                { label: 'Anggota (Member)', value: 'member' },
                { label: 'Bendahara', value: 'bendahara' },
                { label: 'Sekretaris', value: 'sekretaris' }
              ]}
              className="w-full"
            />
          </div>

          {formError && (
            <div className="text-rose-600 font-medium bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl text-sm shadow-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-400 font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all duration-300"
          >
            {formLoading ? 'Menambahkan...' : 'Tambah ke Organisasi'}
          </button>
        </form>
      </div>
    </div>
  )
}
