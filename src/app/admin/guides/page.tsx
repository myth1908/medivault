import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, AlertTriangle } from 'lucide-react'
import GuideForm from './GuideForm'
import GuideActions from './GuideActions'
import type { GuideStep } from '@/lib/actions/admin'

const severityVariant: Record<string, 'red' | 'amber' | 'green' | 'gray'> = {
  critical: 'red', high: 'amber', medium: 'gray', low: 'green',
}

export default async function GuidesAdminPage() {
  const adminClient = createAdminClient()
  let guides: {id:string;title:string;category:string;emoji:string;severity:string;description:string;steps:GuideStep[];published:boolean;sort_order:number}[] = []
  let tablesMissing = false

  try {
    const { data, error } = await adminClient
      .from('first_aid_guides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error?.code === '42P01') { tablesMissing = true } else { guides = data ?? [] }
  } catch { tablesMissing = true }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h1 className="text-2xl font-extrabold text-gray-900">First Aid Guides</h1>
        </div>
        <p className="text-gray-500">Create and manage the guides shown to users. Changes go live immediately.</p>
      </div>

      {tablesMissing ? (
        <Card variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Database tables not set up yet</p>
              <p className="text-sm text-amber-700 mt-1">
                Run the SQL migration in your Supabase SQL Editor to enable guide management.
                File: <code className="bg-amber-100 px-1 rounded">supabase/migrations/004_content_management.sql</code>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-8"><GuideForm /></div>
          {guides.length === 0 ? (
            <Card className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No guides yet. Create your first one above.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {guides.map(guide => (
                <Card key={guide.id} className={guide.published ? '' : 'opacity-60'}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{guide.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900">{guide.title}</p>
                        <Badge variant={severityVariant[guide.severity] ?? 'gray'}>{guide.severity.charAt(0).toUpperCase() + guide.severity.slice(1)}</Badge>
                        <Badge variant="gray">{guide.category}</Badge>
                        {!guide.published && <Badge variant="gray">Draft</Badge>}
                        {guide.published && <Badge variant="green">Live</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{guide.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{(guide.steps as unknown[]).length} steps · Sort #{guide.sort_order}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <GuideActions id={guide.id} published={guide.published} guide={guide} />
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
