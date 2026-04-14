import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()

  const { data: incidents } = await admin
    .from('emergency_incidents')
    .select('*')
    .order('created_at', { ascending: false })

  const userIds = [...new Set(incidents?.map(i => i.user_id) || [])]

  const { data: userProfiles } = await admin
    .from('user_profiles')
    .select('user_id, email, full_name')
    .in('user_id', userIds)

  const { data: medicalProfiles } = await admin
    .from('medical_profiles')
    .select('user_id, blood_type, allergies, medications, conditions')
    .in('user_id', userIds)

  const enriched = incidents?.map(incident => {
    const user = userProfiles?.find(u => u.user_id === incident.user_id)
    const medical = medicalProfiles?.find(m => m.user_id === incident.user_id)
    return {
      ...incident,
      user_name: user?.full_name || user?.email || 'Unknown',
      user_email: user?.email || '',
      medical_profile: medical || null,
    }
  })

  return NextResponse.json({ incidents: enriched || [] })
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()
  const { incident_id, action, notes } = body

  if (!incident_id || !action) {
    return NextResponse.json({ error: 'Missing incident_id or action' }, { status: 400 })
  }

  switch (action) {
    case 'resolve': {
      const { error: err } = await admin
        .from('emergency_incidents')
        .update({ status: 'resolved', resolved_at: new Date().toISOString(), notes: notes || '' })
        .eq('id', incident_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    case 'respond': {
      const { error: err } = await admin
        .from('emergency_incidents')
        .update({ status: 'responding' })
        .eq('id', incident_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    case 'cancel': {
      const { error: err } = await admin
        .from('emergency_incidents')
        .update({ status: 'cancelled' })
        .eq('id', incident_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    case 'reopen': {
      const { error: err } = await admin
        .from('emergency_incidents')
        .update({ status: 'active', resolved_at: null })
        .eq('id', incident_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
