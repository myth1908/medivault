import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { incidentId, emergencyType, location } = body

  const { data: contacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ error: 'No emergency contacts found' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('medical_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  const userName = userProfile?.full_name || user.email || 'A MediVault user'
  const typeLabel = emergencyType
    ? emergencyType.charAt(0).toUpperCase() + emergencyType.slice(1)
    : 'Medical'

  const mapUrl = location?.lat && location?.lng
    ? `https://maps.google.com/maps?q=${location.lat},${location.lng}`
    : null

  let message = `EMERGENCY SOS from ${userName}!\n\n`
  message += `Type: ${typeLabel} emergency\n`
  if (location?.address) message += `Location: ${location.address}\n`
  if (mapUrl) message += `Map: ${mapUrl}\n`

  if (profile) {
    if (profile.blood_type) message += `Blood Type: ${profile.blood_type}\n`
    if (profile.allergies?.length > 0) message += `Allergies: ${profile.allergies.join(', ')}\n`
    if (profile.medications?.length > 0) message += `Medications: ${profile.medications.join(', ')}\n`
    if (profile.conditions?.length > 0) message += `Conditions: ${profile.conditions.join(', ')}\n`
  }

  message += `\nSent via MediVault Emergency System`

  const phones = contacts
    .map(c => normalizePhone(c.phone))
    .filter((p): p is string => p !== null)

  const smsUri = `sms:${phones.join(',')}?body=${encodeURIComponent(message)}`

  const contactDetails = contacts.map(c => ({
    name: c.name,
    phone: c.phone,
    normalized: normalizePhone(c.phone),
    relationship: c.relationship,
    whatsappUrl: `https://wa.me/${normalizePhone(c.phone)?.replace('+', '')}?text=${encodeURIComponent(message)}`,
  }))

  if (incidentId) {
    await supabase
      .from('emergency_incidents')
      .update({
        notifications_sent: contacts.length,
        notifications_total: contacts.length,
      })
      .eq('id', incidentId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({
    message,
    smsUri,
    contacts: contactDetails,
    total: contacts.length,
  })
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9+]/g, '')
  if (digits.startsWith('+') && digits.length >= 10) return digits
  if (digits.startsWith('00') && digits.length >= 11) return '+' + digits.slice(2)
  if (digits.length >= 10) return '+' + digits
  return null
}
