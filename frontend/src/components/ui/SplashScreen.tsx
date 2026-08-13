'use client'

import { useEffect, useState } from 'react'

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const [isPortrait, setIsPortrait] = useState(true)

  useEffect(() => {
    // Check orientation
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    
    // Initial check
    checkOrientation()
    
    // Listen for resize
    window.addEventListener('resize', checkOrientation)

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
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])

  return (
    <>
      {showSplash && (
        <div
          id="splash-screen"
          className={`fixed inset-0 z-[9999] overflow-hidden bg-white transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
          {/* Full Screen Video Animation - portrait & landscape masing-masing sudah didesain khusus */}
          <video
            key={isPortrait ? 'portrait' : 'landscape'}
            autoPlay
            muted
            playsInline
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'cover',
            }}
          >
            <source 
              src={isPortrait ? "/videos/Starting potrait.mp4" : "/videos/Starting anm.mp4"} 
              type="video/mp4" 
            />
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
