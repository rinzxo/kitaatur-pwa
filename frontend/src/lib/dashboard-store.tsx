'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { api, supabase, getApiCachedData } from '@/lib/api'

interface UserData {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface OrgData {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface MemberData {
  profile_id: string
  role: string
  joined_at: string
}

interface DashboardStore {
  // User data
  user: UserData | null
  isLoadingUser: boolean

  // Orgs list
  orgs: OrgData[]
  isLoadingOrgs: boolean

  // Current org members (keyed by orgSlug)
  getMembersForOrg: (orgSlug: string) => MemberData[] | null
  isLoadingMembers: boolean

  // Current user role in current org
  getCurrentRole: (orgSlug: string) => string | null

  // Subscription
  isVerified: boolean
  hasSchoolPlan: boolean

  // Notifications count
  unreadNotifs: number

  // Refresh functions
  refreshUser: () => Promise<void>
  refreshOrgs: () => Promise<void>
  refreshMembers: (orgSlug: string) => Promise<void>
  refreshAll: () => Promise<void>
}

const DashboardStoreContext = createContext<DashboardStore | null>(null)

export function useDashboardStore() {
  const ctx = useContext(DashboardStoreContext)
  if (!ctx) throw new Error('useDashboardStore must be used within DashboardStoreProvider')
  return ctx
}

// Lightweight hook that returns data only when ready
export function useUserData() {
  const store = useDashboardStore()
  return { user: store.user, isLoading: store.isLoadingUser }
}

export function useOrgList() {
  const store = useDashboardStore()
  return { orgs: store.orgs, isLoading: store.isLoadingOrgs }
}

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  // Instant Cache Hydration: tampil seketika tanpa flicker jika data sudah ada di cache
  const [user, setUser] = useState<UserData | null>(() => {
    const cachedProfile = getApiCachedData<any>('/personal/profile')
    if (cachedProfile) {
      return {
        id: cachedProfile.id || '',
        name: cachedProfile.full_name || 'Tanpa Nama',
        email: cachedProfile.email || '',
        avatar_url: cachedProfile.avatar_url || null,
      }
    }
    return null
  })
  const [isLoadingUser, setIsLoadingUser] = useState(() => !getApiCachedData('/personal/profile'))

  const [orgs, setOrgs] = useState<OrgData[]>(() => {
    return getApiCachedData<OrgData[]>('/org/me/list') || []
  })
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(() => !(getApiCachedData<OrgData[]>('/org/me/list')?.length))

  const [membersMap, setMembersMap] = useState<Record<string, MemberData[]>>({})
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [hasSchoolPlan, setHasSchoolPlan] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(() => {
    const cachedNotifs = getApiCachedData<any[]>('/notifications')
    return cachedNotifs ? cachedNotifs.filter((n: any) => !n.is_read).length : 0
  })
  const fetchedRef = useRef(false)

  const refreshUser = useCallback(async () => {
    try {
      const [profileRes, { data: { user: authUser } }] = await Promise.all([
        api.get('/personal/profile').catch(() => ({ data: null })),
        supabase.auth.getUser(),
      ])
      if (authUser && profileRes?.data) {
        setUser({
          id: authUser.id,
          name: profileRes.data.full_name || 'Tanpa Nama',
          email: authUser.email || '',
          avatar_url: profileRes.data.avatar_url || null,
        })
      }
    } catch (e) {
      console.error('Failed to refresh user', e)
    } finally {
      setIsLoadingUser(false)
    }
  }, [])

  const refreshOrgs = useCallback(async () => {
    try {
      const res = await api.get('/org/me/list').catch(() => ({ data: [] }))
      setOrgs(res.data || [])
    } catch (e) {
      console.error('Failed to refresh orgs', e)
    } finally {
      setIsLoadingOrgs(false)
    }
  }, [])

  const refreshMembers = useCallback(async (orgSlug: string) => {
    if (!orgSlug) return
    setIsLoadingMembers(true)
    try {
      const res = await api.get(`/org/${orgSlug}/members`).catch(() => ({ data: [] }))
      setMembersMap(prev => ({ ...prev, [orgSlug]: res.data || [] }))
    } catch (e) {
      console.error('Failed to refresh members', e)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    const [userRes, orgsRes, notifRes, subRes] = await Promise.allSettled([
      refreshUser(),
      refreshOrgs(),
      api.get('/notifications'),
      api.get('/subscription/me'),
    ])

    if (notifRes.status === 'fulfilled' && notifRes.value?.data) {
      const unread = notifRes.value.data.filter((n: any) => !n.is_read)
      setUnreadNotifs(unread.length)
    }

    if (subRes.status === 'fulfilled' && subRes.value?.data) {
      const subs = subRes.value.data || []
      setIsVerified(subs.some((s: any) => s.status === 'active'))
      setHasSchoolPlan(subs.some((s: any) =>
        s.status === 'active' && (s.plan_type.toLowerCase().includes('school') || s.plan_type.toLowerCase().includes('edu'))
      ))
    }
  }, [refreshUser, refreshOrgs])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      refreshAll()
    }
  }, [refreshAll])

  const getMembersForOrg = useCallback((orgSlug: string) => {
    return membersMap[orgSlug] ?? null
  }, [membersMap])

  const getCurrentRole = useCallback((orgSlug: string) => {
    const members = membersMap[orgSlug]
    if (!members || !user) return null
    const me = members.find(m => m.profile_id === user.id)
    return me?.role ?? null
  }, [membersMap, user])

  return (
    <DashboardStoreContext.Provider value={{
      user, isLoadingUser,
      orgs, isLoadingOrgs,
      getMembersForOrg, isLoadingMembers,
      getCurrentRole,
      isVerified, hasSchoolPlan,
      unreadNotifs,
      refreshUser, refreshOrgs, refreshMembers, refreshAll,
    }}>
      {children}
    </DashboardStoreContext.Provider>
  )
}
