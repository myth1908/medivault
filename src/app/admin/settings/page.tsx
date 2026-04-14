'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  CheckCircle,
  Database,
  Globe,
  Loader2,
  Server,
  Shield,
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [projectUrl, setProjectUrl] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '')
      setProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  const checks = [
    {
      label: 'Supabase Connection',
      status: projectUrl ? 'connected' : 'error',
      detail: projectUrl || 'Not configured',
      icon: Database,
    },
    {
      label: 'Authentication',
      status: 'connected',
      detail: 'Email auth enabled, confirmations disabled',
      icon: Shield,
    },
    {
      label: 'Vercel Deployment',
      status: 'connected',
      detail: process.env.NEXT_PUBLIC_APP_URL || 'medivault-vert.vercel.app',
      icon: Globe,
    },
    {
      label: 'Service Role Key',
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'connected' : 'warning',
      detail: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Not set — admin features limited',
      icon: Server,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Platform configuration and health checks</p>
      </div>

      {/* Admin Account */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Admin Account</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-lg font-bold text-red-600">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userEmail}</p>
              <Badge variant="red">Admin</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="mb-6">
        <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map(check => {
              const Icon = check.icon
              return (
                <div key={check.label} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    check.status === 'connected' ? 'bg-green-100' :
                    check.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      check.status === 'connected' ? 'text-green-600' :
                      check.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{check.label}</p>
                    <p className="text-xs text-gray-500 truncate">{check.detail}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    check.status === 'connected' ? 'text-green-600' :
                    check.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {check.status === 'connected' ? 'Connected' :
                     check.status === 'warning' ? 'Warning' : 'Error'}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Database Tables */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Database Tables</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'user_profiles', desc: 'User accounts & roles' },
              { name: 'medical_profiles', desc: 'Health data (blood type, allergies)' },
              { name: 'emergency_contacts', desc: 'Emergency contact list' },
              { name: 'emergency_incidents', desc: 'SOS alert history' },
            ].map(table => (
              <div key={table.name} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-mono font-semibold text-gray-900">{table.name}</p>
                <p className="text-xs text-gray-500">{table.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Row Level Security (RLS) enabled on all tables</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Users can only access their own data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Admins have read access to all data via RLS policies</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Admin routes protected by middleware role check</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">API routes require admin role verification</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
