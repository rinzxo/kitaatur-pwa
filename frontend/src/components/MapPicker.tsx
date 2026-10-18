'use client'

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPickerProps {
  initialPosition?: { lat: number, lng: number } | null
  onLocationSelect: (lat: number, lng: number) => void
  height?: string
}

// Helper to keep map tiles rendered and handle flying to new coordinates
function MapController({ position }: { position?: { lat: number, lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    // Invalidate size after mount to prevent gray or misplaced tiles
    map.invalidateSize()
    const t1 = setTimeout(() => map.invalidateSize(), 150)
    const t2 = setTimeout(() => map.invalidateSize(), 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [map])

  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16), {
        duration: 1.2
      })
    }
  }, [position, map])

  return null
}

// Marker and Click Handler
function MapClickHandler({ 
  position, 
  onLocationSelect, 
  pinIcon 
}: { 
  position: { lat: number, lng: number } | null
  onLocationSelect: (lat: number, lng: number) => void
  pinIcon: any 
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
  })

  if (!position || !position.lat || !position.lng) return null

  return (
    <Marker 
      position={[position.lat, position.lng]} 
      icon={pinIcon || undefined}
    />
  )
}

export default function MapPicker({ initialPosition, onLocationSelect, height = '320px' }: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [pinIcon, setPinIcon] = useState<any>(null)
  const [layerType, setLayerType] = useState<'roadmap' | 'satellite'>('roadmap')

  // Default coordinate: Jakarta (-6.2088, 106.8456)
  const centerPos = useMemo(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      return { lat: initialPosition.lat, lng: initialPosition.lng }
    }
    return { lat: -6.2088, lng: 106.8456 }
  }, [initialPosition])

  // Google Maps Tile URLs
  // lyrs=m : Google Maps Roadmap (Regular)
  // lyrs=y : Google Maps Satellite Hybrid (Satellite imagery with road labels & places)
  const googleTileUrl = layerType === 'satellite'
    ? 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
    : 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'

  useEffect(() => {
    setIsMounted(true)
    import('leaflet').then((L) => {
      const customPin = L.divIcon({
        className: 'kitaatur-custom-pin',
        html: `
          <div style="position: relative; width: 36px; height: 44px; transform: translate(-50%, -100%); cursor: pointer; filter: drop-shadow(0 6px 14px rgba(234, 67, 53, 0.45));">
            <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.5 15.75 42.875 17.075 43.925C17.625 44.325 18.375 44.325 18.925 43.925C20.25 42.875 36 29.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="#EA4335"/>
              <circle cx="18" cy="18" r="8" fill="white"/>
              <circle cx="18" cy="18" r="4" fill="#EA4335"/>
            </svg>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })
      setPinIcon(customPin)
    })
  }, [])

  if (!isMounted) {
    return (
      <div 
        style={{ height }} 
        className="w-full bg-slate-100 rounded-2xl border border-slate-200 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400 font-semibold text-xs"
      >
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span>Memuat Google Maps...</span>
      </div>
    )
  }

  return (
    <div 
      style={{ height }} 
      className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0"
    >
      {/* Google Maps Layer Switcher Pill */}
      <div className="absolute top-2.5 right-2.5 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLayerType('roadmap')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            layerType === 'roadmap'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Peta
        </button>
        <button
          type="button"
          onClick={() => setLayerType('satellite')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            layerType === 'satellite'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Satelit
        </button>
      </div>

      {/* Google Branding Badge */}
      <div className="absolute bottom-2.5 right-2.5 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/80 shadow-xs pointer-events-none flex items-center gap-1 text-[10px] font-medium text-slate-600">
        <span className="font-bold text-[#4285F4]">G</span>
        <span className="font-bold text-[#EA4335]">o</span>
        <span className="font-bold text-[#FBBC05]">o</span>
        <span className="font-bold text-[#4285F4]">g</span>
        <span className="font-bold text-[#34A853]">l</span>
        <span className="font-bold text-[#EA4335]">e</span>
        <span>Maps</span>
      </div>

      <MapContainer 
        center={[centerPos.lat, centerPos.lng]} 
        zoom={initialPosition ? 16 : 13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={layerType}
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          url={googleTileUrl}
          subdomains={['0', '1', '2', '3']}
          maxZoom={20}
        />
        <MapController position={initialPosition} />
        <MapClickHandler 
          position={initialPosition || null} 
          onLocationSelect={onLocationSelect}
          pinIcon={pinIcon}
        />
      </MapContainer>
    </div>
  )
}
