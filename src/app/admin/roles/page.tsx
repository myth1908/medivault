import { createAdminClient, getRoleFromMetadata } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Shield, User } from 'lucide-react'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'
import RoleChangeButton from './RoleChangeButton'

const roleVariantClass: Record<UserRole, string> = {
  superadmin: 'bg-yellow-100 text-yellow-800',
  admin:      'bg-blue-100 text-blue-700',
  responder:  'bg-green-100 text-green-700',
  user:       'bg-gray-100 text-gray-600',
}

export default async function RolesPage() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return null

  const adminClient = createAdminClient()
  const { data: { user: actorUser } } = await adminClient.auth.admin.getUserById(currentUser.id)
  if (getRoleFromMetadata(actorUser) !== 'superadmin') redirect('/admin?error=superadmin_required')

  const { data: authData } = await adminClient.auth.admin.listUsers()

  interface AdminUser { id: string; email: string; full_name: string; role: UserRole }
  const users: AdminUser[] = (authData?.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '—',
    full_name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Unknown',
    role: getRoleFromMetadata(u) as UserRole,
  }))

  const ORDER: UserRole[] = ['superadmin', 'admin', 'responder', 'user']
  users.sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role))
  const allRoles: UserRole[] = ['user', 'responder', 'admin', 'superadmin']

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-yellow-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Role Management</h1>
        </div>
        <p className="text-gray-500">Superadmin-only. Assign and manage user roles across the platform.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {allRoles.map(role => (
          <div key={role} className={`p-3 rounded-xl text-center ${roleVariantClass[role]}`}>
            <p className="text-sm font-semibold">{ROLE_LABELS[role]}</p>
            <p className="text-xs mt-0.5 opacity-70">
              {role === 'superadmin' && 'Full control'}
              {role === 'admin' && 'Admin panel access'}
              {role === 'responder' && 'Emergency responder'}
              {role === 'user' && 'Standard user'}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {users.map(u => (
          <Card key={u.id}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                u.role === 'superadmin' ? 'bg-yellow-100' : u.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {u.role === 'superadmin' || u.role === 'admin'
                  ? <Shield className={`w-5 h-5 ${u.role === 'superadmin' ? 'text-yellow-600' : 'text-blue-500'}`} />
                  : <User className="w-5 h-5 text-gray-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                  {u.id === currentUser.id && <span className="text-xs text-gray-400">(you)</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleVariantClass[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
                {u.id !== currentUser.id && (
                  <RoleChangeButton userId={u.id} currentRole={u.role} actorId={currentUser.id} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
