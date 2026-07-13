'use client'

import { useEffect, useState } from 'react'

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    // Mark as shown for future reloads in the same session via a session cookie (no expires attribute)
    document.cookie = "kitaatur_splash_shown=true; path=/";

    // Start fading out after 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 1500)

    // Remove component entirely after fade transition (500ms)
    const removeTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

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
          {/* Main Logo with Shine Effect */}
          <div className="relative w-56 md:w-64 flex justify-center items-center">
            {/* The Logo */}
            <img 
              src="/logo.png" 
              alt="KitaAtur Logo" 
              className="w-full h-auto object-contain z-10 drop-shadow-sm" 
            />
            {/* Shine overlay that matches logo outline */}
            <div 
              className="absolute inset-0 z-20 pointer-events-none animate-shimmer"
              style={{
                backgroundImage: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.9) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                maskImage: 'url(/logo.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/logo.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </div>

          {/* Credit at bottom center */}
          <div className="absolute bottom-8 flex items-center justify-center">
            <img 
              src="/icons/RINZ GROUP.png" 
              alt="RINZ GROUP" 
              className="h-5 object-contain opacity-80"
            />
          </div>
        </div>
      )}
      
      {/* App Content */}
      {/* We always render children so it loads data in background, but it might be hidden initially? 
          Actually, rendering it behind the fixed splash is fine. */}
      {children}
    </>
  )
}
