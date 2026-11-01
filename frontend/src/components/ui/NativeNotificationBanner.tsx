'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, BellRinging, ArrowRight } from '@phosphor-icons/react'

export interface NativeNotificationPayload {
  id?: string
  title: string
  body: string
  url?: string
  icon?: string
  duration?: number
}

// Global dispatch helper
export function dispatchNativeNotification(payload: NativeNotificationPayload) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('kitaatur:notification', { detail: payload })
    )
  }
}

// Native audio chime synthesizer (subtle, clean, pleasant)
function playNativeChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12) // E6

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.08) // C6
    osc2.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.22) // G6

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc1.start(ctx.currentTime)
    osc2.start(ctx.currentTime + 0.08)
    osc1.stop(ctx.currentTime + 0.7)
    osc2.stop(ctx.currentTime + 0.7)
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

export function NativeNotificationBanner() {
  const router = useRouter()
  const [currentNotif, setCurrentNotif] = useState<NativeNotificationPayload | null>(null)
  const [isExiting, setIsExiting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const showNotification = (payload: NativeNotificationPayload) => {
    playNativeChime()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 40, 20])
      } catch (e) {}
    }

    setIsExiting(false)
    setCurrentNotif({
      ...payload,
      id: payload.id || `notif-${Date.now()}`
    })

    if (timerRef.current) clearTimeout(timerRef.current)
    const duration = payload.duration || 7000
    timerRef.current = setTimeout(() => {
      dismiss()
    }, duration)
  }

  const dismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      setCurrentNotif(null)
      setIsExiting(false)
    }, 220)
  }

  const handleClick = () => {
    if (!currentNotif) return
    const targetUrl = currentNotif.url
    dismiss()
    if (targetUrl && targetUrl !== '/') {
      router.push(targetUrl)
    }
  }

  useEffect(() => {
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<NativeNotificationPayload>
      if (customEvent.detail) {
        showNotification(customEvent.detail)
      }
    }

    window.addEventListener('kitaatur:notification', handleCustomEvent)

    if ('serviceWorker' in navigator) {
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          const pushData = event.data.data || {}
          showNotification({
            title: pushData.title || 'KitaAtur',
            body: pushData.body || '',
            url: pushData.url || '/',
            icon: pushData.icon || '/logo.png'
          })
        }
      }

      navigator.serviceWorker.addEventListener('message', handleSwMessage)
      return () => {
        window.removeEventListener('kitaatur:notification', handleCustomEvent)
        navigator.serviceWorker.removeEventListener('message', handleSwMessage)
      }
    }

    return () => {
      window.removeEventListener('kitaatur:notification', handleCustomEvent)
    }
  }, [])

  if (!currentNotif) return null

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[92%] sm:w-[420px] transition-all duration-300 ease-out font-sans ${
        isExiting
          ? 'opacity-0 -translate-y-5 scale-98 pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
      onMouseEnter={() => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }}
    >
      <div
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.12)] p-3.5 sm:p-4 transition-all hover:border-[#0087FF]/50 hover:shadow-[0_20px_48px_rgba(0,135,255,0.14)]"
      >
        {/* Subtle Brand Accent Line */}
        <div className="absolute top-0 inset-x-0 h-[2.5px] bg-[#0087FF]" />

        {/* Header row: Official Logo, Brand Name, Time, Close */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="KitaAtur"
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="text-[11px] font-bold tracking-wider text-[#0087FF] uppercase">
              KitaAtur
            </span>
            <span className="text-[11px] text-slate-400 font-medium">• Baru saja</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              dismiss()
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition active:scale-95"
            aria-label="Tutup notifikasi"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Content row: Icon + Title & Body */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#0087FF] flex items-center justify-center shrink-0 mt-0.5">
            <BellRinging size={19} weight="fill" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-1">
              {currentNotif.title}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600 font-normal mt-0.5 leading-relaxed line-clamp-2">
              {currentNotif.body}
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 group-hover:text-[#0087FF] transition-colors">
            Ketuk untuk membuka
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                dismiss()
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              Nanti
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
              className="text-xs font-semibold text-white bg-[#0087FF] hover:bg-[#006BD1] active:scale-[0.98] px-3.5 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
            >
              <span>Buka</span>
              <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
