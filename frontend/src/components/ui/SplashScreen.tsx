'use client'

import { useEffect, useState } from 'react'

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Mark as shown for future reloads in the same session via a session cookie (no expires attribute)
    document.cookie = "kitaatur_splash_shown=true; path=/";

    // Start fading out after 4 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 4000)

    // Remove component entirely after fade transition (500ms)
    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 4500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  return (
    <>
      {showSplash && (
        <div
          id="splash-screen"
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* Full Screen Video Animation */}
          <video
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover z-10"
          >
            <source src="/videos/Starting Animation.webm" type="video/webm" />
          </video>
        </div>
      )}

      {/* App Content */}
      {/* We always render children so it loads data in background, but it might be hidden initially? 
          Actually, rendering it behind the fixed splash is fine. */}
      {children}
    </>
  )
}
