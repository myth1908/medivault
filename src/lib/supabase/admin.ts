import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client — bypasses RLS.
 * ONLY use in Server Components / Route Handlers / Server Actions.
 * Never expose to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Read the role from a user's app_metadata.
 * Falls back to 'user' if not set.
 */
export function getRoleFromMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: { app_metadata?: Record<string, any> } | null
): string {
  return user?.app_metadata?.role ?? 'user'
}
