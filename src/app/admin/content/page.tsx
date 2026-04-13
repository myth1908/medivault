import { createAdminClient } from '@/lib/supabase/admin'
import { Settings } from 'lucide-react'
import SiteSettingsForm from './SiteSettingsForm'

export default async function ContentPage() {
  const adminClient = createAdminClient()
  const { data: settings } = await adminClient
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true })

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s]))

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-gray-900">Site Content</h1>
        </div>
        <p className="text-gray-500">
          Edit the text and content across the platform. Changes go live immediately.
        </p>
      </div>

      <SiteSettingsForm settings={settingsMap} />
    </div>
  )
}
