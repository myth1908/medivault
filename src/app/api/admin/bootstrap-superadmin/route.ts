import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getRoleFromMetadata } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    // Only allow if no superadmin exists yet
    const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers()
    const superadminExists = (allUsers ?? []).some(
      u => getRoleFromMetadata(u) === 'superadmin'
    )

    if (superadminExists) {
      return NextResponse.json({ error: 'A superadmin already exists.' }, { status: 409 })
    }

    const { userId } = await req.json() as { userId: string }
    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    // Stamp role directly into auth.users app_metadata — no DB table needed
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'superadmin' },
    })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
