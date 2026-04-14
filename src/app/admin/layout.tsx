'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Activity,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/incidents', label: 'Incidents', icon: AlertCircle },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gray-900 text-white fixed h-full flex flex-col z-40">
        <div className="p-5 border-b border-gray-700/50">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white">MediVault</span>
              <span className="text-xs text-gray-400 block -mt-0.5">Admin Panel</span>
            </div>
          </Link>
        </div>

        <nav className="p-3 flex-1 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(href, exact)
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700/50 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
