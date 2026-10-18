'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CaretRight, CaretLeft, X, Check } from '@phosphor-icons/react'

export interface TourStep {
  target: string // CSS selector e.g. '[data-tour="session-selector"]'
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}

interface SpotlightTourProps {
  tourKey: string
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function SpotlightTour({
  tourKey,
  steps,
  isOpen,
  onClose,
  onComplete
}: SpotlightTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  const [balloonHeight, setBalloonHeight] = useState(230)
  const balloonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reset to step 0 when tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0)
    }
  }, [isOpen])

  // Measure target element rect
  const measureTarget = useCallback(() => {
    if (!isOpen || steps.length === 0) return
    const step = steps[currentStepIndex]
    if (!step) return

    const element = document.querySelector(step.target) as HTMLElement | null
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
    } else {
      setTargetRect(null)
    }
  }, [isOpen, currentStepIndex, steps])

  // Scroll into view only when step changes or tour opens
  useEffect(() => {
    if (!isOpen || steps.length === 0) return
    const step = steps[currentStepIndex]
    if (!step) return

    const element = document.querySelector(step.target) as HTMLElement | null
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      const timer = setTimeout(() => {
        measureTarget()
      }, 260)
      return () => clearTimeout(timer)
    } else {
      setTargetRect(null)
    }
  }, [isOpen, currentStepIndex, steps, measureTarget])

  // Measure balloon size whenever it renders
  useEffect(() => {
    if (balloonRef.current) {
      const h = balloonRef.current.offsetHeight
      if (h > 0 && Math.abs(h - balloonHeight) > 6) {
        setBalloonHeight(h)
      }
    }
  })

  // Listen to window resize and scroll to re-measure rect without re-scrolling
  useEffect(() => {
    if (!isOpen) return

    const handleWindowChange = () => {
      measureTarget()
    }

    window.addEventListener('resize', handleWindowChange)
    window.addEventListener('scroll', handleWindowChange, true)

    return () => {
      window.removeEventListener('resize', handleWindowChange)
      window.removeEventListener('scroll', handleWindowChange, true)
    }
  }, [isOpen, measureTarget])

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`kitaatur_tour_completed_${tourKey}`, 'true')
    }
    if (onComplete) onComplete()
    onClose()
  }

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`kitaatur_tour_completed_${tourKey}`, 'true')
    }
    onClose()
  }

  if (!mounted || !isOpen || steps.length === 0) return null

  const currentStep = steps[currentStepIndex]
  if (!currentStep) return null

  // Spotlight dimensions
  const padding = 8
  const spotlightTop = targetRect ? Math.max(0, targetRect.top - padding) : 0
  const spotlightLeft = targetRect ? Math.max(0, targetRect.left - padding) : 0
  const spotlightWidth = targetRect ? targetRect.width + padding * 2 : 0
  const spotlightHeight = targetRect ? targetRect.height + padding * 2 : 0

  // Smart 4-Way Balloon Positioning & Viewport Clamping
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const isMobile = vw < 640
  const BALLOON_WIDTH = 360
  const GAP = 14
  const bHeight = balloonHeight || 230
  const bWidth = isMobile ? vw - 32 : Math.min(BALLOON_WIDTH, vw - 32)

  let balloonStyle: React.CSSProperties = {}

  if (targetRect) {
    if (isMobile) {
      // Mobile layout: dock at top or bottom half to avoid obscuring the target
      const targetMidY = targetRect.top + targetRect.height / 2
      const placeBottom = targetMidY < vh / 2

      balloonStyle = {
        position: 'fixed',
        left: 16,
        right: 16,
        width: 'calc(100vw - 32px)',
        maxHeight: 'calc(50vh - 20px)',
        zIndex: 9999,
        ...(placeBottom ? { bottom: 16 } : { top: 16 })
      }
    } else {
      // Desktop / Tablet layout: Smart 4-way placement
      const spaceBelow = vh - targetRect.bottom
      const spaceAbove = targetRect.top
      const spaceLeft = targetRect.left
      const spaceRight = vw - targetRect.right

      const requestedPos = currentStep.position

      let placement: 'bottom' | 'top' | 'left' | 'right' = 'bottom'

      // Check if requested position can fit
      if (requestedPos === 'top' && spaceAbove >= bHeight + GAP) {
        placement = 'top'
      } else if (requestedPos === 'bottom' && spaceBelow >= bHeight + GAP) {
        placement = 'bottom'
      } else if (requestedPos === 'left' && spaceLeft >= bWidth + GAP) {
        placement = 'left'
      } else if (requestedPos === 'right' && spaceRight >= bWidth + GAP) {
        placement = 'right'
      } else {
        // Auto-detect optimal position that avoids overflowing viewport
        if (spaceBelow >= bHeight + GAP + 16) {
          placement = 'bottom'
        } else if (spaceAbove >= bHeight + GAP + 16) {
          placement = 'top'
        } else if (spaceLeft >= bWidth + GAP + 16) {
          placement = 'left'
        } else if (spaceRight >= bWidth + GAP + 16) {
          placement = 'right'
        } else {
          // If none have full clearance, pick the side with the maximum space
          const maxSpace = Math.max(spaceBelow, spaceAbove, spaceLeft, spaceRight)
          if (maxSpace === spaceLeft) placement = 'left'
          else if (maxSpace === spaceRight) placement = 'right'
          else if (maxSpace === spaceAbove) placement = 'top'
          else placement = 'bottom'
        }
      }

      let topPos = 0
      let leftPos = 0

      if (placement === 'bottom') {
        topPos = targetRect.bottom + GAP
        leftPos = targetRect.left + (targetRect.width - bWidth) / 2
      } else if (placement === 'top') {
        topPos = targetRect.top - bHeight - GAP
        leftPos = targetRect.left + (targetRect.width - bWidth) / 2
      } else if (placement === 'left') {
        leftPos = targetRect.left - bWidth - GAP
        topPos = targetRect.top + Math.min(20, Math.max(0, (targetRect.height - bHeight) / 2))
      } else if (placement === 'right') {
        leftPos = targetRect.right + GAP
        topPos = targetRect.top + Math.min(20, Math.max(0, (targetRect.height - bHeight) / 2))
      }

      // STRICT Viewport Clamping (Guarantees 100% visibility, never cut off)
      const safeTop = Math.max(16, Math.min(topPos, vh - bHeight - 16))
      const safeLeft = Math.max(16, Math.min(leftPos, vw - bWidth - 16))

      balloonStyle = {
        position: 'fixed',
        top: safeTop,
        left: safeLeft,
        width: bWidth,
        maxHeight: `calc(100vh - 32px)`,
        zIndex: 9999
      }
    }
  } else {
    // Fallback if target element not yet in DOM
    balloonStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? 'calc(100vw - 32px)' : 380,
      maxHeight: 'calc(100vh - 48px)',
      zIndex: 9999
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9990] overflow-hidden select-none pointer-events-auto">
      
      {/* Click outside to skip (transparent backdrop, no blur over highlighted area) */}
      <div 
        className="fixed inset-0 z-[9991]"
        onClick={handleSkip}
      />

      {/* Spotlight cutout box with massive box-shadow (100% sharp & crystal clear inside) */}
      {targetRect ? (
        <div
          className="fixed pointer-events-none z-[9992] rounded-2xl border-2 border-[#0087FF] transition-all duration-300 ease-out"
          style={{
            top: spotlightTop,
            left: spotlightLeft,
            width: spotlightWidth,
            height: spotlightHeight,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72), 0 0 24px rgba(0, 135, 255, 0.45)'
          }}
        />
      ) : (
        /* Fallback dark overlay if targetRect is not yet ready */
        <div 
          className="fixed inset-0 bg-slate-900/72 z-[9991]"
          onClick={handleSkip}
        />
      )}

      {/* Pop-up Balloon Card */}
      <div 
        ref={balloonRef}
        style={balloonStyle}
        className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto"
      >
        {/* Top Header: Step Badge & Close button */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider border border-blue-200/60">
            <span>Langkah {currentStepIndex + 1} dari {steps.length}</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tutup Panduan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="space-y-1 mb-5">
          <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {currentStep.description}
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors"
          >
            Lewati
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1 active:scale-95"
              >
                <CaretLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0087FF] hover:bg-[#0077E6] shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Paham, Selesai' : 'Lanjut'}</span>
              {currentStepIndex === steps.length - 1 ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <CaretRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

      </div>

    </div>,
    document.body
  )
}

export default SpotlightTour


