import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { data } = await admin
    .from('site_content')
    .select('*')
    .order('section')
    .order('sort_order')

  return NextResponse.json({ content: data || [] })
}

export async function PATCH(request: NextRequest) {
  const { error, user } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()
  const { updates } = body as { updates: { key: string; value: string }[] }

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: 'Missing updates array' }, { status: 400 })
  }

  for (const { key, value } of updates) {
    await admin
      .from('site_content')
      .update({ value, updated_by: user!.id })
      .eq('key', key)
  }

  return NextResponse.json({ success: true })
}
