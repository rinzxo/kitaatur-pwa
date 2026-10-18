'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, supabase } from '@/lib/api'

function VideoLoader() {
  const [isPortrait, setIsPortrait] = useState(true)

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      <video
        key={isPortrait ? 'portrait' : 'landscape'}
        autoPlay
        muted
        playsInline
        loop
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
        }}
      >
        <source 
          src={isPortrait ? "/videos/Starting potrait.mp4" : "/videos/Starting anm.mp4"} 
          type="video/mp4" 
        />
      </video>
    </div>
  )
}

function AppDispatcher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const target = searchParams.get('target') // 'bantu-absen' | 'attendance' | 'dashboard'

  useEffect(() => {
    let isMounted = true

    const dispatchUser = async () => {
      try {
        // 1. Verifikasi Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          const nextUrl = window.location.pathname + window.location.search
          window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`
          return
        }

        // 2. Ambil Daftar Organisasi User
        const orgRes = await api.get('/org/me/list').catch(() => ({ data: [] }))
        const orgs: any[] = orgRes.data || []

        if (!isMounted) return

        // Jika user belum punya organisasi, arahkan ke Personal Space
        if (orgs.length === 0) {
          router.replace('/personal/dashboard')
          return
        }

        // 3. Tentukan Target Organisasi (Prioritaskan yang terakhir dibuka)
        const cachedSlug = localStorage.getItem('kitaatur_last_active_org')
        const matchedOrg = orgs.find(o => o.slug === cachedSlug)
        const targetOrg = matchedOrg || orgs[0]
        const targetSlug = targetOrg.slug

        // Simpan organisasi aktif
        localStorage.setItem('kitaatur_last_active_org', targetSlug)
        document.cookie = `kitaatur_last_org=${targetSlug}; path=/; max-age=31536000; SameSite=Lax`

        // 4. Jika ada target eksplisit (misal dari PWA Shortcut)
        if (target === 'bantu-absen') {
          router.replace(`/org/${targetSlug}/attendance/bantu-absen`)
          return
        }
        if (target === 'attendance') {
          router.replace(`/org/${targetSlug}/attendance`)
          return
        }
        if (target === 'dashboard') {
          router.replace(`/org/${targetSlug}/dashboard`)
          return
        }

        // 5. Cek apakah ada sesi presensi aktif & ongoing saat ini
        try {
          const agendaRes = await api.get(`/org-attendance/${targetSlug}/agenda`).catch(() => ({ data: [] }))
          const agendas: any[] = agendaRes.data || []
          const now = new Date()

          const ongoingSession = agendas.find((a: any) => 
            a.is_active && 
            now >= new Date(a.start_time) && 
            now <= new Date(a.end_time)
          )

          if (ongoingSession) {
            // Cek role user di org ini
            const memberRes = await api.get(`/org/${targetSlug}/members`).catch(() => ({ data: [] }))
            const me = (memberRes.data || []).find((m: any) => m.profile_id === user.id)
            const isEditor = me?.role === 'head' || me?.role === 'vice_head' || me?.role === 'sekretaris' || me?.custom_data?.can_take_attendance === true

            if (isEditor) {
              // Jika pengurus / delegasi dan ada sesi berlangsung -> LANGSUNG BUKA BANTU ABSEN
              router.replace(`/org/${targetSlug}/attendance/bantu-absen`)
              return
            } else {
              // Jika anggota biasa -> Buka halaman presensi
              router.replace(`/org/${targetSlug}/attendance`)
              return
            }
          }
        } catch (e) {
          console.warn('[AppDispatcher] Gagal cek agenda:', e)
        }

        // Default: Masuk ke Dashboard Organisasi
        router.replace(`/org/${targetSlug}/dashboard`)
      } catch (err) {
        console.error('[AppDispatcher] Dispatch error:', err)
        router.replace('/personal/dashboard')
      }
    }

    dispatchUser()

    return () => {
      isMounted = false
    }
  }, [router, target])

  return <VideoLoader />
}

export default function AppPage() {
  return (
    <Suspense fallback={<VideoLoader />}>
      <AppDispatcher />
    </Suspense>
  )
}
