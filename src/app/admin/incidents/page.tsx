import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Clock } from 'lucide-react'
import IncidentStatusButton from './IncidentStatusButton'

export default async function IncidentsPage() {
  const adminClient = createAdminClient()
  const { data: incidents } = await adminClient
    .from('emergency_incidents')
    .select('*')
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, { label: string; variant: 'red' | 'amber' | 'green' | 'gray' }> = {
    active:     { label: 'Active',      variant: 'red' },
    responding: { label: 'Responding',  variant: 'amber' },
    resolved:   { label: 'Resolved',    variant: 'green' },
    cancelled:  { label: 'Cancelled',   variant: 'gray' },
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Emergency Incidents</h1>
        <p className="text-gray-500 mt-1">All reported emergency incidents — {incidents?.length ?? 0} total</p>
      </div>

      {!incidents || incidents.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No incidents recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map(incident => {
            const cfg = statusConfig[incident.status] ?? statusConfig.active
            return (
              <Card key={incident.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {incident.type} Emergency
                      </p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{incident.location_address || 'Location unavailable'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>Created: {new Date(incident.created_at).toLocaleString()}</span>
                      {incident.resolved_at && (
                        <span className="text-green-600 ml-2">
                          · Resolved: {new Date(incident.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {incident.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{incident.notes}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <IncidentStatusButton
                      incidentId={incident.id}
                      currentStatus={incident.status}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
