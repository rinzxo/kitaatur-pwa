'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Wallet, 
  Target, 
  House, 
  UserCircle, 
  Plus, 
  Buildings, 
  QrCode, 
  SignOut, 
  CaretRight, 
  GearSix, 
  Package, 
  X, 
  TreeStructure, 
  CaretDown 
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useDashboardStore } from '@/lib/dashboard-store'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const store = useDashboardStore()
  const [isNavigating, setIsNavigating] = useState(false)

  // Reset navigation indicator when navigation to the new route completes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  // Safety fallback in case navigation is interrupted
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => setIsNavigating(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isNavigating])

  // Show instant top progress bar indicator on internal link clicks
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor || !anchor.href) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      try {
        const url = new URL(anchor.href, window.location.origin)
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          setIsNavigating(true)
        }
      } catch (err) {}
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [])

  const currentPath = pathname

  // Tentukan apakah kita berada di Personal Space atau Organization Space
  const isPersonal = currentPath?.startsWith('/personal') || false
  const isOrg = currentPath?.startsWith('/org') && !currentPath?.startsWith('/org/create')

  // Extract orgSlug from currentPath if in org space
  const orgMatch = currentPath?.match(/\/org\/([^\/]+)/)
  const currentOrgSlug = orgMatch ? orgMatch[1] : ''

  const noShellPaths = ['/org/create']
  if (pathname && noShellPaths.includes(pathname)) {
    return <>{children}</>
  }

  const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null)

  // Fetch members for current org when navigating to org pages
  useEffect(() => {
    if (currentOrgSlug) {
      // Only fetch if not already cached in the store
      if (!store.getMembersForOrg(currentOrgSlug)) {
        store.refreshMembers(currentOrgSlug)
      }
    }
  }, [currentOrgSlug])

  // Fetch active announcement (low priority, non-blocking)
  useEffect(() => {
    api.get('/admin/announcements/active')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setActiveAnnouncement(res.data[0])
        }
      })
      .catch(() => {})
  }, [])

  // Derive data from store instead of independent API calls
  const currentUserRole = store.getCurrentRole(currentOrgSlug)
  const currentUserInfo = store.user
  const currentOrgInfo = currentOrgSlug
    ? store.orgs.find(o => o.slug === currentOrgSlug)
    : null

  let fabHref = '/personal/wallet/create'
  let fabTitle = 'Tambah Transaksi / Dompet'
  if (isOrg && currentOrgSlug) {
    if (currentUserRole === 'bendahara') {
      fabHref = `/org/${currentOrgSlug}/financial/dues`
      fabTitle = 'Tagih & Kelola Uang Kas'
    } else if (currentUserRole === 'sekretaris' || currentUserRole === 'head' || currentUserRole === 'vice_head') {
      fabHref = `/org/${currentOrgSlug}/attendance/sessions?tab=izin`
      fabTitle = 'Bantu Absen & Scan QR'
    } else {
      fabHref = `/org/${currentOrgSlug}/attendance/scan`
      fabTitle = 'Pindai Presensi'
    }
  }

  // Simpan last active org ketika user berada di halaman organisasi
  useEffect(() => {
    if (currentOrgSlug) {
      localStorage.setItem('kitaatur_last_active_org', currentOrgSlug)
      document.cookie = `kitaatur_last_org=${currentOrgSlug}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [currentOrgSlug])

  const [lastOrgSlug, setLastOrgSlug] = useState<string | null>(null)
  useEffect(() => {
    const cached = localStorage.getItem('kitaatur_last_active_org')
    if (cached) setLastOrgSlug(cached)
  }, [currentOrgSlug])

  const [familyBranches, setFamilyBranches] = useState<any[]>([])
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false)

  // Fetch family branches for fast switching
  useEffect(() => {
    if (isOrg && currentOrgSlug) {
      api.get(`/org/${currentOrgSlug}/family/branches`)
        .then(res => {
          if (res.data?.is_family && res.data?.branches?.length > 1) {
            setFamilyBranches(res.data.branches)
          } else {
            setFamilyBranches([])
          }
        })
        .catch(() => setFamilyBranches([]))
    } else {
      setFamilyBranches([])
    }
    setShowFamilyDropdown(false)
  }, [isOrg, currentOrgSlug])

  const primaryOrgSlug = currentOrgSlug || lastOrgSlug || (store.orgs.length > 0 ? store.orgs[0].slug : null)

  // Menentukan nav item berdasarkan konteks
  const personalNavItems = [
    { name: 'Ringkasan', href: '/personal/dashboard', icon: House },
    primaryOrgSlug 
      ? { name: 'Organisasi', href: `/org/${primaryOrgSlug}/dashboard`, icon: Buildings }
      : { name: 'Target', href: '/personal/targets', icon: Target },
    { name: 'Dompet', href: '/personal/wallet', icon: Wallet },
    { name: 'Profil', href: '/settings', icon: UserCircle },
  ]

  const orgNavItems = currentOrgSlug ? [
    { name: 'Org Dashboard', href: `/org/${currentOrgSlug}/dashboard`, icon: Buildings },
    { name: 'Presensi', href: `/org/${currentOrgSlug}/attendance`, icon: QrCode },
    { name: 'Keuangan', href: `/org/${currentOrgSlug}/financial`, icon: Wallet },
    { name: 'Pengaturan', href: `/org/${currentOrgSlug}/settings`, icon: GearSix },
  ] : []

  if (currentUserInfo?.email === 'generalrino@gmail.com') {
    personalNavItems.push({ name: 'Admin Panel', href: '/admin', icon: Package })
  }

  // Render Sidebar items conditionally based on active mode
  let activeSidebarItems = []
  if (isOrg) {
    activeSidebarItems = [
      { section: 'ORGANIZATION SPACE', items: orgNavItems },
      { section: 'PERSONAL SPACE', items: [{ name: 'Keuangan Pribadi', href: '/personal/dashboard', icon: House }] }
    ]
  } else {
    // Default to Personal Space
    activeSidebarItems = [
      { section: 'PERSONAL SPACE', items: personalNavItems },
      ...(primaryOrgSlug ? [{ 
        section: 'ORGANIZATION SPACE', 
        items: [
          { name: 'Dasbor Organisasi', href: `/org/${primaryOrgSlug}/dashboard`, icon: Buildings },
          { name: 'Presensi Organisasi', href: `/org/${primaryOrgSlug}/attendance`, icon: QrCode }
        ] 
      }] : [])
    ]
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
                  <img 
                    src={currentOrgInfo.logo_url} 
                    alt={currentOrgInfo.name} 
                    className="w-full h-full object-cover" 
                  />
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

        {/* Family Fast Switcher */}
        {familyBranches.length > 1 && (
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 relative">
            <button
              onClick={() => setShowFamilyDropdown(!showFamilyDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2 truncate">
                <TreeStructure size={15} weight="duotone" className="text-blue-600 shrink-0" />
                <span className="truncate">Ganti Cabang ({familyBranches.length})</span>
              </span>
              <CaretDown size={14} weight="bold" className={`text-slate-400 shrink-0 transition-transform ${showFamilyDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showFamilyDropdown && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Keluarga Organisasi
                </div>
                {familyBranches.map((branch) => (
                  <Link
                    key={branch.id}
                    href={`/org/${branch.slug}/dashboard`}
                    onClick={() => setShowFamilyDropdown(false)}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium hover:bg-slate-50 transition-colors ${
                      branch.is_current ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${branch.is_parent ? 'bg-blue-600' : 'bg-indigo-400'}`} />
                      <span className="truncate">{branch.name}</span>
                    </span>
                    {branch.is_parent && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Induk</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {activeSidebarItems.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {group.section}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#E0F4FE]/80 text-[#007AE6] font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon size={22} weight={isActive ? 'duotone' : 'regular'} className={`transition-all ${isActive ? 'text-[#0087FF]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                      {item.name}
                      {isActive && <CaretRight size={15} weight="bold" className="ml-auto text-[#0087FF] opacity-70" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

      </aside>

      {/* Top instant progress bar indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0087FF] via-[#01C4FB] to-[#0087FF] animate-pulse z-50 pointer-events-none" />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative overflow-y-auto w-full md:w-[calc(100%-16rem)]">
        {/* Announcement Banner */}
        {activeAnnouncement && (
          <div className={`px-4 py-3 relative z-50 shadow-sm flex items-start md:items-center justify-between gap-4 ${
            activeAnnouncement.type === 'error' ? 'bg-rose-600 text-white' : 
            activeAnnouncement.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
          }`}>
            <div className="flex-1 text-sm">
              <strong className="mr-2">{activeAnnouncement.title}:</strong>
              {activeAnnouncement.content}
            </div>
            <button onClick={() => setActiveAnnouncement(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
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
            const isActive = currentPath === item.href
            return (
              <Link key={item.name} href={item.href} prefetch={true} className={`flex items-center justify-center p-2 rounded-2xl transition-all ${isActive ? 'bg-[#E0F4FE] text-[#0087FF]' : 'text-slate-400 hover:text-slate-600'}`}>
                <item.icon size={24} weight={isActive ? 'duotone' : 'regular'} />
              </Link>
            )
          })}

          {/* Floating Action Button di Tengah */}
          <div className="relative flex items-center justify-center -translate-y-5">
            {currentUserRole === 'auditor' ? (
              <div className="bg-slate-200 text-slate-400 p-4 rounded-2xl shadow-sm block cursor-not-allowed" title="Aksi tidak tersedia untuk Auditor">
                <Plus size={24} weight="bold" />
              </div>
            ) : (
              <Link 
                href={fabHref}
                prefetch={true}
                title={fabTitle}
                aria-label={fabTitle}
                className="bg-gradient-to-tr from-[#0087FF] to-[#01C4FB] text-white p-4 rounded-2xl shadow-xl shadow-[#0087FF]/35 hover:scale-105 active:scale-95 transition-all block"
              >
                <Plus size={24} weight="bold" />
              </Link>
            )}
          </div>

          {activeBottomNavItems.slice(2, 4).map((item) => {
            const isActive = currentPath === item.href
            return (
              <Link key={item.name} href={item.href} prefetch={true} className={`flex items-center justify-center p-2 rounded-2xl transition-all ${isActive ? 'bg-[#E0F4FE] text-[#0087FF]' : 'text-slate-400 hover:text-slate-600'}`}>
                <item.icon size={24} weight={isActive ? 'duotone' : 'regular'} />
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
