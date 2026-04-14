import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ contacts: [], error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_primary', { ascending: false })

  if (error) {
    return NextResponse.json({ contacts: [], error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contacts: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase.from('emergency_contacts').insert({
    user_id: user.id,
    name: body.name,
    phone: body.phone,
    relationship: body.relationship || 'Other',
    is_primary: body.is_primary || false,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contact: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing contact id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === 'set_primary') {
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', user.id)

    await supabase
      .from('emergency_contacts')
      .update({ is_primary: true })
      .eq('id', body.id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
