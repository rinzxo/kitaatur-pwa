const CACHE_NAME = 'kitaatur-v4'

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

// Native Push notifications
self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {}
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'KitaAtur', body: event.data.text() }
    }

    const title = data.title || 'KitaAtur'
    const targetUrl = data.url || '/'

    // Rich Native Notification Options (Android / Windows / PWA)
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image: data.image || undefined,
      tag: data.tag || 'kitaatur-' + (data.sessionId || 'alert'),
      renotify: true,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        dateOfArrival: Date.now(),
        url: targetUrl
      },
      actions: [
        {
          action: 'open_url',
          title: 'Buka Presensi'
        },
        {
          action: 'dismiss',
          title: 'Tutup'
        }
      ]
    }

    const notificationPromise = self.registration.showNotification(title, options)

    // Broadcast ke semua window/tab frontend yang terbuka agar memicu Heads-Up Banner in-app
    const broadcastPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_RECEIVED',
          data: {
            title: title,
            body: data.body,
            url: targetUrl,
            icon: options.icon
          }
        })
      })
    })

    event.waitUntil(Promise.all([notificationPromise, broadcastPromise]))
  }
})

// Native Notification Click Handler
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = event.notification.data?.url || '/'

  // Buka atau fokus ke tab yang sudah ada
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl && targetUrl !== '/') {
            return client.navigate(targetUrl)
          }
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

