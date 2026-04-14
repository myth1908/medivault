'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  CheckCircle,
  Eye,
  Globe,
  Loader2,
  Save,
} from 'lucide-react'

interface ContentItem {
  id: string
  key: string
  value: string
  section: string
  label: string
  field_type: string
  sort_order: number
}

const sectionLabels: Record<string, { title: string; description: string; icon: string }> = {
  hero: { title: 'Hero Section', description: 'The main banner visitors see first', icon: '🎯' },
  stats: { title: 'Statistics Bar', description: 'Numbers shown below the hero', icon: '📊' },
  sos: { title: 'SOS Section', description: 'Emergency SOS feature highlight', icon: '🆘' },
  features: { title: 'Features Section', description: 'Feature cards on the landing page', icon: '✨' },
  howitworks: { title: 'How It Works', description: 'The 3-step process section', icon: '📋' },
  cta: { title: 'Call to Action', description: 'Bottom sign-up prompt', icon: '📢' },
  footer: { title: 'Footer', description: 'Footer text and links', icon: '🔗' },
}

const sectionOrder = ['hero', 'stats', 'sos', 'features', 'howitworks', 'cta', 'footer']

export default function ContentEditorPage() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changes, setChanges] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(data => {
        setContent(data.content || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleChange = (key: string, value: string) => {
    setChanges(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const getValue = (key: string) => {
    if (key in changes) return changes[key]
    return content.find(c => c.key === key)?.value || ''
  }

  const hasChanges = Object.keys(changes).length > 0

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)

    const updates = Object.entries(changes).map(([key, value]) => ({ key, value }))

    await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })

    setContent(prev => prev.map(item =>
      item.key in changes ? { ...item, value: changes[item.key] } : item
    ))
    setChanges({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sections = sectionOrder
    .map(section => ({
      section,
      items: content.filter(c => c.section === section).sort((a, b) => a.sort_order - b.sort_order),
      ...(sectionLabels[section] || { title: section, description: '', icon: '📝' }),
    }))
    .filter(s => s.items.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Edit Website Content</h1>
          <p className="text-gray-500 mt-1">Change any text on your landing page — like WordPress</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            <Eye className="w-4 h-4" />
            Preview Site
          </a>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges && !saved}
            size="lg"
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <p className="text-sm text-amber-700 font-medium">
            You have {Object.keys(changes).length} unsaved change{Object.keys(changes).length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {sections.map(({ section, items, title, description, icon }) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{icon}</span>
                {title}
              </CardTitle>
              {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {item.label}
                      <span className="text-xs text-gray-400 ml-2 font-normal">{item.key}</span>
                    </label>
                    {item.field_type === 'textarea' ? (
                      <textarea
                        value={getValue(item.key)}
                        onChange={e => handleChange(item.key, e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                    ) : (
                      <input
                        type={item.field_type === 'number' ? 'number' : 'text'}
                        value={getValue(item.key)}
                        onChange={e => handleChange(item.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between z-50">
          <p className="text-sm text-gray-600">
            <Globe className="w-4 h-4 inline mr-1" />
            {Object.keys(changes).length} unsaved change{Object.keys(changes).length > 1 ? 's' : ''}
          </p>
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Publish Changes
          </Button>
        </div>
      )}
    </div>
  )
}
