'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CircleNotch as Loader2 } from '@phosphor-icons/react'

function BantuAbsenRedirectContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgSlug = params?.orgSlug as string

  useEffect(() => {
    if (orgSlug) {
      const sessionId = searchParams.get('sessionId')
      const target = sessionId 
        ? `/org/${orgSlug}/attendance/sessions?tab=izin&sessionId=${sessionId}`
        : `/org/${orgSlug}/attendance/sessions?tab=izin`
      router.replace(target)
    }
  }, [orgSlug, router, searchParams])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-xs font-semibold text-slate-500">Membuka Pusat Kelola Izin & Presensi...</span>
    </div>
  )
}

export default function BantuAbsenRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    }>
      <BantuAbsenRedirectContent />
    </Suspense>
  )
}
