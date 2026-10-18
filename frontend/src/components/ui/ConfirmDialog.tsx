'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Warning, WarningCircle, CheckCircle, Question, X } from '@phosphor-icons/react'

export type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'success'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

export type ConfirmFunction = {
  (message: string): Promise<boolean>
  (title: string, message: string, options?: Partial<ConfirmOptions>): Promise<boolean>
  (options: ConfirmOptions): Promise<boolean>
}

interface ConfirmContextType {
  confirm: ConfirmFunction
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const useConfirm = (): ConfirmFunction => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}

function detectVariant(title: string, message: string): ConfirmVariant {
  const text = `${title} ${message}`.toLowerCase()
  if (
    text.includes('hapus') || 
    text.includes('tolak') || 
    text.includes('bahaya') || 
    text.includes('keluar') || 
    text.includes('delete') || 
    text.includes('permanen') || 
    text.includes('hangus') || 
    text.includes('putuskan') || 
    text.includes('tutup sesi')
  ) {
    return 'danger'
  }
  if (
    text.includes('peringatan') || 
    text.includes('perhatian') || 
    text.includes('alpa') || 
    text.includes('ganti') || 
    text.includes('transfer')
  ) {
    return 'warning'
  }
  if (
    text.includes('setujui') || 
    text.includes('validasi') || 
    text.includes('terima')
  ) {
    return 'success'
  }
  return 'primary'
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('Konfirmasi')
  const [message, setMessage] = useState('')
  const [confirmText, setConfirmText] = useState('Ya, Lanjutkan')
  const [cancelText, setCancelText] = useState('Batal')
  const [variant, setVariant] = useState<ConfirmVariant>('primary')
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null)

  const confirm: ConfirmFunction = useCallback((
    arg1: string | ConfirmOptions,
    arg2?: string,
    arg3?: Partial<ConfirmOptions>
  ): Promise<boolean> => {
    let resolvedTitle = 'Konfirmasi'
    let resolvedMessage = ''
    let resolvedConfirmText = 'Ya, Lanjutkan'
    let resolvedCancelText = 'Batal'
    let resolvedVariant: ConfirmVariant = 'primary'

    if (typeof arg1 === 'object' && arg1 !== null) {
      resolvedTitle = arg1.title || 'Konfirmasi'
      resolvedMessage = arg1.message || ''
      resolvedConfirmText = arg1.confirmText || 'Ya, Lanjutkan'
      resolvedCancelText = arg1.cancelText || 'Batal'
      resolvedVariant = arg1.variant || detectVariant(resolvedTitle, resolvedMessage)
    } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
      resolvedTitle = arg1
      resolvedMessage = arg2
      if (arg3) {
        if (arg3.confirmText) resolvedConfirmText = arg3.confirmText
        if (arg3.cancelText) resolvedCancelText = arg3.cancelText
        resolvedVariant = arg3.variant || detectVariant(resolvedTitle, resolvedMessage)
      } else {
        resolvedVariant = detectVariant(resolvedTitle, resolvedMessage)
      }
    } else if (typeof arg1 === 'string' && !arg2) {
      resolvedTitle = 'Konfirmasi'
      resolvedMessage = arg1
      resolvedVariant = detectVariant(resolvedTitle, resolvedMessage)
    }

    setTitle(resolvedTitle)
    setMessage(resolvedMessage)
    setConfirmText(resolvedConfirmText)
    setCancelText(resolvedCancelText)
    setVariant(resolvedVariant)
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    if (resolveFn) {
      resolveFn(true)
      setResolveFn(null)
    }
  }, [resolveFn])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    if (resolveFn) {
      resolveFn(false)
      setResolveFn(null)
    }
  }, [resolveFn])

  // Keyboard navigation: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCancel, handleConfirm])

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm">
            <Warning size={26} weight="duotone" className="text-rose-600" />
          </div>
        )
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm">
            <WarningCircle size={26} weight="duotone" className="text-amber-600" />
          </div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle size={26} weight="duotone" className="text-emerald-600" />
          </div>
        )
      case 'primary':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
            <Question size={26} weight="duotone" className="text-blue-600" />
          </div>
        )
    }
  }

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-600/25 ring-rose-500/30'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-lg shadow-amber-600/25 ring-amber-500/30'
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-lg shadow-emerald-600/25 ring-emerald-500/30'
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-600/25 ring-blue-500/30'
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel()
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X size={15} weight="bold" />
            </button>

            {/* Modal Body */}
            <div className="p-6 md:p-7">
              <div className="flex items-start gap-4 mb-4">
                {renderIcon()}
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl transition-all"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  autoFocus
                  className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none focus:ring-4 ${getConfirmButtonClasses()}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
