import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { data } = await admin
    .from('first_aid_guides')
    .select('*')
    .order('sort_order')

  return NextResponse.json({ guides: data || [] })
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()

  const { data, error: insertErr } = await admin
    .from('first_aid_guides')
    .insert({
      title: body.title || 'New Guide',
      category: body.category || 'General',
      emoji: body.emoji || '🚨',
      severity: body.severity || 'medium',
      description: body.description || '',
      steps: body.steps || [],
      is_published: body.is_published ?? true,
      sort_order: body.sort_order || 0,
      created_by: user!.id,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ guide: data })
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Missing guide id' }, { status: 400 })

  const { error: updateErr } = await admin
    .from('first_aid_guides')
    .update(updates)
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing guide id' }, { status: 400 })

  const { error: deleteErr } = await admin
    .from('first_aid_guides')
    .delete()
    .eq('id', id)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
