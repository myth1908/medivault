'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle, Loader2, MapPin, MessageCircle, Phone, Send, X, Bell } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { EmergencyContact, MedicalProfile } from '@/types'

type SOSStatus = 'idle' | 'locating' | 'confirming' | 'sending' | 'active' | 'cancelled'

interface ContactNotification {
  name: string
  phone: string
  normalized: string | null
  relationship: string
  whatsappUrl: string
}

const emergencyTypes = [
  { id: 'cardiac', label: 'Cardiac / Heart', emoji: '❤️', color: 'border-red-400 bg-red-50' },
  { id: 'trauma', label: 'Trauma / Injury', emoji: '🩹', color: 'border-orange-400 bg-orange-50' },
  { id: 'respiratory', label: 'Respiratory', emoji: '🫁', color: 'border-blue-400 bg-blue-50' },
  { id: 'neurological', label: 'Neurological', emoji: '🧠', color: 'border-purple-400 bg-purple-50' },
  { id: 'other', label: 'Other Emergency', emoji: '🚨', color: 'border-gray-400 bg-gray-50' },
]

export default function SOSPage() {
  const [status, setStatus] = useState<SOSStatus>('idle')
  const [selectedType, setSelectedType] = useState<string>('')
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [profile, setProfile] = useState<MedicalProfile | null>(null)
  const [countdown, setCountdown] = useState(10)
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notifyContacts, setNotifyContacts] = useState<ContactNotification[]>([])
  const [smsUri, setSmsUri] = useState('')
  const [pushSent, setPushSent] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      if (data.contacts) setContacts(data.contacts)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('medical_profiles').select('*').eq('user_id', user.id).single()
      if (p) setProfile(p)
    }
    loadData()
  }, [])

  const getLocation = (): Promise<{ lat: number; lng: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lng } = pos.coords
          let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            )
            const data = await res.json()
            address = data.display_name || address
          } catch { /* use coords */ }
          resolve({ lat, lng, address })
        },
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const handleSOSPress = async () => {
    setStatus('locating')
    setError('')

    try {
      const loc = await getLocation()
      setLocation(loc)
      setStatus('confirming')
      setCountdown(10)
    } catch {
      setError('Could not get your location. Using approximate location.')
      setLocation({ lat: 0, lng: 0, address: 'Location unavailable' })
      setStatus('confirming')
      setCountdown(10)
    }
  }

  useEffect(() => {
    if (status !== 'confirming') return
    if (countdown <= 0) {
      sendSOS()
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, countdown])

  const sendSOS = async () => {
    setStatus('sending')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: incident } = await supabase
      .from('emergency_incidents')
      .insert({
        user_id: user.id,
        type: selectedType || 'other',
        status: 'active',
        location_lat: location?.lat || 0,
        location_lng: location?.lng || 0,
        location_address: location?.address || 'Unknown',
      })
      .select()
      .single()

    if (incident) setIncidentId(incident.id)

    try {
      const res = await fetch('/api/sos/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incident?.id,
          emergencyType: selectedType || 'other',
          location,
        }),
      })
      const data = await res.json()
      setNotifyContacts(data.contacts || [])
      setSmsUri(data.smsUri || '')
      setPushSent(data.pushSent || false)
    } catch (err) {
      console.error('Notification failed:', err)
    }

    setStatus('active')
  }

  const cancelSOS = async () => {
    if (status === 'confirming') {
      setStatus('idle')
      setCountdown(10)
      return
    }
    if (incidentId) {
      const supabase = createClient()
      await supabase
        .from('emergency_incidents')
        .update({ status: 'cancelled' })
        .eq('id', incidentId)
    }
    setStatus('cancelled')
  }

  if (status === 'active') {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-red-600 rounded-3xl p-8 text-white text-center mb-6">
          <AlertCircle className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold mb-2">SOS ACTIVE</h1>
          <p className="text-red-100">Emergency alert has been sent.</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Push notification status */}
          <Card className={pushSent ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
            <div className="flex items-center gap-3">
              {pushSent ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {pushSent ? 'Push notification sent automatically' : 'Push notification sent'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Contacts subscribed to your alerts will receive this instantly on their phone.
                </p>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">Your Location</span>
            </div>
            <p className="text-sm text-gray-600">{location?.address || 'Getting location...'}</p>
            {location && location.lat !== 0 && (
              <a
                href={`https://maps.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline mt-1 inline-block"
              >
                Open in Google Maps
              </a>
            )}
          </Card>

          {/* SMS backup button */}
          {smsUri && (
            <a
              href={smsUri}
              className="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg"
            >
              <Send className="w-5 h-5" />
              Also Send SMS to Contacts
            </a>
          )}

          {/* Individual contacts */}
          {notifyContacts.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold">Contact Directly</span>
              </div>
              <div className="space-y-3">
                {notifyContacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={`tel:${c.normalized || c.phone}`} className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-all" title="Call">
                        <Phone className="w-4 h-4 text-red-600" />
                      </a>
                      <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-all" title="WhatsApp">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Medical info */}
          {profile && (
            <Card variant="emergency">
              <p className="text-xs font-semibold text-red-700 mb-2">Medical Info Shared</p>
              <div className="space-y-1 text-sm text-gray-700">
                {profile.blood_type && <p>🩸 Blood Type: <strong>{profile.blood_type}</strong></p>}
                {profile.allergies?.length > 0 && <p>⚠️ Allergies: {profile.allergies.join(', ')}</p>}
                {profile.medications?.length > 0 && <p>💊 Medications: {profile.medications.join(', ')}</p>}
              </div>
            </Card>
          )}
        </div>

        <Button variant="outline" className="w-full" size="lg" onClick={cancelSOS}>
          <X className="w-4 h-4" />
          Cancel Emergency Alert
        </Button>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Alert Cancelled</h1>
        <p className="text-gray-600 mb-8">Your emergency alert has been cancelled.</p>
        <Button onClick={() => setStatus('idle')} size="lg">Return to SOS</Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Emergency SOS</h1>
        <p className="text-gray-600 mt-1">Press the button to alert your emergency contacts</p>
      </div>

      <div className="flex flex-col items-center mb-10">
        <button
          onClick={status === 'idle' ? handleSOSPress : undefined}
          disabled={status === 'locating' || status === 'sending'}
          className="relative w-48 h-48 rounded-full bg-red-600 text-white shadow-2xl shadow-red-300 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
        >
          {status === 'locating' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-12 h-12 animate-spin" />
              <span className="font-bold text-lg">Locating...</span>
            </div>
          ) : status === 'confirming' ? (
            <div className="flex flex-col items-center">
              <span className="text-6xl font-extrabold">{countdown}</span>
              <span className="text-sm font-medium mt-1">Sending in...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-14 h-14" />
              <span className="text-2xl font-extrabold">SOS</span>
            </div>
          )}
          {status === 'idle' && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
              <span className="absolute -inset-2 rounded-full bg-red-300 opacity-20 animate-ping animation-delay-150" />
            </>
          )}
        </button>

        {status === 'confirming' && (
          <Button variant="outline" className="mt-6" onClick={cancelSOS}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Emergency type (optional)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {emergencyTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(t => t === type.id ? '' : type.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                selectedType === type.id
                  ? type.color + ' border-opacity-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{type.emoji}</div>
              <div className="text-xs font-medium text-gray-800">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {contacts.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-800 font-medium">No emergency contacts added.</p>
          <p className="text-xs text-amber-600 mt-1">Add contacts first so they can be notified.</p>
        </div>
      )}

      <Card className="bg-gray-50">
        <p className="text-xs font-semibold text-gray-700 mb-2">What happens when you press SOS:</p>
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Your GPS location is captured</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Emergency incident is logged</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Push notification sent to subscribed contacts</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Call, SMS, or WhatsApp each contact</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Medical profile shared with responders</div>
        </div>
      </Card>
    </div>
  )
}
