'use client'

import { useEffect } from 'react'

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // High pitch (C6)
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02); // quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1); // decay

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  } catch (e) {
    console.error('Audio play failed:', e);
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_RECEIVED') {
          playNotificationSound();
        }
      });

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered with scope:', registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Check every hour
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

