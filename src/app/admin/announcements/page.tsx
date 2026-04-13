import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Megaphone, Pin } from 'lucide-react'
import AnnouncementForm from './AnnouncementForm'
import AnnouncementActions from './AnnouncementActions'

const typeVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  emergency: 'red',
  warning:   'amber',
  success:   'green',
  info:      'gray',
}

export default async function AnnouncementsPage() {
  const adminClient = createAdminClient()
  const { data: announcements } = await adminClient
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-blue-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Announcements</h1>
        </div>
        <p className="text-gray-500">Publish news and alerts that appear on the user dashboard.</p>
      </div>

      {/* Create form */}
      <div className="mb-8">
        <AnnouncementForm />
      </div>

      {/* List */}
      {!announcements || announcements.length === 0 ? (
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
                    <Badge variant={typeVariant[ann.type] ?? 'gray'}>
                      {ann.type.charAt(0).toUpperCase() + ann.type.slice(1)}
                    </Badge>
                    {!ann.published && <Badge variant="gray">Draft</Badge>}
                    {ann.published && <Badge variant="green">Live</Badge>}
                  </div>
                  {ann.body && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ann.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Created: {new Date(ann.created_at).toLocaleString()}</span>
                    {ann.expires_at && (
                      <span className="text-amber-500">
                        Expires: {new Date(ann.expires_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <AnnouncementActions
                    id={ann.id}
                    published={ann.published}
                    announcement={ann}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
