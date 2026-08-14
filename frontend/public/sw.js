const CACHE_NAME = 'kitaatur-v2'

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json',
]

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch: Network-first strategy for API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // API calls and Next.js Data/Navigation: Network-first
  if (url.pathname.startsWith('/api/') || request.mode === 'navigate' || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request)
        })
    )
    return
  }

  // Static assets (js, css, images): Cache-first with stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response))
          }
        }).catch(() => {})
        return cachedResponse
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})

// Push notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      }
    }
    const notificationPromise = self.registration.showNotification(data.title, options)

    // Kirim sinyal ke semua tab frontend yang terbuka agar memutar suara
    const broadcastPromise = self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'PUSH_RECEIVED', data: data })
      })
    })

    event.waitUntil(Promise.all([notificationPromise, broadcastPromise]))
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
