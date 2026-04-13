import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import type { UserRole } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/admin')

  const adminClient = createAdminClient()
  const { data: roleRow } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = (roleRow?.role ?? 'user') as UserRole

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/dashboard?error=unauthorized')
  }

  const isSuperAdmin = role === 'superadmin'
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin'

  const navSections = [
    {
      label: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Platform',
      items: [
        { href: '/admin/incidents', label: 'Incidents', icon: AlertCircle },
        { href: '/admin/users', label: 'Users', icon: Users },
      ],
    },
    {
      label: 'Content',
      items: [
        { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
        { href: '/admin/guides', label: 'First Aid Guides', icon: BookOpen },
        { href: '/admin/content', label: 'Site Content', icon: Settings },
      ],
    },
    ...(isSuperAdmin
      ? [{
          label: 'Administration',
          items: [
            { href: '/admin/roles', label: 'Role Management', icon: Shield },
          ],
        }]
      : []),
    {
      label: 'Logs',
      items: [
        { href: '/admin/audit', label: 'Audit Log', icon: BookOpen },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white fixed h-full flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="p-6 border-b border-gray-800 flex-shrink-0">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg text-red-400">
            <Activity className="w-5 h-5" />
            MediVault Admin
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isSuperAdmin
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <Shield className="w-3 h-3" />
              {isSuperAdmin ? 'Superadmin' : 'Admin'}
            </span>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="p-4 flex-1 space-y-6">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 px-3 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-300 truncate">{fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8 min-h-screen">{children}</main>
    </div>
  )
}
