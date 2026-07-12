'use client'
import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPickerProps {
  initialPosition?: { lat: number, lng: number }
  onLocationSelect: (lat: number, lng: number) => void
}

function LocationMarker({ position, onLocationSelect }: { position: any, onLocationSelect: any }) {
  const [pos, setPos] = useState(position)
  
  const map = useMapEvents({
    click(e) {
      setPos(e.latlng)
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  useEffect(() => {
    if (position && (!pos || pos.lat !== position.lat || pos.lng !== position.lng)) {
      setPos(position)
      map.flyTo(position, map.getZoom())
    }
  }, [position, map])

  return pos === null ? null : (
    <Marker position={pos}></Marker>
  )
}

export default function MapPicker({ initialPosition, onLocationSelect }: MapPickerProps) {
  const defaultPos = initialPosition || { lat: -6.2088, lng: 106.8456 } // Default Jakarta
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    })
  }, [])

  if (!isMounted) return <div className="h-[300px] w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400 font-medium">Memuat Peta...</div>

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-10">
      <MapContainer center={defaultPos} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={initialPosition || null} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  )
}
