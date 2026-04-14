import { createAdminClient } from '@/lib/supabase/admin'
import { Settings, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import SiteSettingsForm from './SiteSettingsForm'

export default async function ContentPage() {
  const adminClient = createAdminClient()
  let settingsMap: Record<string, { key: string; value: string; description: string }> = {}
  let tablesMissing = false

  try {
    const { data, error } = await adminClient.from('site_settings').select('*').order('key', { ascending: true })
    if (error?.code === '42P01') { tablesMissing = true } else { settingsMap = Object.fromEntries((data ?? []).map(s => [s.key, s])) }
  } catch { tablesMissing = true }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-gray-900">Site Content</h1>
        </div>
        <p className="text-gray-500">Edit the text and content across the platform. Changes go live immediately.</p>
      </div>

      {tablesMissing ? (
        <Card variant="warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Database tables not set up yet</p>
              <p className="text-sm text-amber-700 mt-1">
                Run the SQL migration in your Supabase SQL Editor to enable site content editing.
                File: <code className="bg-amber-100 px-1 rounded">supabase/migrations/004_content_management.sql</code>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <SiteSettingsForm settings={settingsMap} />
      )}
    </div>
  )
}
