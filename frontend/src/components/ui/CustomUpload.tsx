'use client'
import React, { useState, useRef } from 'react'
import { ImagePlus, Loader2, X, UploadCloud } from 'lucide-react'

interface CustomUploadProps {
  onUpload: (url: string) => void
  label?: string
  preset?: string
  className?: string
  isCircular?: boolean // Untuk foto profil (bulat)
}

export function CustomUpload({ onUpload, label = "Unggah Gambar", preset = "appweb", className = "", isCircular = false }: CustomUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Harap unggah file gambar')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || preset)

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'djkkckmig'
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.secure_url) {
        onUpload(data.secure_url)
      } else {
        throw new Error(data.error?.message || 'Gagal mengunggah gambar')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  if (isCircular) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-70 z-10"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        {error && (
          <div className="absolute top-full mt-2 w-max left-1/2 -translate-x-1/2 text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/50' 
            : error 
              ? 'border-rose-300 bg-rose-50' 
              : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-slate-500">Mengunggah...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 cursor-pointer">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${error ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-600'}`}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className={`text-sm font-bold ${error ? 'text-rose-600' : 'text-slate-700'}`}>
                {label}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Klik atau seret file ke sini (maks. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
