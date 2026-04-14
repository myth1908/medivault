'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getRoleFromMetadata } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(user.id)
  const role = getRoleFromMetadata(adminUser) as UserRole

  if (role !== 'admin' && role !== 'superadmin') throw new Error('Forbidden')
  return { user, role, adminClient }
}

// ─── Guide Actions ────────────────────────────────────────────────────────────

export interface GuideStep {
  order: number
  title: string
  description: string
  warning?: string
}

export interface GuideInput {
  title: string
  category: string
  emoji: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  steps: GuideStep[]
  published: boolean
  sort_order: number
}

export async function createGuide(input: GuideInput) {
  const { user, adminClient } = await requireAdmin()
  const { error, data } = await adminClient
    .from('first_aid_guides')
    .insert({ ...input, created_by: user.id, updated_by: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Created guide: ${input.title}`,
    target_type: 'guide',
    target_id: data.id,
  })
  revalidatePath('/admin/guides')
  revalidatePath('/guides')
  return data
}

export async function updateGuide(id: string, input: Partial<GuideInput>) {
  const { user, adminClient } = await requireAdmin()
  const { error } = await adminClient
    .from('first_aid_guides')
    .update({ ...input, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Updated guide: ${input.title ?? id}`,
    target_type: 'guide',
    target_id: id,
  })
  revalidatePath('/admin/guides')
  revalidatePath('/guides')
}

export async function deleteGuide(id: string) {
  const { user, adminClient } = await requireAdmin()
  const { data: guide } = await adminClient.from('first_aid_guides').select('title').eq('id', id).single()
  const { error } = await adminClient.from('first_aid_guides').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Deleted guide: ${guide?.title ?? id}`,
    target_type: 'guide',
    target_id: id,
  })
  revalidatePath('/admin/guides')
  revalidatePath('/guides')
}

export async function toggleGuidePublished(id: string, published: boolean) {
  const { user, adminClient } = await requireAdmin()
  await adminClient
    .from('first_aid_guides')
    .update({ published, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/guides')
  revalidatePath('/guides')
}

// ─── Announcement Actions ─────────────────────────────────────────────────────

export interface AnnouncementInput {
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'emergency'
  published: boolean
  pinned: boolean
  expires_at?: string | null
}

export async function createAnnouncement(input: AnnouncementInput) {
  const { user, adminClient } = await requireAdmin()
  const { error, data } = await adminClient
    .from('announcements')
    .insert({ ...input, created_by: user.id, updated_by: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Created announcement: ${input.title}`,
    target_type: 'announcement',
    target_id: data.id,
  })
  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
  return data
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput>) {
  const { user, adminClient } = await requireAdmin()
  const { error } = await adminClient
    .from('announcements')
    .update({ ...input, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Updated announcement: ${input.title ?? id}`,
    target_type: 'announcement',
    target_id: id,
  })
  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
}

export async function deleteAnnouncement(id: string) {
  const { user, adminClient } = await requireAdmin()
  const { data: ann } = await adminClient.from('announcements').select('title').eq('id', id).single()
  const { error } = await adminClient.from('announcements').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Deleted announcement: ${ann?.title ?? id}`,
    target_type: 'announcement',
    target_id: id,
  })
  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
}

export async function toggleAnnouncementPublished(id: string, published: boolean) {
  const { user, adminClient } = await requireAdmin()
  await adminClient
    .from('announcements')
    .update({ published, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/announcements')
  revalidatePath('/dashboard')
}

// ─── Site Settings Actions ────────────────────────────────────────────────────

export async function updateSiteSettings(settings: Record<string, string>) {
  const { user, adminClient } = await requireAdmin()

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }))

  for (const row of upserts) {
    await adminClient
      .from('site_settings')
      .update({ value: row.value, updated_by: row.updated_by, updated_at: row.updated_at })
      .eq('key', row.key)
  }

  await adminClient.from('admin_audit_log').insert({
    actor_id: user.id,
    action: `Updated site settings (${Object.keys(settings).join(', ')})`,
    target_type: 'site_settings',
    metadata: settings,
  })

  revalidatePath('/admin/content')
  revalidatePath('/')
  revalidatePath('/dashboard')
}
