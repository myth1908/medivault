import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()

  const { data: users } = await admin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const userIds = users?.map(u => u.user_id) || []

  const [{ data: profiles }, { data: contacts }, { data: incidents }] = await Promise.all([
    admin.from('medical_profiles').select('user_id, blood_type, allergies, medications, conditions, organ_donor'),
    admin.from('emergency_contacts').select('user_id').in('user_id', userIds),
    admin.from('emergency_incidents').select('user_id, status').in('user_id', userIds),
  ])

  const enriched = users?.map(user => {
    const profile = profiles?.find(p => p.user_id === user.user_id)
    const contactCount = contacts?.filter(c => c.user_id === user.user_id).length || 0
    const incidentCount = incidents?.filter(i => i.user_id === user.user_id).length || 0
    const activeIncidents = incidents?.filter(i => i.user_id === user.user_id && i.status === 'active').length || 0

    return {
      ...user,
      medical_profile: profile || null,
      contact_count: contactCount,
      incident_count: incidentCount,
      active_incidents: activeIncidents,
    }
  })

  return NextResponse.json({ users: enriched || [] })
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()
  const { user_id, action, value } = body

  if (!user_id || !action) {
    return NextResponse.json({ error: 'Missing user_id or action' }, { status: 400 })
  }

  switch (action) {
    case 'set_role': {
      if (!['user', 'responder', 'admin'].includes(value)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      const { error: err } = await admin
        .from('user_profiles')
        .update({ role: value })
        .eq('user_id', user_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    case 'toggle_active': {
      const { data: current } = await admin
        .from('user_profiles')
        .select('is_active')
        .eq('user_id', user_id)
        .single()
      const { error: err } = await admin
        .from('user_profiles')
        .update({ is_active: !current?.is_active })
        .eq('user_id', user_id)
      if (err) return NextResponse.json({ error: err.message }, { status: 500 })
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
