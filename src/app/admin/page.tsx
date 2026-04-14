'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Heart,
  Loader2,
  Phone,
  Users,
} from 'lucide-react'

interface Stats {
  totalUsers: number
  totalProfiles: number
  totalContacts: number
  activeIncidents: number
  resolvedIncidents: number
  totalIncidents: number
}

interface RecentUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface RecentIncident {
  id: string
  type: string
  status: string
  location_address: string
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data.stats)
        setRecentUsers(data.recentUsers)
        setRecentIncidents(data.recentIncidents)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/users' },
    { label: 'Active Emergencies', value: stats?.activeIncidents || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', href: '/admin/incidents' },
    { label: 'Resolved', value: stats?.resolvedIncidents || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/incidents' },
    { label: 'Medical Profiles', value: stats?.totalProfiles || 0, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', href: '/admin/users' },
    { label: 'Emergency Contacts', value: stats?.totalContacts || 0, icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/users' },
    { label: 'Total Incidents', value: stats?.totalIncidents || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', href: '/admin/incidents' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 mt-1">Platform health and emergency statistics</p>
      </div>

      {/* Active emergency banner */}
      {(stats?.activeIncidents || 0) > 0 && (
        <Link
          href="/admin/incidents"
          className="flex items-center justify-between mb-6 p-4 bg-red-600 rounded-2xl text-white hover:bg-red-700 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">{stats?.activeIncidents} Active Emergency{(stats?.activeIncidents || 0) > 1 ? 'ies' : ''}</p>
              <p className="text-red-100 text-sm">Requires immediate attention</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Users</CardTitle>
              <Link href="/admin/users" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || 'No name'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'red' : user.role === 'responder' ? 'blue' : 'gray'}>
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Incidents</CardTitle>
              <Link href="/admin/incidents" className="text-xs text-red-600 hover:text-red-700 font-medium">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentIncidents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No incidents yet</p>
            ) : (
              <div className="space-y-3">
                {recentIncidents.map(incident => (
                  <div key={incident.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      incident.status === 'active' ? 'bg-red-500 animate-pulse' :
                      incident.status === 'responding' ? 'bg-amber-500' :
                      incident.status === 'resolved' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{incident.type} Emergency</p>
                      <p className="text-xs text-gray-500 truncate">{incident.location_address || 'Unknown location'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={
                        incident.status === 'active' ? 'red' :
                        incident.status === 'responding' ? 'amber' :
                        incident.status === 'resolved' ? 'green' : 'gray'
                      }>
                        {incident.status}
                      </Badge>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(incident.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
