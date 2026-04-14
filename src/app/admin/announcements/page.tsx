import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Megaphone, Pin, AlertTriangle } from 'lucide-react'
import AnnouncementForm from './AnnouncementForm'
import AnnouncementActions from './AnnouncementActions'

const typeVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  emergency: 'red', warning: 'amber', success: 'green', info: 'gray',
}

export default async function AnnouncementsPage() {
  const adminClient = createAdminClient()
  let announcements: {id:string;title:string;body:string;type:string;published:boolean;pinned:boolean;expires_at:string|null;created_at:string}[] = []
  let tablesMissing = false

  try {
    const { data, error } = await adminClient
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error?.code === '42P01') { tablesMissing = true } else { announcements = data ?? [] }
  } catch { tablesMissing = true }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-blue-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Announcements</h1>
        </div>
        <p className="text-gray-500">Publish news and alerts that appear on the user dashboard.</p>
      </div>

      {tablesMissing ? (
        <Card variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Database tables not set up yet</p>
              <p className="text-sm text-amber-700 mt-1">
                Run the SQL migration in your Supabase SQL Editor to enable announcements.
                The migration file is at <code className="bg-amber-100 px-1 rounded">supabase/migrations/004_content_management.sql</code> in the repository.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-8"><AnnouncementForm /></div>
          {announcements.length === 0 ? (
            <Card className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No announcements yet. Create your first one above.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map(ann => (
                <Card key={ann.id} className={ann.published ? '' : 'opacity-60'}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ann.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        <p className="font-semibold text-gray-900">{ann.title}</p>
                        <Badge variant={typeVariant[ann.type] ?? 'gray'}>{ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}</Badge>
                        {!ann.published && <Badge variant="gray">Draft</Badge>}
                        {ann.published && <Badge variant="green">Live</Badge>}
                      </div>
                      {ann.body && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.body}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>Created: {new Date(ann.created_at).toLocaleString()}</span>
                        {ann.expires_at && <span className="text-amber-500">Expires: {new Date(ann.expires_at).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <AnnouncementActions id={ann.id} published={ann.published} announcement={ann} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
