'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ConfirmContextType {
  confirm: (title: string, message: string) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>()

  const confirm = (t: string, m: string): Promise<boolean> => {
    setTitle(t)
    setMessage(m)
    setIsOpen(true)
    return new Promise((resolve) => {
      setResolveFn(() => resolve)
    })
  }

  const handleConfirm = () => {
    setIsOpen(false)
    if (resolveFn) resolveFn(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    if (resolveFn) resolveFn(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
            </div>
            <div className="flex bg-slate-50 border-t border-slate-100 p-3 gap-3 justify-end">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
