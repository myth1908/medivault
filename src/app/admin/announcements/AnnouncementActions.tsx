'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { deleteAnnouncement, toggleAnnouncementPublished } from '@/lib/actions/admin'
import AnnouncementForm from './AnnouncementForm'

interface Props {
  id: string
  published: boolean
  announcement: {
    id: string
    title: string
    body: string
    type: string
    published: boolean
    pinned: boolean
    expires_at: string | null
  }
}

export default function AnnouncementActions({ id, published, announcement }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${announcement.title}"?`)) return
    setDeleting(true)
    await deleteAnnouncement(id)
    router.refresh()
  }

  const handleToggle = async () => {
    await toggleAnnouncementPublished(id, !published)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="mt-4 w-full">
        <AnnouncementForm existing={announcement} onDone={() => { setEditing(false); router.refresh() }} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggle}
        title={published ? 'Unpublish' : 'Publish'}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        {published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        onClick={() => setEditing(true)}
        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
