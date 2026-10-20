import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { createClient } from '@/lib/supabase/client'

// Supabase client instance untuk keperluan autentikasi di frontend
export const supabase = createClient()

// Axios API client instance untuk interaksi ke Express Backend
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true
})

// Cache memory & in-flight request deduping map
const inFlightRequests = new Map<string, Promise<any>>()
const apiCache = new Map<string, { data: any; expiresAt: number }>()

// Short TTL configuration for cacheable endpoints (milliseconds)
const CACHE_CONFIGS: { pattern: RegExp; ttlMs: number }[] = [
  { pattern: /^\/personal\/profile$/, ttlMs: 30_000 },
  { pattern: /^\/personal\/summary$/, ttlMs: 15_000 },
  { pattern: /^\/personal\/goals$/, ttlMs: 20_000 },
  { pattern: /^\/personal\/wallets$/, ttlMs: 20_000 },
  { pattern: /^\/org\/me\/list$/, ttlMs: 30_000 },
  { pattern: /^\/subscription\/me$/, ttlMs: 60_000 },
  { pattern: /^\/admin\/announcements\/active$/, ttlMs: 120_000 },
  { pattern: /^\/org\/[^\/]+\/overview$/, ttlMs: 20_000 },
  { pattern: /^\/org\/[^\/]+\/settings$/, ttlMs: 30_000 },
  { pattern: /^\/org\/[^\/]+\/members$/, ttlMs: 30_000 },
  { pattern: /^\/org-financial\/[^\/]+\/summary$/, ttlMs: 15_000 },
  { pattern: /^\/org-financial\/[^\/]+$/, ttlMs: 15_000 },
  { pattern: /^\/org\/[^\/]+\/goals$/, ttlMs: 20_000 },
  { pattern: /^\/org-attendance\/[^\/]+\/agenda$/, ttlMs: 20_000 },
  { pattern: /^\/notifications$/, ttlMs: 20_000 },
  { pattern: /^\/org-schedule\/[^\/]+$/, ttlMs: 30_000 },
  { pattern: /^\/org-attendance\/[^\/]+\/sessions$/, ttlMs: 20_000 },
  { pattern: /^\/org-meeting\/[^\/]+$/, ttlMs: 30_000 },
  { pattern: /^\/org-attendance\/[^\/]+\/stats$/, ttlMs: 30_000 },
  { pattern: /^\/org-attendance\/[^\/]+\/guests\/analytics$/, ttlMs: 30_000 },
  { pattern: /^\/school\/schools$/, ttlMs: 60_000 },
]

export function getApiCachedData<T = any>(url: string): T | null {
  const cached = apiCache.get(url)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }
  return null
}

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear()
  } else {
    apiCache.forEach((_, key) => {
      if (key.includes(prefix)) {
        apiCache.delete(key)
      }
    })
  }
}

// Intercept getSession with a short memory cache to avoid repeated disk reads
let cachedSession: { token: string; expiresAt: number } | null = null

// Request interceptor untuk menyematkan JWT Token secara otomatis
api.interceptors.request.use(
  async (config) => {
    const now = Date.now()
    if (!cachedSession || cachedSession.expiresAt < now) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        cachedSession = {
          token: session.access_token,
          expiresAt: now + 30_000,
        }
      } else {
        cachedSession = null
      }
    }

    if (cachedSession?.token) {
      config.headers.Authorization = `Bearer ${cachedSession.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor untuk menangani 503 Maintenance dan scoped invalidasi cache
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase()
    const url = response.config?.url || ''
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      // Scoped cache invalidation agar tidak menghapus seluruh cache aplikasi
      if (url.includes('financial') || url.includes('org-financial')) {
        clearApiCache('/org-financial')
        clearApiCache('/overview')
      } else if (url.includes('attendance') || url.includes('session')) {
        clearApiCache('/org-attendance')
        clearApiCache('/agenda')
        clearApiCache('/overview')
      } else if (url.includes('schedule') || url.includes('org-schedule')) {
        clearApiCache('/org-schedule')
        clearApiCache('/agenda')
      } else if (url.includes('meeting') || url.includes('org-meeting')) {
        clearApiCache('/org-meeting')
      } else if (url.includes('personal')) {
        clearApiCache('/personal')
      } else if (url.includes('notifications')) {
        clearApiCache('/notifications')
      } else if (url.includes('org')) {
        clearApiCache('/org')
        clearApiCache('/overview')
      } else {
        clearApiCache()
      }
    }
    return response
  },
  (error) => {
    if (error.response && error.response.status === 503) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance'
      }
    }
    return Promise.reject(error)
  }
)

// Wrap api.get for in-flight deduplication & client caching
const rawGet = api.get.bind(api)
api.get = (async (url: string, config?: AxiosRequestConfig & { skipCache?: boolean }) => {
  const skipCache = config?.skipCache || config?.headers?.['Cache-Control'] === 'no-cache'
  const now = Date.now()

  // 1. Periksa cache jika ada konfigurasi TTL untuk endpoint ini
  let ttl = 0
  if (!skipCache) {
    for (const item of CACHE_CONFIGS) {
      if (item.pattern.test(url)) {
        ttl = item.ttlMs
        break
      }
    }
  }

  if (ttl > 0) {
    const cached = apiCache.get(url)
    if (cached && cached.expiresAt > now) {
      return {
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config || {},
      }
    }
  }

  // 2. Request deduplication (jika ada request persis sama yang sedang berjalan)
  const dedupeKey = `${url}:${JSON.stringify(config?.params || '')}`
  const existing = inFlightRequests.get(dedupeKey)
  if (existing) {
    return existing
  }

  // 3. Eksekusi request sebenarnya
  const fetchPromise = rawGet(url, config)
    .then((res) => {
      if (ttl > 0 && res.status >= 200 && res.status < 300) {
        apiCache.set(url, {
          data: res.data,
          expiresAt: Date.now() + ttl,
        })
      }
      return res
    })
    .finally(() => {
      inFlightRequests.delete(dedupeKey)
    })

  inFlightRequests.set(dedupeKey, fetchPromise)
  return fetchPromise
}) as any

