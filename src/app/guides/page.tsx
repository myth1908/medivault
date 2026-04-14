import { createClient } from '@/lib/supabase/server'
import GuidesView from './GuidesView'

export const revalidate = 60

export default async function GuidesPage() {
  let guides: { id: string; title: string; category: string; emoji: string; severity: string; description: string; steps: { title: string; description: string; warning?: string }[] }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('first_aid_guides')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')

    if (data && data.length > 0) {
      guides = data.map(g => ({
        id: g.id,
        title: g.title,
        category: g.category,
        emoji: g.emoji,
        severity: g.severity,
        description: g.description,
        steps: typeof g.steps === 'string' ? JSON.parse(g.steps) : g.steps,
      }))
    }
  } catch {
    // Fall through to hardcoded fallback
  }

  if (guides.length === 0) {
    guides = fallbackGuides
  }

  return <GuidesView guides={guides} />
}

const fallbackGuides = [
  {
    id: 'cpr', title: 'CPR (Cardiopulmonary Resuscitation)', category: 'Cardiac', emoji: '❤️', severity: 'critical',
    description: 'Perform CPR on an unresponsive adult who is not breathing normally.',
    steps: [
      { title: 'Call 911', description: 'Call emergency services immediately.' },
      { title: 'Chest Compressions', description: 'Push hard and fast on center of chest, 100-120 per minute.' },
      { title: 'Continue Until Help Arrives', description: 'Keep going until emergency services arrive.' },
    ],
  },
]
