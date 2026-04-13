import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { BookOpen, Clock } from 'lucide-react'

export default async function AuditLogPage() {
  const adminClient = createAdminClient()
  const { data: logs } = await adminClient
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch actor emails
  const actorIds = [...new Set((logs ?? []).map(l => l.actor_id))]
  const actorMap: Record<string, string> = {}

  if (actorIds.length > 0) {
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    ;(authUsers?.users ?? []).forEach(u => {
      actorMap[u.id] = u.email ?? u.id
    })
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-gray-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Audit Log</h1>
        </div>
        <p className="text-gray-500">All admin actions, most recent first.</p>
      </div>

      {!logs || logs.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No admin actions recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {actorMap[log.actor_id] ?? log.actor_id}
                    {log.target_type && ` · on ${log.target_type}`}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
