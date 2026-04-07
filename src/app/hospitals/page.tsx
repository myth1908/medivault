'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2, MapPin, Navigation, Phone, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Hospital {
  id: string
  name: string
  address: string
  phone?: string
  lat: number
  lng: number
  type: string
  distance_km?: number
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchHospitals = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const radius = 5000
      const query = `[out:json][timeout:25];(node["amenity"~"hospital|clinic"](around:${radius},${lat},${lng});way["amenity"~"hospital|clinic"](around:${radius},${lat},${lng}););out center;`
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      const data = await res.json()

      const results: Hospital[] = data.elements
        .filter((el: { tags?: { name?: string }; lat?: number; center?: { lat?: number } }) => el.tags?.name)
        .map((el: {
          id: number;
          tags: { name?: string; 'addr:full'?: string; 'addr:street'?: string; 'addr:city'?: string; phone?: string; amenity?: string };
          lat?: number;
          lon?: number;
          center?: { lat?: number; lon?: number }
        }) => {
          const elLat = el.lat || el.center?.lat || 0
          const elLng = el.lon || el.center?.lon || 0
          return {
            id: String(el.id),
            name: el.tags.name || 'Unknown',
            address: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:city'] || 'Address unavailable',
            phone: el.tags.phone,
            lat: elLat,
            lng: elLng,
            type: el.tags.amenity || 'hospital',
            distance_km: getDistanceKm(lat, lng, elLat, elLng),
          }
        })
        .sort((a: Hospital, b: Hospital) => (a.distance_km || 0) - (b.distance_km || 0))
        .slice(0, 20)

      setHospitals(results)
    } catch {
      setLocationError('Could not load nearby hospitals. Please try again.')
    }
    setLoading(false)
  }

  const getLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        fetchHospitals(lat, lng)
      },
      () => {
        setLocationError('Could not get your location. Please enable location access.')
        setLoading(false)
      }
    )
  }

  useEffect(() => { getLocation() }, [])

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Nearby Hospitals</h1>
          <p className="text-gray-600 mt-1">Emergency rooms and clinics near you</p>
        </div>
        <Button variant="outline" size="sm" onClick={getLocation} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search hospitals..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {locationError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700">{locationError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={getLocation}>
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-sm text-gray-600">Finding hospitals near you...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No hospitals found in your area.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hospital, idx) => (
            <Card key={hospital.id} className={idx === 0 ? 'border-red-200 bg-red-50' : ''}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${idx === 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Navigation className={`w-5 h-5 ${idx === 0 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{hospital.name}</p>
                      {idx === 0 && <Badge variant="red" className="mt-1">Nearest</Badge>}
                    </div>
                    {hospital.distance_km && (
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                        {hospital.distance_km < 1
                          ? `${(hospital.distance_km * 1000).toFixed(0)}m`
                          : `${hospital.distance_km.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{hospital.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {hospital.phone && (
                      <a
                        href={`tel:${hospital.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Directions
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
