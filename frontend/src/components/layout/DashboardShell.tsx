'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Target, Home, User, Plus, Building2, QrCode, LogOut, ChevronRight, Settings, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase, api } from '@/lib/api'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()

  // Tentukan apakah kita berada di Personal Space atau Organization Space
  const isPersonal = pathname?.startsWith('/personal') || false
  const isOrg = pathname?.startsWith('/org') && !pathname?.startsWith('/org/create')

  // Extract orgSlug from pathname if in org space (e.g., /org/desainkita/dashboard)
  const orgMatch = pathname?.match(/\/org\/([^\/]+)/)
  const currentOrgSlug = orgMatch ? orgMatch[1] : ''

  const noShellPaths = ['/org/create']
  if (pathname && noShellPaths.includes(pathname)) {
    return <>{children}</>
  }

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserInfo, setCurrentUserInfo] = useState<{name: string, email: string, avatar_url: string|null} | null>(null)
  const [currentOrgInfo, setCurrentOrgInfo] = useState<{name: string, logo_url: string|null} | null>(null)

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let profile = null;
          try {
            const res = await api.get('/personal/profile');
            profile = res.data;
          } catch (e) {
            console.error('API profile fetch error in shell:', e);
          }

          setCurrentUserInfo({
            name: profile?.full_name || 'Tanpa Nama',
            email: user.email || '',
            avatar_url: profile?.avatar_url || null
          })

          if (currentOrgSlug) {
            const membersRes = await api.get(`/org/${currentOrgSlug}/members`)
            const currentMember = membersRes.data.find((m: any) => m.profile_id === user.id)
            if (currentMember) {
              setCurrentUserRole(currentMember.role)
            }

            const orgsRes = await api.get('/org/me/list')
            const orgData = orgsRes.data.find((o: any) => o.slug === currentOrgSlug)
            if (orgData) {
              setCurrentOrgInfo({ name: orgData.name, logo_url: orgData.logo_url })
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch info', err)
      }
    }

    fetchInfo()
  }, [currentOrgSlug])

  let fabHref = '/personal/wallet/create'
  if (isOrg && currentOrgSlug) {
    if (currentUserRole === 'bendahara') {
      fabHref = `/org/${currentOrgSlug}/financial/create`
    } else if (currentUserRole === 'sekretaris') {
      fabHref = `/org/${currentOrgSlug}/attendance/sessions/create`
    } else {
      fabHref = `/org/${currentOrgSlug}/attendance/scan`
    }
  }

  // Menentukan nav item berdasarkan konteks
  const personalNavItems = [
    { name: 'Ringkasan', href: '/personal/dashboard', icon: Home },
    { name: 'Dompet', href: '/personal/wallet', icon: Wallet },
    { name: 'Target', href: '/personal/targets', icon: Target },
    { name: 'Profil', href: '/settings', icon: User },
  ]

  const orgNavItems = currentOrgSlug ? [
    { name: 'Org Dashboard', href: `/org/${currentOrgSlug}/dashboard`, icon: Building2 },
    { name: 'Absensi', href: `/org/${currentOrgSlug}/attendance`, icon: QrCode },
    { name: 'Keuangan', href: `/org/${currentOrgSlug}/financial`, icon: Wallet },
    { name: 'Pengaturan', href: `/org/${currentOrgSlug}/settings`, icon: Settings },
  ] : []

  // Render Sidebar items conditionally based on active mode
  let activeSidebarItems = []
  if (isOrg) {
    activeSidebarItems = [{ section: 'ORGANIZATION SPACE', items: orgNavItems }]
  } else {
    // Default to Personal Space
    activeSidebarItems = [{ section: 'PERSONAL SPACE', items: personalNavItems }]
  }

  // Same for bottom navigation
  const activeBottomNavItems = isOrg ? orgNavItems : personalNavItems

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <aside className={`hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm transition-all duration-300 z-30`}>
        <div className="p-6 flex items-center justify-center border-b border-slate-100">
          {isOrg && currentOrgInfo ? (
            <Link href={`/org/${currentOrgSlug}/dashboard`} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden">
                {currentOrgInfo.logo_url ? (
                  <img src={currentOrgInfo.logo_url} alt={currentOrgInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">{currentOrgInfo.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 truncate max-w-[150px]">{currentOrgInfo.name}</span>
            </Link>
          ) : (
            <Link href="/personal/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white shadow-lg flex items-center justify-center p-1">
                <img src="/logo.png" alt="KitaAtur" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">KitaAtur</span>
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {activeSidebarItems.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {group.section}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.name}
                      {isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-600 opacity-50" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto w-full md:w-[calc(100%-16rem)]">
        <div className="w-full flex-1 flex flex-col">
          {children}
        </div>
        {/* Spacer untuk memastikan bottom nav tidak menutupi konten paling bawah di mobile */}
        <div className="h-32 md:h-8 shrink-0 w-full" aria-hidden="true" />
      </main>

      {/* 2. MOBILE BOTTOM NAVIGATION (Floating Dock) */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl z-50">
        <div className="flex justify-around items-center px-4 py-3">
          {activeBottomNavItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href} className={`flex items-center justify-center p-2 rounded-2xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </Link>
            )
          })}

          {/* Floating Action Button di Tengah */}
          <div className="relative flex items-center justify-center -translate-y-5">
            {currentUserRole === 'auditor' ? (
              <div className="bg-slate-200 text-slate-400 p-4 rounded-2xl shadow-sm block cursor-not-allowed" title="Aksi tidak tersedia untuk Auditor">
                <Plus className="w-6 h-6 stroke-[2.5px]" />
              </div>
            ) : (
              <Link 
                href={fabHref}
                className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all block"
              >
                <Plus className="w-6 h-6 stroke-[2.5px]" />
              </Link>
            )}
          </div>

          {activeBottomNavItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href} className={`flex items-center justify-center p-2 rounded-2xl transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
