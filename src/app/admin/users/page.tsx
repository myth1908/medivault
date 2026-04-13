import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { User, Shield } from 'lucide-react'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

const roleVariant: Record<UserRole, 'red' | 'amber' | 'green' | 'gray'> = {
  superadmin: 'red',
  admin:      'amber',
  responder:  'green',
  user:       'gray',
}

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) return null

  const adminClient = createAdminClient()

  // Fetch all users from auth + their roles and profiles
  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const { data: roles } = await adminClient.from('user_roles').select('user_id, role')
  const { data: profiles } = await adminClient
    .from('medical_profiles')
    .select('user_id, blood_type, organ_donor, allergies')

  const roleMap: Record<string, UserRole> = Object.fromEntries(
    (roles ?? []).map(r => [r.user_id, r.role as UserRole])
  )
  const profileMap: Record<string, typeof profiles extends (infer T)[] | null ? T : never> =
    Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))

  interface AdminUser {
    id: string
    email: string
    full_name: string
    created_at: string
    role: UserRole
    profile: { blood_type: string | null; organ_donor: boolean; allergies: string[] } | null
  }

  const users: AdminUser[] = (authUsers?.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '—',
    full_name: (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || 'Unknown',
    created_at: u.created_at,
    role: (roleMap[u.id] ?? 'user') as UserRole,
    profile: profileMap[u.id] ?? null,
  }))

  // Sort: superadmin first, then admin, then responder, then user; within group by created_at
  const ORDER: UserRole[] = ['superadmin', 'admin', 'responder', 'user']
  users.sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">All registered accounts — {users.length} total</p>
      </div>

      {users.length === 0 ? (
        <Card className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <Card key={u.id}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  u.role === 'superadmin' ? 'bg-yellow-100' :
                  u.role === 'admin'      ? 'bg-blue-100' :
                  'bg-gray-100'
                }`}>
                  {u.role === 'superadmin' || u.role === 'admin'
                    ? <Shield className={`w-5 h-5 ${u.role === 'superadmin' ? 'text-yellow-600' : 'text-blue-500'}`} />
                    : <User className="w-5 h-5 text-gray-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                    {u.id === currentUser.id && (
                      <span className="text-xs text-gray-400">(you)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Joined: {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 justify-end flex-shrink-0">
                  <Badge variant={roleVariant[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  {u.profile?.blood_type && <Badge variant="red">{u.profile.blood_type}</Badge>}
                  {u.profile?.organ_donor && <Badge variant="green">Donor</Badge>}
                  {(u.profile?.allergies?.length ?? 0) > 0 && (
                    <Badge variant="amber">{u.profile!.allergies.length} allergies</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
