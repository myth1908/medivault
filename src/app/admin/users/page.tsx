'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Heart,
  Loader2,
  Phone,
  Search,
  Shield,
  ShieldOff,
  User,
  UserCheck,
  UserX,
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  medical_profile: {
    blood_type?: string
    allergies?: string[]
    medications?: string[]
    conditions?: string[]
    organ_donor?: boolean
  } | null
  contact_count: number
  incident_count: number
  active_incidents: number
}

const roleConfig = {
  admin: { label: 'Admin', variant: 'red' as const, icon: Shield },
  responder: { label: 'Responder', variant: 'blue' as const, icon: UserCheck },
  user: { label: 'User', variant: 'gray' as const, icon: User },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const handleAction = async (userId: string, action: string, value?: string) => {
    setActionLoading(`${userId}-${action}`)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, value }),
    })
    loadUsers()
    setActionLoading(null)
  }

  const filtered = users.filter(u => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'admin', 'responder', 'user'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                roleFilter === role
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => {
            const isExpanded = expandedUser === user.id
            const cfg = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.user
            const RoleIcon = cfg.icon

            return (
              <Card key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold text-gray-600">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.full_name || 'No name'}
                        </p>
                        <Badge variant={cfg.variant}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                        {!user.is_active && <Badge variant="gray">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                      <div className="flex items-center gap-1" title="Emergency contacts">
                        <Phone className="w-3 h-3" />
                        {user.contact_count}
                      </div>
                      <div className="flex items-center gap-1" title="Medical profile">
                        <Heart className="w-3 h-3" />
                        {user.medical_profile ? '✓' : '—'}
                      </div>
                      <div className="flex items-center gap-1" title="Incidents">
                        <AlertCircle className="w-3 h-3" />
                        {user.incident_count}
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contacts</p>
                        <p className="font-medium">{user.contact_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Incidents</p>
                        <p className="font-medium">{user.incident_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Active Incidents</p>
                        <p className="font-medium text-red-600">{user.active_incidents}</p>
                      </div>
                    </div>

                    {/* Medical profile */}
                    {user.medical_profile && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-700">Medical Profile</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {user.medical_profile.blood_type && (
                            <Badge variant="red">🩸 {user.medical_profile.blood_type}</Badge>
                          )}
                          {user.medical_profile.organ_donor && (
                            <Badge variant="green">💙 Organ Donor</Badge>
                          )}
                          {user.medical_profile.allergies?.map(a => (
                            <Badge key={a} variant="amber">⚠️ {a}</Badge>
                          ))}
                          {user.medical_profile.medications?.map(m => (
                            <Badge key={m} variant="blue">💊 {m}</Badge>
                          ))}
                          {user.medical_profile.conditions?.map(c => (
                            <Badge key={c} variant="gray">🏥 {c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {(['user', 'responder', 'admin'] as const).map(role => (
                          <button
                            key={role}
                            onClick={(e) => { e.stopPropagation(); handleAction(user.user_id, 'set_role', role) }}
                            disabled={user.role === role}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                              user.role === role
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            {actionLoading === `${user.user_id}-set_role` ? '...' : role}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant={user.is_active ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleAction(user.user_id, 'toggle_active')}
                        loading={actionLoading === `${user.user_id}-toggle_active`}
                      >
                        {user.is_active ? (
                          <><UserX className="w-3.5 h-3.5" /> Disable</>
                        ) : (
                          <><UserCheck className="w-3.5 h-3.5" /> Enable</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
