'use client'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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
  }, [position, map]) // Removed 'pos' from dependencies to prevent infinite loop

  return pos === null ? null : (
    <Marker position={pos}></Marker>
  )
}

export default function MapPicker({ initialPosition, onLocationSelect }: MapPickerProps) {
  const defaultPos = initialPosition || { lat: -6.2088, lng: 106.8456 } // Default Jakarta

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0 relative">
      <MapContainer center={defaultPos} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={initialPosition || null} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  )
}
