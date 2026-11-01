'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Megaphone, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  ShieldCheck, 
  Loader2,
  Lock,
  Ticket
} from 'lucide-react'
import { supabase } from '@/lib/api'
import { useAdminRoute, isSuperadminEmail } from './useAdminRoute'
import toast from 'react-hot-toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const { dashboardHref, orgsHref, announcementsHref, vouchersHref, loginHref, mainAppUrl } = useAdminRoute()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Skip admin shell if we are on the admin login page
  const isLoginPage = pathname === '/login' || pathname === '/admin/login'

  useEffect(() => {
    checkAdminAuth()
  }, [pathname])

  const checkAdminAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!isLoginPage) {
          router.replace(loginHref)
        }
        setLoading(false)
        return
      }

      if (!isSuperadminEmail(user.email)) {
        setUser(user)
        setLoading(false)
        return
      }

      setUser(user)
    } catch (err: any) {
      console.error('Admin Auth check error:', err)
      if (!isLoginPage) {
        router.replace(loginHref)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Berhasil logout dari Admin')
      router.replace(loginHref)
    } catch (err) {
      toast.error('Gagal logout')
    } finally {
      setLoggingOut(false)
    }
  }

  // If on admin login page, render child directly without admin shell
  if (isLoginPage) {
    return <>{children}</>
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-5 h-5 text-[#0087FF] animate-spin" />
          <div>
            <div className="text-sm font-bold text-slate-800">Admin KitaAtur</div>
            <div className="text-xs text-slate-500">Memverifikasi hak akses...</div>
          </div>
        </div>
      </div>
    )
  }

  // Unauthorized state (logged in user but not Superadmin)
  if (user && !isSuperadminEmail(user.email)) {
    const expectedAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com'
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-slate-900">Akses Ditolak</h1>
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
            Akun <span className="text-slate-800 font-semibold">{user.email}</span> tidak terdaftar sebagai Superadmin sistem KitaAtur.
          </p>
          <p className="text-[11px] text-slate-400 mb-6">
            Silakan masuk dengan akun terotorisasi (<span className="text-slate-600 font-medium">{expectedAdmin}</span>).
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-[#0087FF] hover:bg-[#0077E6] text-white rounded-xl font-semibold text-sm transition cursor-pointer"
            >
              Ganti Akun Google Superadmin
            </button>
            <a
              href={mainAppUrl}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Aplikasi Utama
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Active link check
  const isDashboardActive = pathname === '/' || pathname === '/admin'
  const isOrgsActive = pathname.includes('/organizations')
  const isAnnouncementsActive = pathname.includes('/announcements')
  const isVouchersActive = pathname.includes('/vouchers')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Subdomain Info */}
          <div className="flex items-center gap-4">
            <Link href={dashboardHref} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center p-1 border border-slate-200/80">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">KitaAtur</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#007AE6] border border-blue-200/60 font-semibold">
                  Admin
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-slate-200 pl-6">
              <Link
                href={dashboardHref}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isDashboardActive
                    ? 'bg-[#E0F4FE] text-[#007AE6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dasbor</span>
              </Link>
              <Link
                href={orgsHref}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isOrgsActive
                    ? 'bg-[#E0F4FE] text-[#007AE6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Organisasi & Sekolah</span>
              </Link>
              <Link
                href={announcementsHref}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isAnnouncementsActive
                    ? 'bg-[#E0F4FE] text-[#007AE6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Broadcast</span>
              </Link>
              <Link
                href={vouchersHref}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                  isVouchersActive
                    ? 'bg-[#E0F4FE] text-[#007AE6]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Voucher Diskon</span>
              </Link>
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Link back to Main KitaAtur App */}
            <a
              href={mainAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <span>Aplikasi Utama</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Superadmin Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-[#0087FF]" />
              <span className="text-xs font-semibold text-slate-700">{user?.email || 'Superadmin'}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5">
            <Link
              href={dashboardHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                isDashboardActive ? 'bg-[#E0F4FE] text-[#007AE6]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dasbor</span>
            </Link>
            <Link
              href={orgsHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                isOrgsActive ? 'bg-[#E0F4FE] text-[#007AE6]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Organisasi & Sekolah</span>
            </Link>
            <Link
              href={announcementsHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                isAnnouncementsActive ? 'bg-[#E0F4FE] text-[#007AE6]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Pusat Broadcast Pengumuman</span>
            </Link>
            <Link
              href={vouchersHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                isVouchersActive ? 'bg-[#E0F4FE] text-[#007AE6]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Voucher Diskon</span>
            </Link>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <a
                href={mainAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100"
              >
                <span>Buka Aplikasi Utama</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
              >
                <span>Keluar (Logout)</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Panel Admin KitaAtur &bull; admin-kitatur.rinzgroup.web.id
      </footer>
    </div>
  )
}
