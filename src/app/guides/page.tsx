import { createClient } from '@/lib/supabase/server'
import GuidesClient from './GuidesClient'
import type { GuideStep } from '@/lib/actions/admin'

export interface Guide {
  id: string
  title: string
  category: string
  emoji: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  steps: GuideStep[]
}

export default async function GuidesPage() {
  const supabase = await createClient()
  let rawData = null
  try {
    const { data } = await supabase
      .from('first_aid_guides')
      .select('id, title, category, emoji, severity, description, steps')
      .eq('published', true)
      .order('sort_order', { ascending: true })
    rawData = data
  } catch { rawData = null }

  const guides: Guide[] = (rawData ?? []).map(g => ({
    id: g.id,
    title: g.title,
    category: g.category,
    emoji: g.emoji,
    severity: g.severity as Guide['severity'],
    description: g.description,
    steps: (g.steps as GuideStep[]) ?? [],
  }))

  return <GuidesClient guides={guides} />
}
