'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  active: [
    { label: 'Mark Responding', next: 'responding', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { label: 'Resolve',         next: 'resolved',   color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { label: 'Cancel',          next: 'cancelled',  color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  ],
  responding: [
    { label: 'Resolve',  next: 'resolved',  color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { label: 'Cancel',   next: 'cancelled', color: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  ],
  resolved: [],
  cancelled: [],
}

export default function IncidentStatusButton({
  incidentId,
  currentStatus,
}: {
  incidentId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const transitions = TRANSITIONS[currentStatus] ?? []

  if (transitions.length === 0) return null

  const handleTransition = async (nextStatus: string) => {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('emergency_incidents')
      .update({
        status: nextStatus,
        ...(nextStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', incidentId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      {transitions.map(({ label, next, color }) => (
        <button
          key={next}
          disabled={loading}
          onClick={() => handleTransition(next)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${color}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
