'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createAnnouncement, updateAnnouncement } from '@/lib/actions/admin'
import type { AnnouncementInput } from '@/lib/actions/admin'

const TYPES = ['info', 'warning', 'success', 'emergency'] as const

interface Props {
  existing?: {
    id: string
    title: string
    body: string
    type: string
    published: boolean
    pinned: boolean
    expires_at: string | null
  }
  onDone?: () => void
}

export default function AnnouncementForm({ existing, onDone }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!!existing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [type, setType] = useState<AnnouncementInput['type']>((existing?.type as AnnouncementInput['type']) ?? 'info')
  const [published, setPublished] = useState(existing?.published ?? false)
  const [pinned, setPinned] = useState(existing?.pinned ?? false)
  const [expiresAt, setExpiresAt] = useState(
    existing?.expires_at ? new Date(existing.expires_at).toISOString().slice(0, 16) : ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')
    try {
      const input: AnnouncementInput = {
        title: title.trim(),
        body: body.trim(),
        type,
        published,
        pinned,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }
      if (existing) {
        await updateAnnouncement(existing.id, input)
      } else {
        await createAnnouncement(input)
        setTitle(''); setBody(''); setType('info'); setPublished(false); setPinned(false); setExpiresAt('')
        setOpen(false)
      }
      router.refresh()
      onDone?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
    setLoading(false)
  }

  if (!existing && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Announcement
      </button>
    )
  }

  return (
    <Card className="bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">
          {existing ? 'Edit Announcement' : 'New Announcement'}
        </h2>
        {!existing && (
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="System maintenance scheduled..." required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Body / Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="More details about this announcement..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                  type === t
                    ? t === 'emergency' ? 'bg-red-600 text-white border-red-600'
                      : t === 'warning' ? 'bg-amber-500 text-white border-amber-500'
                      : t === 'success' ? 'bg-green-600 text-white border-green-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expires At (optional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 accent-green-600" />
            <span className="text-sm text-gray-700">Publish (visible to users)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
            <span className="text-sm text-gray-700">Pin to top</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={loading}>
            {existing ? 'Save Changes' : 'Create Announcement'}
          </Button>
          {existing && onDone && (
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          )}
        </div>
      </form>
    </Card>
  )
}
