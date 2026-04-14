import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { AlertCircle, CheckCircle, Users, Shield, Clock } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()

  // Fetch data — all graceful, tables may not exist yet
  const [
    authData,
    profilesResult,
    activeResult,
    resolvedResult,
    recentResult,
    auditResult,
  ] = await Promise.allSettled([
    adminClient.auth.admin.listUsers(),
    adminClient.from('medical_profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('emergency_incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    adminClient.from('emergency_incidents').select('*').order('created_at', { ascending: false }).limit(8),
    adminClient.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const totalUsers = authData.status === 'fulfilled' ? (authData.value.data?.users?.length ?? 0) : 0
  const activeIncidents = activeResult.status === 'fulfilled' ? ((activeResult.value as {count: number|null}).count ?? 0) : 0
  const resolvedIncidents = resolvedResult.status === 'fulfilled' ? ((resolvedResult.value as {count: number|null}).count ?? 0) : 0
  const recentIncidents = recentResult.status === 'fulfilled' ? ((recentResult.value as {data: unknown[]|null}).data ?? []) : []
  const recentAuditLogs = auditResult.status === 'fulfilled' ? ((auditResult.value as {data: unknown[]|null}).data ?? []) : []

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Emergencies', value: activeIncidents, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Resolved Incidents', value: resolvedIncidents, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Admins', value: totalUsers > 0 ? (authData.status === 'fulfilled' ? authData.value.data?.users?.filter(u => ['admin','superadmin'].includes(u.app_metadata?.role ?? '')).length ?? 0 : 0) : 0, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Platform health and statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(recentIncidents as {id:string;type:string;status:string;location_address:string;created_at:string}[]).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No incidents recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {(recentIncidents as {id:string;type:string;status:string;location_address:string;created_at:string}[]).map((incident) => (
                  <div key={incident.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      incident.status === 'active' ? 'bg-red-500' :
                      incident.status === 'responding' ? 'bg-amber-500' :
                      incident.status === 'resolved' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize">{incident.type} Emergency</p>
                      <p className="text-xs text-gray-500 truncate">{incident.location_address || 'Location unavailable'}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ${
                      incident.status === 'active' ? 'bg-red-100 text-red-700' :
                      incident.status === 'responding' ? 'bg-amber-100 text-amber-700' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{incident.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(recentAuditLogs as {id:string;action:string;target_type:string;created_at:string}[]).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No admin actions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {(recentAuditLogs as {id:string;action:string;target_type:string;created_at:string}[]).map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">{log.target_type && `on ${log.target_type}`}</p>
                      <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
