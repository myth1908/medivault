import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verify the calling user is superadmin
    const { data: actorRoleRow } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const actorRole = (actorRoleRow?.role ?? 'user') as UserRole
    if (actorRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: superadmin required' }, { status: 403 })
    }

    const { userId, role: newRole } = await req.json() as { userId: string; role: UserRole; actorId: string }

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    const validRoles: UserRole[] = ['user', 'responder', 'admin', 'superadmin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Cannot demote another superadmin unless you are the only one
    const { data: targetRoleRow } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    const targetRole = (targetRoleRow?.role ?? 'user') as UserRole

    // Superadmin can always change roles; just prevent self-demotion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Upsert the role
    const { error } = await adminClient
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole, granted_by: user.id }, { onConflict: 'user_id' })

    if (error) throw error

    // Write audit log
    await adminClient.from('admin_audit_log').insert({
      actor_id: user.id,
      action: `Changed role: ${targetRole} → ${newRole}`,
      target_type: 'user',
      target_id: userId,
      metadata: { old_role: targetRole, new_role: newRole },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
