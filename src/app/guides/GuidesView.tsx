'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

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
}

const severityConfig: Record<string, { label: string; variant: 'red' | 'amber' | 'blue' | 'green' }> = {
  critical: { label: 'Critical', variant: 'red' },
  high: { label: 'High', variant: 'amber' },
  medium: { label: 'Medium', variant: 'blue' },
  low: { label: 'Low', variant: 'green' },
}

export default function GuidesView({ guides }: { guides: Guide[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = ['All', ...Array.from(new Set(guides.map(g => g.category)))]

  const filtered = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || g.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">First Aid Guides</h1>
        <p className="text-gray-600 mt-1">Step-by-step instructions for emergencies</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search guides..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(guide => {
          const isOpen = expanded === guide.id
          const sev = severityConfig[guide.severity] || severityConfig.medium

          return (
            <Card key={guide.id} className="overflow-hidden p-0">
              <button
                onClick={() => setExpanded(isOpen ? null : guide.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{guide.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{guide.title}</p>
                    <Badge variant={sev.variant}>{sev.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{guide.description}</p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-5">
                  <div className="space-y-3 mt-4">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                          {step.warning && (
                            <div className="mt-1.5 flex items-start gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <span className="text-amber-600 text-xs">⚠️</span>
                              <p className="text-xs text-amber-700">{step.warning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No guides found for &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
