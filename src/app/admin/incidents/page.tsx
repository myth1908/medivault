'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface Incident {
  id: string
  user_id: string
  type: string
  status: string
  location_lat: number
  location_lng: number
  location_address: string
  notes: string
  created_at: string
  resolved_at: string | null
  user_name: string
  user_email: string
  medical_profile: {
    blood_type?: string
    allergies?: string[]
    medications?: string[]
    conditions?: string[]
  } | null
}

const statusConfig = {
  active: { label: 'Active', variant: 'red' as const, icon: AlertCircle, color: 'bg-red-500' },
  responding: { label: 'Responding', variant: 'amber' as const, icon: Clock, color: 'bg-amber-500' },
  resolved: { label: 'Resolved', variant: 'green' as const, icon: CheckCircle, color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', variant: 'gray' as const, icon: XCircle, color: 'bg-gray-400' },
}

const typeEmoji: Record<string, string> = {
  cardiac: '❤️',
  trauma: '🩹',
  respiratory: '🫁',
  neurological: '🧠',
  other: '🚨',
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadIncidents = () => {
    fetch('/api/admin/incidents')
      .then(r => r.json())
      .then(data => {
        setIncidents(data.incidents || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadIncidents() }, [])

  const handleAction = async (incidentId: string, action: string) => {
    setActionLoading(`${incidentId}-${action}`)
    await fetch('/api/admin/incidents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId, action }),
    })
    loadIncidents()
    setActionLoading(null)
  }

  const filtered = incidents.filter(i => {
    const matchesSearch =
      i.user_name.toLowerCase().includes(search.toLowerCase()) ||
      i.user_email.toLowerCase().includes(search.toLowerCase()) ||
      i.location_address.toLowerCase().includes(search.toLowerCase()) ||
      i.type.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = incidents.filter(i => i.status === 'active').length
  const respondingCount = incidents.filter(i => i.status === 'responding').length

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
          <h1 className="text-2xl font-extrabold text-gray-900">Emergency Incidents</h1>
          <p className="text-gray-500 mt-1">
            {incidents.length} total — {activeCount} active, {respondingCount} responding
          </p>
        </div>
      </div>

      {/* Active alert banner */}
      {activeCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {activeCount} active emergency{activeCount > 1 ? 'ies' : ''} requiring attention
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, location, or type..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'responding', 'resolved', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                statusFilter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No incidents found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(incident => {
            const isExpanded = expandedIncident === incident.id
            const cfg = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.active

            return (
              <Card
                key={incident.id}
                className={incident.status === 'active' ? 'border-red-200 bg-red-50/30' : ''}
              >
                <button
                  onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.color} ${incident.status === 'active' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">{typeEmoji[incident.type] || '🚨'}</span>
                        <p className="font-semibold text-gray-900 capitalize">{incident.type} Emergency</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.user_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{incident.location_address || 'Unknown'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{new Date(incident.created_at).toLocaleString()}</p>
                      {incident.resolved_at && (
                        <p className="text-[10px] text-green-600">
                          Resolved: {new Date(incident.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">User</p>
                        <p className="font-medium">{incident.user_name}</p>
                        <p className="text-xs text-gray-400">{incident.user_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium capitalize">{incident.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="font-medium">{new Date(incident.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-xs">{incident.location_address || 'Unavailable'}</p>
                        {incident.location_lat !== 0 && (
                          <a
                            href={`https://www.google.com/maps?q=${incident.location_lat},${incident.location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Open in Maps →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Medical profile */}
                    {incident.medical_profile && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Medical Information
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {incident.medical_profile.blood_type && (
                            <Badge variant="red">🩸 {incident.medical_profile.blood_type}</Badge>
                          )}
                          {incident.medical_profile.allergies?.map(a => (
                            <Badge key={a} variant="amber">⚠️ {a}</Badge>
                          ))}
                          {incident.medical_profile.medications?.map(m => (
                            <Badge key={m} variant="blue">💊 {m}</Badge>
                          ))}
                          {incident.medical_profile.conditions?.map(c => (
                            <Badge key={c} variant="gray">🏥 {c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {incident.notes && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Notes</p>
                        <p className="text-sm text-gray-600">{incident.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {incident.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(incident.id, 'respond')}
                            loading={actionLoading === `${incident.id}-respond`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Mark Responding
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(incident.id, 'resolve')}
                            loading={actionLoading === `${incident.id}-resolve`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(incident.id, 'cancel')}
                            loading={actionLoading === `${incident.id}-cancel`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </>
                      )}
                      {incident.status === 'responding' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(incident.id, 'resolve')}
                            loading={actionLoading === `${incident.id}-resolve`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(incident.id, 'cancel')}
                            loading={actionLoading === `${incident.id}-cancel`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </>
                      )}
                      {(incident.status === 'resolved' || incident.status === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(incident.id, 'reopen')}
                          loading={actionLoading === `${incident.id}-reopen`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reopen
                        </Button>
                      )}
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
