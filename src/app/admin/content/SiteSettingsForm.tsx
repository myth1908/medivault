'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { updateSiteSettings } from '@/lib/actions/admin'

interface Setting {
  key: string
  value: string
  description: string
}

interface Props {
  settings: Record<string, Setting>
}

const SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Branding',
    keys: ['site_name'],
  },
  {
    title: 'Landing Page — Hero',
    keys: ['hero_title', 'hero_subtitle', 'hero_cta_primary', 'hero_cta_secondary'],
  },
  {
    title: 'Landing Page — Stats',
    keys: ['stats_sos_time', 'stats_availability', 'stats_encryption', 'stats_guides'],
  },
  {
    title: 'Dashboard',
    keys: ['dashboard_welcome'],
  },
  {
    title: 'Footer & Misc',
    keys: ['footer_tagline', 'support_email'],
  },
]

export default function SiteSettingsForm({ settings }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(settings).map(([k, s]) => [k, s.value]))
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      await updateSiteSettings(values)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
    setLoading(false)
  }

  const isLongValue = (key: string) =>
    key.includes('subtitle') || key.includes('tagline') || key.includes('welcome')

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {SECTIONS.map(section => {
        const sectionKeys = section.keys.filter(k => settings[k])
        if (sectionKeys.length === 0) return null
        return (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {sectionKeys.map(key => {
                const setting = settings[key]
                const long = isLongValue(key)
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {setting.description || key}
                    </label>
                    {long ? (
                      <textarea
                        value={values[key] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                    ) : (
                      <Input
                        value={values[key] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                      />
                    )}
                    <p className="text-xs text-gray-400 mt-1 font-mono">{key}</p>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={loading} size="lg">
          {saved ? (
            <><CheckCircle className="w-4 h-4" /> Saved!</>
          ) : (
            'Save All Changes'
          )}
        </Button>
        <p className="text-sm text-gray-500">Changes apply site-wide immediately.</p>
      </div>
    </div>
  )
}
