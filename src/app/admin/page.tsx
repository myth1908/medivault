import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Activity, AlertCircle, CheckCircle, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: userCount },
    { count: activeIncidents },
    { count: resolvedIncidents },
    { data: recentIncidents },
  ] = await Promise.all([
    supabase.from('medical_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('emergency_incidents').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const stats = [
    { label: 'Total Users', value: userCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Emergencies', value: activeIncidents || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Resolved Today', value: resolvedIncidents || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Uptime', value: '99.9%', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600">Platform health and emergency statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Emergency Incidents</CardTitle></CardHeader>
        <CardContent>
          {!recentIncidents || recentIncidents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No incidents recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    incident.status === 'active' ? 'bg-red-500' :
                    incident.status === 'resolved' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{incident.type} Emergency</p>
                    <p className="text-xs text-gray-500 truncate">{incident.location_address}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      incident.status === 'active' ? 'bg-red-100 text-red-700' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {incident.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
