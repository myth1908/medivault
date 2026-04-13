'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { deleteGuide, toggleGuidePublished } from '@/lib/actions/admin'
import GuideForm from './GuideForm'
import type { GuideStep } from '@/lib/actions/admin'

interface Props {
  id: string
  published: boolean
  guide: {
    id: string
    title: string
    category: string
    emoji: string
    severity: string
    description: string
    steps: GuideStep[]
    published: boolean
    sort_order: number
  }
}

export default function GuideActions({ id, published, guide }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete guide "${guide.title}"? This cannot be undone.`)) return
    setDeleting(true)
    await deleteGuide(id)
    router.refresh()
  }

  const handleToggle = async () => {
    await toggleGuidePublished(id, !published)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="mt-4 w-full">
        <GuideForm existing={guide} onDone={() => { setEditing(false); router.refresh() }} />
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
