import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalProfiles },
    { count: totalContacts },
    { count: activeIncidents },
    { count: resolvedIncidents },
    { count: totalIncidents },
    { data: recentUsers },
    { data: recentIncidents },
  ] = await Promise.all([
    admin.from('user_profiles').select('*', { count: 'exact', head: true }),
    admin.from('medical_profiles').select('*', { count: 'exact', head: true }),
    admin.from('emergency_contacts').select('*', { count: 'exact', head: true }),
    admin.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    admin.from('emergency_incidents').select('*', { count: 'exact', head: true }),
    admin.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(5),
    admin.from('emergency_incidents').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    stats: {
      totalUsers: totalUsers || 0,
      totalProfiles: totalProfiles || 0,
      totalContacts: totalContacts || 0,
      activeIncidents: activeIncidents || 0,
      resolvedIncidents: resolvedIncidents || 0,
      totalIncidents: totalIncidents || 0,
    },
    recentUsers: recentUsers || [],
    recentIncidents: recentIncidents || [],
  })
}
