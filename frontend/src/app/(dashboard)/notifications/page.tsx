'use client'
import toast from 'react-hot-toast'


import { useEffect, useState } from 'react'
import { ArrowLeft, Settings, BellRing } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api, supabase } from '@/lib/api'

// Helper function to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default')

  useEffect(() => {
    fetchNotifications()
    checkPushStatus()
  }, [])

  useEffect(() => {
    if (pushStatus === 'granted') {
      syncSubscription()
    }
  }, [pushStatus])

  const syncSubscription = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!VAPID_KEY) return
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        })
      }
      
      // Always sync with backend to make sure it's in DB
      await api.post('/notifications/subscribe', subscription)
    } catch (err) {
      console.error('Failed to sync subscription', err)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const res = await api.get('/notifications')
      setNotifications(res.data)

      // Mark as read immediately when page is opened
      const unread = res.data.filter((n: any) => !n.is_read)
      if (unread.length > 0) {
        await api.post('/notifications/read')
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkPushStatus = () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported')
      return
    }
    setPushStatus(Notification.permission as any)
  }

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator)) return
    
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission as any)
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!VAPID_KEY) throw new Error("VAPID KEY is missing")

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        })

        // Send to backend
        await api.post('/notifications/subscribe', subscription)
        toast.success('Push Notifications berhasil diaktifkan!')
      }
    } catch (err: any) {
      console.error('Failed to subscribe:', err)
      toast.error('Gagal mengaktifkan notifikasi: ' + err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const handleTestPush = async () => {
    try {
      await api.post('/notifications/test')
    } catch (err: any) {
      toast.error('Gagal mengirim notifikasi test')
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 animate-in slide-in-from-right-8 duration-300 font-sans">
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-[26px] h-[26px] stroke-[2px] text-slate-900" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors -mr-2">
          <Settings className="w-[26px] h-[26px] stroke-[2px] text-slate-900" />
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-6">
        <h1 className="text-[34px] font-extrabold tracking-tight mb-2">Notifikasi</h1>
        
        {pushStatus === 'default' && (
          <div className="mb-8 mt-4 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div>
              <h3 className="font-bold text-blue-900">Nyalakan Push Notifikasi</h3>
              <p className="text-sm text-blue-700 mt-1">Dapatkan pemberitahuan langsung ke perangkat Anda saat ada pembaruan penting.</p>
            </div>
            <button 
              onClick={handleSubscribe} 
              disabled={subscribing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shrink-0 transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <BellRing className="w-4 h-4" />
              {subscribing ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}
            </button>
          </div>
        )}

        {pushStatus === 'denied' && (
          <div className="mb-8 mt-4 bg-slate-100 p-4 rounded-2xl">
            <h3 className="font-bold text-slate-700">Push Notifikasi Diblokir</h3>
            <p className="text-sm text-slate-500 mt-1">Anda memblokir notifikasi di browser. Buka pengaturan browser untuk mengizinkannya.</p>
          </div>
        )}



        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-2xl">
                  <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellRing className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 flex gap-4 rounded-2xl transition-colors border ${!item.is_read ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100'}`}
              >
                <div className={`mt-0.5 shrink-0 ${!item.is_read ? 'text-blue-600' : 'text-slate-400'}`}>
                  <BellRing className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-[15px] font-semibold text-slate-900 leading-tight`}>
                    {item.title} <span className="text-slate-500 font-normal ml-1">• {new Date(item.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </h3>
                  <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">
                    {item.body}
                  </p>
                </div>
                {!item.is_read && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 shrink-0"></div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
