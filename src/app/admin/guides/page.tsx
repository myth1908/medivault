'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

interface GuideStep {
  title: string
  description: string
  warning?: string
}

interface Guide {
  id: string
  title: string
  category: string
  emoji: string
  severity: string
  description: string
  steps: GuideStep[]
  is_published: boolean
  sort_order: number
}

const severities = ['low', 'medium', 'high', 'critical']
const sevConfig = {
  critical: { variant: 'red' as const },
  high: { variant: 'amber' as const },
  medium: { variant: 'blue' as const },
  low: { variant: 'green' as const },
}

export default function GuidesManagerPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  // New/edit form state
  const [form, setForm] = useState<Partial<Guide>>({})
  const [steps, setSteps] = useState<GuideStep[]>([])

  const loadGuides = () => {
    fetch('/api/admin/guides')
      .then(r => r.json())
      .then(data => {
        setGuides(data.guides || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadGuides() }, [])

  const startEdit = (guide: Guide) => {
    setEditingId(guide.id)
    setForm({
      title: guide.title,
      category: guide.category,
      emoji: guide.emoji,
      severity: guide.severity,
      description: guide.description,
      is_published: guide.is_published,
    })
    setSteps([...guide.steps])
    setShowNewForm(false)
  }

  const startNew = () => {
    setEditingId(null)
    setForm({
      title: '',
      category: '',
      emoji: '🚨',
      severity: 'medium',
      description: '',
      is_published: true,
    })
    setSteps([{ title: '', description: '', warning: '' }])
    setShowNewForm(true)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowNewForm(false)
    setForm({})
    setSteps([])
  }

  const addStep = () => {
    setSteps([...steps, { title: '', description: '', warning: '' }])
  }

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx))
  }

  const updateStep = (idx: number, field: keyof GuideStep, value: string) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const saveGuide = async () => {
    const cleanSteps = steps
      .filter(s => s.title.trim())
      .map(s => ({
        title: s.title,
        description: s.description,
        ...(s.warning ? { warning: s.warning } : {}),
      }))

    setActionLoading('save')

    if (showNewForm) {
      await fetch('/api/admin/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, steps: cleanSteps }),
      })
    } else if (editingId) {
      await fetch('/api/admin/guides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...form, steps: cleanSteps }),
      })
    }

    setActionLoading(null)
    cancelEdit()
    loadGuides()
  }

  const deleteGuide = async (id: string) => {
    if (!confirm('Delete this guide? This cannot be undone.')) return
    setActionLoading(id)
    await fetch(`/api/admin/guides?id=${id}`, { method: 'DELETE' })
    setActionLoading(null)
    loadGuides()
  }

  const togglePublish = async (guide: Guide) => {
    setActionLoading(`pub-${guide.id}`)
    await fetch('/api/admin/guides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: guide.id, is_published: !guide.is_published }),
    })
    setActionLoading(null)
    loadGuides()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  const isEditing = editingId || showNewForm

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Manage First Aid Guides</h1>
          <p className="text-gray-500 mt-1">{guides.length} guides — add, edit, or remove</p>
        </div>
        {!isEditing && (
          <Button onClick={startNew} size="lg">
            <Plus className="w-4 h-4" /> New Guide
          </Button>
        )}
      </div>

      {/* Edit / New Form */}
      {isEditing && (
        <Card className="mb-6 bg-gray-50 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              {showNewForm ? 'Create New Guide' : 'Edit Guide'}
            </h2>
            <button onClick={cancelEdit} className="p-1.5 hover:bg-gray-200 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Title"
                value={form.title || ''}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. CPR (Cardiopulmonary Resuscitation)"
              />
              <Input
                label="Category"
                value={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Cardiac, Trauma, Airway"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Emoji"
                value={form.emoji || ''}
                onChange={e => setForm({ ...form, emoji: e.target.value })}
                placeholder="❤️"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                <div className="flex gap-1.5">
                  {severities.map(sev => (
                    <button
                      key={sev}
                      onClick={() => setForm({ ...form, severity: sev })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                        form.severity === sev
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={form.is_published ?? true}
                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Brief description of when to use this guide"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Steps Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Steps</label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="w-3 h-3" /> Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        value={step.title}
                        onChange={e => updateStep(idx, 'title', e.target.value)}
                        placeholder="Step title"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeStep(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={step.description}
                      onChange={e => updateStep(idx, 'description', e.target.value)}
                      placeholder="Step description..."
                      rows={2}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-2"
                    />
                    <input
                      value={step.warning || ''}
                      onChange={e => updateStep(idx, 'warning', e.target.value)}
                      placeholder="⚠️ Warning (optional)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={saveGuide} loading={actionLoading === 'save'} size="lg">
                <Save className="w-4 h-4" /> {showNewForm ? 'Create Guide' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={cancelEdit} size="lg">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Guides List */}
      {guides.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No guides yet</p>
          <Button onClick={startNew}><Plus className="w-4 h-4" /> Create First Guide</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {guides.map(guide => {
            const sev = sevConfig[guide.severity as keyof typeof sevConfig] || sevConfig.medium
            const isBeingEdited = editingId === guide.id

            return (
              <Card key={guide.id} className={`${isBeingEdited ? 'ring-2 ring-red-500' : ''} ${!guide.is_published ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl flex-shrink-0">{guide.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900">{guide.title}</p>
                      <Badge variant={sev.variant}>{guide.severity}</Badge>
                      <Badge variant="gray">{guide.category}</Badge>
                      {!guide.is_published && <Badge variant="amber">Draft</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{guide.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{guide.steps.length} steps</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => togglePublish(guide)}
                      className={`p-2 rounded-lg transition-all ${
                        guide.is_published
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={guide.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {actionLoading === `pub-${guide.id}`
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : guide.is_published
                          ? <Eye className="w-4 h-4" />
                          : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => startEdit(guide)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGuide(guide.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      {actionLoading === guide.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
