'use client'

import { useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CircleNotch as Loader2 } from '@phosphor-icons/react'

function SchedulesRedirectContent() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params?.orgSlug as string

  useEffect(() => {
    if (orgSlug) {
      router.replace(`/org/${orgSlug}/attendance/sessions?tab=schedules`)
    }
  }, [orgSlug, router])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-xs font-semibold text-slate-500">Membuka Jadwal Otomatis...</span>
    </div>
  )
}

export default function SchedulesRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    }>
      <SchedulesRedirectContent />
    </Suspense>
  )
}
