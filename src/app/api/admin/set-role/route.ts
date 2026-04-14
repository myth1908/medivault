import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getRoleFromMetadata } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: { user: actorUser } } = await adminClient.auth.admin.getUserById(user.id)
    const actorRole = getRoleFromMetadata(actorUser)

    if (actorRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: superadmin required' }, { status: 403 })
    }

    const { userId, role: newRole } = await req.json() as { userId: string; role: UserRole }

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    const validRoles: UserRole[] = ['user', 'responder', 'admin', 'superadmin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { role: newRole },
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
