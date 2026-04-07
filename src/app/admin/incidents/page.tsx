import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin } from 'lucide-react'

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: incidents } = await supabase
    .from('emergency_incidents')
    .select('*')
    .order('created_at', { ascending: false })

  const statusConfig = {
    active: { label: 'Active', variant: 'red' as const },
    responding: { label: 'Responding', variant: 'amber' as const },
    resolved: { label: 'Resolved', variant: 'green' as const },
    cancelled: { label: 'Cancelled', variant: 'gray' as const },
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Emergency Incidents</h1>
        <p className="text-gray-600">All reported emergency incidents</p>
      </div>

      {!incidents || incidents.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No incidents recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map(incident => {
            const cfg = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.active
            return (
              <Card key={incident.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 capitalize">{incident.type} Emergency</p>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{incident.location_address || 'Location unavailable'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{new Date(incident.created_at).toLocaleString()}</p>
                    {incident.resolved_at && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Resolved: {new Date(incident.resolved_at).toLocaleString()}
                      </p>
                    )}
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
