'use client'
import { usePathname } from 'next/navigation'

export function isSuperadminEmail(email?: string | null): boolean {
  if (!email) return false
  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'generalrino@gmail.com'
  const list = envAdmins.split(',').map((e) => e.trim().toLowerCase())
  return list.includes(email.toLowerCase())
}

export function useAdminRoute() {
  const pathname = usePathname() || ''
  const isPrefixed = pathname.startsWith('/admin')

  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'kitatur.rinzgroup.web.id'
  const isProd = process.env.NODE_ENV === 'production'
  const mainAppUrl = isProd 
    ? `https://${mainDomain}/app` 
    : (typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'http://localhost:3000/app' : '/app')

  return {
    pathname,
    isPrefixed,
    dashboardHref: isPrefixed ? '/admin' : '/',
    orgsHref: isPrefixed ? '/admin/organizations' : '/organizations',
    announcementsHref: isPrefixed ? '/admin/announcements' : '/announcements',
    vouchersHref: isPrefixed ? '/admin/vouchers' : '/vouchers',
    loginHref: isPrefixed ? '/admin/login' : '/login',
    mainAppUrl,
  }
}

