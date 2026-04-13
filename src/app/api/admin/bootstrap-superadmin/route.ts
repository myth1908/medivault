import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Only allow this if no superadmin exists yet
    const { count } = await adminClient
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'superadmin')

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'A superadmin already exists.' }, { status: 409 })
    }

    const { userId } = await req.json() as { userId: string }

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('user_roles')
      .upsert({ user_id: userId, role: 'superadmin', granted_by: userId }, { onConflict: 'user_id' })

    if (error) throw error

    await adminClient.from('admin_audit_log').insert({
      actor_id: userId,
      action: 'Bootstrap: self-claimed superadmin role',
      target_type: 'user',
      target_id: userId,
      metadata: { bootstrap: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
