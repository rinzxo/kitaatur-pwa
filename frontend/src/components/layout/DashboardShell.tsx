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
  CaretDown,
  Users
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useDashboardStore } from '@/lib/dashboard-store'
import { dispatchNativeNotification } from '@/components/ui/NativeNotificationBanner'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const store = useDashboardStore()
  const [isNavigating, setIsNavigating] = useState(false)

  const currentPath = pathname
  const isPersonal = currentPath?.startsWith('/personal') || false
  const isOrg = currentPath?.startsWith('/org') && !currentPath?.startsWith('/org/create')
  const orgMatch = currentPath?.match(/\/org\/([^\/]+)/)
  const currentOrgSlug = orgMatch ? orgMatch[1] : ''

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

    const handleDocumentMouseOver = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor || !anchor.href) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#')) return

      if (currentOrgSlug) {
        if (href.endsWith('/dashboard')) {
          api.get(`/org/${currentOrgSlug}/overview`).catch(() => {})
        } else if (href.endsWith('/financial')) {
          api.get(`/org-financial/${currentOrgSlug}/summary`).catch(() => {})
        } else if (href.endsWith('/attendance')) {
          api.get(`/org-attendance/${currentOrgSlug}/agenda`).catch(() => {})
        } else if (href.endsWith('/members')) {
          api.get(`/org/${currentOrgSlug}/members`).catch(() => {})
        }
      } else if (href.startsWith('/personal')) {
        if (href.endsWith('/dashboard')) {
          api.get('/personal/summary').catch(() => {})
        } else if (href.endsWith('/targets')) {
          api.get('/personal/goals').catch(() => {})
        }
      }
    }

    document.addEventListener('click', handleDocumentClick, true)
    document.addEventListener('mouseover', handleDocumentMouseOver, { passive: true })
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      document.removeEventListener('mouseover', handleDocumentMouseOver)
    }
  }, [currentOrgSlug])

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

  // Fetch active announcement (hanya muncul SEKALI per pengumuman)
  useEffect(() => {
    api.get('/admin/announcements/active')
      .then(res => {
        if (res.data && res.data.length > 0) {
          const ann = res.data[0]
          if (!ann?.id) return

          try {
            const seenKey = `kitaatur_announcement_seen_${ann.id}`
            const hasSeen = localStorage.getItem(seenKey)
            if (!hasSeen) {
              setActiveAnnouncement(ann)

              // Tampilkan in-app native notification banner SEKALI saja
              dispatchNativeNotification({
                id: `announcement-${ann.id}`,
                title: `[Pengumuman] ${ann.title}`,
                body: ann.content,
                url: '/notifications',
                duration: 8000
              })

              // Tandai pengumuman sudah muncul agar tidak berulang setiap kali reload
              localStorage.setItem(seenKey, 'true')
            }
          } catch (e) {
            setActiveAnnouncement(ann)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Derive data from store instead of independent API calls
  const currentUserRole = store.getCurrentRole(currentOrgSlug)
  const currentUserInfo = store.user

  // Direct org fallback (for vanish mode admin, deep links, or fast cache)
  const [directOrgInfo, setDirectOrgInfo] = useState<any>(null)
  const [isSchoolCached, setIsSchoolCached] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && currentOrgSlug) {
      try {
        const cached = localStorage.getItem(`kitaatur_org_meta_${currentOrgSlug}`)
        if (cached) setDirectOrgInfo(JSON.parse(cached))
        setIsSchoolCached(localStorage.getItem(`kitaatur_is_school_${currentOrgSlug}`) === 'true')
      } catch (e) {}
    } else {
      setDirectOrgInfo(null)
      setIsSchoolCached(false)
    }
  }, [currentOrgSlug])

  const currentOrgInfo = (currentOrgSlug ? store.orgs.find(o => o.slug === currentOrgSlug) : null) || directOrgInfo

  const isCurrentSchool = Boolean(
    pathname?.includes('/executive') || 
    currentOrgInfo?.is_edu || 
    ((currentOrgInfo?._count?.school_links_as_school || 0) > 0) ||
    isSchoolCached
  )

  useEffect(() => {
    if (currentOrgSlug && isCurrentSchool) {
      try {
        localStorage.setItem(`kitaatur_is_school_${currentOrgSlug}`, 'true')
      } catch (e) {}
    }
  }, [currentOrgSlug, isCurrentSchool])

  // Fetch org metadata if not in store to ensure consistent school branding & navigation
  useEffect(() => {
    if (!currentOrgSlug) {
      setDirectOrgInfo(null)
      return
    }

    const fromStore = store.orgs.find(o => o.slug === currentOrgSlug)
    if (fromStore) {
      setDirectOrgInfo(fromStore)
      try {
        localStorage.setItem(`kitaatur_org_meta_${currentOrgSlug}`, JSON.stringify(fromStore))
        if (fromStore.is_edu || ((fromStore._count?.school_links_as_school || 0) > 0)) {
          localStorage.setItem(`kitaatur_is_school_${currentOrgSlug}`, 'true')
        }
      } catch (e) {}
      return
    }

    // Fallback: fetch from overview or settings
    api.get(`/org/${currentOrgSlug}/overview`)
      .then(res => {
        if (res.data?.org) {
          const org = res.data.org
          setDirectOrgInfo(org)
          try {
            localStorage.setItem(`kitaatur_org_meta_${currentOrgSlug}`, JSON.stringify(org))
            if (org.is_edu || ((org._count?.school_links_as_school || 0) > 0)) {
              localStorage.setItem(`kitaatur_is_school_${currentOrgSlug}`, 'true')
            }
          } catch (e) {}
        }
      })
      .catch(() => {
        api.get(`/org/${currentOrgSlug}/settings`)
          .then(res => {
            if (res.data) {
              const meta = {
                name: res.data.name || currentOrgSlug,
                slug: currentOrgSlug,
                logo_url: res.data.logo_url || null,
                is_edu: res.data.is_edu,
                _count: { school_links_as_school: res.data.school_links_as_school || 0 }
              }
              setDirectOrgInfo(meta)
              try {
                localStorage.setItem(`kitaatur_org_meta_${currentOrgSlug}`, JSON.stringify(meta))
                if (res.data.is_edu) {
                  localStorage.setItem(`kitaatur_is_school_${currentOrgSlug}`, 'true')
                }
              } catch (e) {}
            }
          })
          .catch(() => {})
      })
  }, [currentOrgSlug, store.orgs])

  let fabHref = '/personal/wallet/create'
  let fabTitle = 'Tambah Transaksi / Dompet'
  if (isOrg && currentOrgSlug) {
    if (isCurrentSchool) {
      fabHref = `/org/${currentOrgSlug}/members`
      fabTitle = 'Undang & Kelola Anggota'
    } else if (currentUserRole === 'bendahara') {
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

  // Simpan last active org hanya jika user memang merupakan anggota terdaftar dari organisasi tersebut
  useEffect(() => {
    if (currentOrgSlug && store.orgs.some(o => o.slug === currentOrgSlug)) {
      localStorage.setItem('kitaatur_last_active_org', currentOrgSlug)
      document.cookie = `kitaatur_last_org=${currentOrgSlug}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [currentOrgSlug, store.orgs])

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
  const primaryOrgInfo = (primaryOrgSlug ? store.orgs.find(o => o.slug === primaryOrgSlug) : null) || (primaryOrgSlug === currentOrgSlug ? directOrgInfo : null)
  const isPrimarySchool = Boolean(
    primaryOrgInfo?.is_edu || 
    ((primaryOrgInfo?._count?.school_links_as_school || 0) > 0) ||
    (primaryOrgSlug === currentOrgSlug ? isSchoolCached : false)
  )

  // Menentukan nav item berdasarkan konteks
  const personalNavItems = [
    { name: 'Ringkasan', href: '/personal/dashboard', icon: House },
    primaryOrgSlug 
      ? { 
          name: isPrimarySchool ? 'Dasbor Eksekutif' : 'Organisasi', 
          href: isPrimarySchool ? `/org/${primaryOrgSlug}/executive` : `/org/${primaryOrgSlug}/dashboard`, 
          icon: Buildings 
        }
      : { name: 'Target', href: '/personal/targets', icon: Target },
    { name: 'Dompet', href: '/personal/wallet', icon: Wallet },
    { name: 'Profil', href: '/settings', icon: UserCircle },
  ]

  const schoolNavItems = currentOrgSlug ? [
    { name: 'Dashboard Eksekutif', href: `/org/${currentOrgSlug}/executive`, icon: Buildings },
    { name: 'Anggota Sekolah', href: `/org/${currentOrgSlug}/members`, icon: Users },
    { name: 'Personal Space', href: `/personal/dashboard`, icon: House },
    { name: 'Pengaturan Sekolah', href: `/org/${currentOrgSlug}/settings`, icon: GearSix },
  ] : []

  const regularOrgNavItems = currentOrgSlug ? [
    { name: 'Org Dashboard', href: `/org/${currentOrgSlug}/dashboard`, icon: Buildings },
    { name: 'Presensi', href: `/org/${currentOrgSlug}/attendance`, icon: QrCode },
    { name: 'Keuangan', href: `/org/${currentOrgSlug}/financial`, icon: Wallet },
    { name: 'Pengaturan', href: `/org/${currentOrgSlug}/settings`, icon: GearSix },
  ] : []

  const orgNavItems = isCurrentSchool ? schoolNavItems : regularOrgNavItems

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com').toLowerCase()
  if (currentUserInfo?.email?.toLowerCase() === adminEmail) {
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin-kitatur.rinzgroup.web.id'
    personalNavItems.push({ 
      name: 'Admin Panel', 
      href: process.env.NODE_ENV === 'production' ? adminUrl : '/admin', 
      icon: Package 
    })
  }

  // Render Sidebar items conditionally based on active mode
  let activeSidebarItems = []
  if (isOrg) {
    activeSidebarItems = [
      { 
        section: isCurrentSchool ? 'RUANG EKSEKUTIF SEKOLAH' : 'ORGANIZATION SPACE', 
        items: isCurrentSchool 
          ? [
              { name: 'Dashboard Eksekutif', href: `/org/${currentOrgSlug}/executive`, icon: Buildings },
              { name: 'Anggota & Guru', href: `/org/${currentOrgSlug}/members`, icon: Users },
              { name: 'Pengaturan Sekolah', href: `/org/${currentOrgSlug}/settings`, icon: GearSix },
            ]
          : regularOrgNavItems 
      },
      { section: 'PERSONAL SPACE', items: [{ name: 'Keuangan Pribadi', href: '/personal/dashboard', icon: House }] }
    ]
  } else {
    // Default to Personal Space
    activeSidebarItems = [
      { section: 'PERSONAL SPACE', items: personalNavItems },
      ...(primaryOrgSlug ? [{ 
        section: isPrimarySchool ? 'RUANG EKSEKUTIF SEKOLAH' : 'ORGANIZATION SPACE', 
        items: [
          { 
            name: isPrimarySchool ? 'Dasbor Eksekutif' : 'Dasbor Organisasi', 
            href: isPrimarySchool ? `/org/${primaryOrgSlug}/executive` : `/org/${primaryOrgSlug}/dashboard`, 
            icon: Buildings 
          },
          ...(isPrimarySchool ? [
            { name: 'Pengaturan Sekolah', href: `/org/${primaryOrgSlug}/settings`, icon: GearSix }
          ] : [
            { name: 'Presensi Organisasi', href: `/org/${primaryOrgSlug}/attendance`, icon: QrCode }
          ])
        ] 
      }] : [])
    ]
  }

  // Same for bottom navigation
  const activeBottomNavItems = isOrg ? orgNavItems : personalNavItems

  const noShellPaths = ['/org/create']
  if (pathname && noShellPaths.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <aside className={`hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm transition-all duration-300 z-30`}>
        <div className="p-6 flex items-center justify-center border-b border-slate-100">
          {isOrg && (currentOrgInfo || currentOrgSlug) ? (
            <Link href={isCurrentSchool ? `/org/${currentOrgSlug}/executive` : `/org/${currentOrgSlug}/dashboard`} className="flex items-center gap-2.5">
              {currentOrgInfo?.logo_url ? (
                <img 
                  src={currentOrgInfo.logo_url} 
                  alt={currentOrgInfo.name || currentOrgSlug} 
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" 
                />
              ) : (
                <div suppressHydrationWarning className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {(currentOrgInfo?.name || currentOrgSlug).charAt(0).toUpperCase()}
                </div>
              )}
              <span suppressHydrationWarning className="text-lg font-extrabold tracking-tight text-slate-900 truncate max-w-[150px]">
                {currentOrgInfo?.name || (isCurrentSchool ? 'Sekolah' : currentOrgSlug)}
              </span>
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
                  const isActive = currentPath === item.href || 
                    (item.href.includes('/executive') && currentPath?.includes('/executive'))
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
            <button 
              onClick={() => {
                if (activeAnnouncement?.id) {
                  try {
                    localStorage.setItem(`kitaatur_announcement_seen_${activeAnnouncement.id}`, 'true')
                  } catch (e) {}
                }
                setActiveAnnouncement(null)
              }} 
              className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
              title="Tutup pengumuman"
            >
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
            const isActive = currentPath === item.href || (item.href.includes('/executive') && currentPath?.includes('/executive'))
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                title={item.name}
                aria-label={item.name}
                className={`flex items-center justify-center p-2 rounded-2xl transition-all ${
                  isActive ? 'bg-[#E0F4FE] text-[#0087FF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
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
            const isActive = currentPath === item.href || (item.href === '/personal/dashboard' && currentPath?.startsWith('/personal'))
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                title={item.name}
                aria-label={item.name}
                className={`flex items-center justify-center p-2 rounded-2xl transition-all ${
                  isActive ? 'bg-[#E0F4FE] text-[#0087FF]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon size={24} weight={isActive ? 'duotone' : 'regular'} />
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
