'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

const ALL_ROLES: UserRole[] = ['user', 'responder', 'admin', 'superadmin']

export default function RoleChangeButton({
  userId,
  currentRole,
  actorId,
}: {
  userId: string
  currentRole: UserRole
  actorId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole, actorId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        disabled={loading}
        onClick={() => setOpen(v => !v)}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Change Role ▾'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
          {ALL_ROLES.map(role => (
            <button
              key={role}
              onClick={() => handleChange(role)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                role === currentRole ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
              }`}
            >
              {ROLE_LABELS[role]}
              {role === currentRole && ' ✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
