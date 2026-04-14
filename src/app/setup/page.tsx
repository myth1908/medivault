export const dynamic = 'force-dynamic'

import { createAdminClient, getRoleFromMetadata } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm'

export default async function SetupPage() {
  const adminClient = createAdminClient()

  // Lock page if a superadmin already exists
  const { data: { users: allUsers } } = await adminClient.auth.admin.listUsers()
  const superadminExists = (allUsers ?? []).some(
    u => getRoleFromMetadata(u) === 'superadmin'
  )

  if (superadminExists) redirect('/admin')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/setup')

  return <SetupForm userId={user.id} email={user.email ?? ''} />
}
