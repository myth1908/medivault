export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SetupForm from './SetupForm'

export default async function SetupPage() {
  const adminClient = createAdminClient()

  // If a superadmin already exists, this page is locked
  const { count } = await adminClient
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'superadmin')

  if ((count ?? 0) > 0) {
    redirect('/admin')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/setup')
  }

  return <SetupForm userId={user.id} email={user.email ?? ''} />
}
