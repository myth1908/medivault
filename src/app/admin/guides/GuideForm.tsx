'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createGuide, updateGuide } from '@/lib/actions/admin'
import type { GuideInput, GuideStep } from '@/lib/actions/admin'

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
const CATEGORIES = ['Cardiac', 'Airway', 'Trauma', 'Neurological', 'Allergy', 'Medical', 'General']

const emptyStep = (): GuideStep => ({ order: 1, title: '', description: '', warning: '' })

interface ExistingGuide {
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

interface Props {
  existing?: ExistingGuide
  onDone?: () => void
}

export default function GuideForm({ existing, onDone }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!!existing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'General')
  const [customCategory, setCustomCategory] = useState('')
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🩹')
  const [severity, setSeverity] = useState<GuideInput['severity']>((existing?.severity as GuideInput['severity']) ?? 'medium')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [published, setPublished] = useState(existing?.published ?? true)
  const [sortOrder, setSortOrder] = useState(existing?.sort_order ?? 0)
  const [steps, setSteps] = useState<GuideStep[]>(
    existing?.steps?.length ? existing.steps : [emptyStep()]
  )

  const addStep = () => {
    setSteps(s => [...s, { ...emptyStep(), order: s.length + 1 }])
  }

  const removeStep = (idx: number) => {
    setSteps(s => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, order: i + 1 })))
  }

  const updateStep = (idx: number, field: keyof GuideStep, value: string | number) => {
    setSteps(s => s.map((st, i) => i === idx ? { ...st, [field]: value } : st))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    if (steps.some(s => !s.title.trim() || !s.description.trim())) {
      setError('All steps need a title and description'); return
    }
    setLoading(true)
    setError('')
    try {
      const finalCategory = customCategory.trim() || category
      const input: GuideInput = {
        title: title.trim(),
        category: finalCategory,
        emoji: emoji.trim() || '🩹',
        severity,
        description: description.trim(),
        steps: steps.map((s, i) => ({ ...s, order: i + 1, warning: s.warning?.trim() || undefined })),
        published,
        sort_order: sortOrder,
      }
      if (existing) {
        await updateGuide(existing.id, input)
      } else {
        await createGuide(input)
        setTitle(''); setCategory('General'); setEmoji('🩹'); setSeverity('medium')
        setDescription(''); setSteps([emptyStep()]); setPublished(true); setSortOrder(0)
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
        className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New First Aid Guide
      </button>
    )
  }

  return (
    <Card className="bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">{existing ? 'Edit Guide' : 'New Guide'}</h2>
        {!existing && (
          <button onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="CPR Guide..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Emoji Icon</label>
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              placeholder="🩹"
              maxLength={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description shown in the guide list..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              <option value="__custom">Custom…</option>
            </select>
            {category === '__custom' && (
              <input
                className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Category name"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
            <div className="flex gap-1.5 flex-wrap">
              {SEVERITIES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                    severity === s
                      ? s === 'critical' ? 'bg-red-600 text-white border-red-600'
                        : s === 'high' ? 'bg-amber-500 text-white border-amber-500'
                        : s === 'medium' ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Steps editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Steps ({steps.length})</label>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Step
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={step.title}
                    onChange={e => updateStep(idx, 'title', e.target.value)}
                    placeholder="Step title"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <textarea
                    value={step.description}
                    onChange={e => updateStep(idx, 'description', e.target.value)}
                    placeholder="Step description..."
                    required
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  <input
                    value={step.warning ?? ''}
                    onChange={e => updateStep(idx, 'warning', e.target.value)}
                    placeholder="⚠️ Warning (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4 accent-green-600" />
          <span className="text-sm text-gray-700">Publish (visible to users)</span>
        </label>

        <div className="flex gap-2">
          <Button type="submit" loading={loading}>
            {existing ? 'Save Changes' : 'Create Guide'}
          </Button>
          {existing && onDone && (
            <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
          )}
        </div>
      </form>
    </Card>
  )
}
