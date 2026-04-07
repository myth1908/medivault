import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Heart,
  Hospital,
  Phone,
  Shield,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'

const quickActions = [
  {
    href: '/sos',
    label: 'SOS Emergency',
    description: 'Alert contacts & services',
    icon: AlertCircle,
    color: 'bg-red-600',
    textColor: 'text-white',
    urgent: true,
  },
  {
    href: '/hospitals',
    label: 'Find Hospitals',
    description: 'Nearest emergency rooms',
    icon: Hospital,
    color: 'bg-blue-600',
    textColor: 'text-white',
  },
  {
    href: '/guides',
    label: 'First Aid Guides',
    description: 'Step-by-step instructions',
    icon: BookOpen,
    color: 'bg-green-600',
    textColor: 'text-white',
  },
  {
    href: '/profile',
    label: 'Medical Profile',
    description: 'Update your health info',
    icon: Heart,
    color: 'bg-pink-600',
    textColor: 'text-white',
  },
  {
    href: '/contacts',
    label: 'Emergency Contacts',
    description: 'Manage your contacts',
    icon: Phone,
    color: 'bg-purple-600',
    textColor: 'text-white',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('medical_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: contacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', user.id)

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  const profileComplete = profile && profile.blood_type && profile.allergies?.length > 0
  const contactsCount = contacts?.length || 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Good {getTimeOfDay()}, {fullName.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-600 mt-1">Your emergency dashboard is ready.</p>
      </div>

      {/* Status Alerts */}
      {(!profileComplete || contactsCount === 0) && (
        <div className="mb-6 space-y-3">
          {!profileComplete && (
            <Link href="/profile" className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Heart className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Complete your medical profile</p>
                  <p className="text-xs text-amber-600">Add blood type, allergies, and medications</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {contactsCount === 0 && (
            <Link href="/contacts" className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Add emergency contacts</p>
                  <p className="text-xs text-blue-600">Who should be notified in an emergency?</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center py-4">
          <div className="text-2xl font-extrabold text-red-600">
            {profile ? '✓' : '!'}
          </div>
          <div className="text-xs text-gray-600 mt-1">Medical Profile</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-extrabold text-gray-900">{contactsCount}</div>
          <div className="text-xs text-gray-600 mt-1">Emergency Contacts</div>
        </Card>
        <Card className="text-center py-4">
          <div className="text-2xl font-extrabold text-green-600">
            <Shield className="w-6 h-6 mx-auto" />
          </div>
          <div className="text-xs text-gray-600 mt-1">Profile Secure</div>
        </Card>
      </div>

      {/* SOS Button — Large & Prominent */}
      <Link
        href="/sos"
        className="block mb-8 p-8 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl text-white text-center hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
      >
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-90" />
        <div className="text-2xl font-extrabold mb-1">Emergency SOS</div>
        <div className="text-red-200 text-sm">Tap to alert contacts & services</div>
      </Link>

      {/* Quick Actions */}
      <h2 className="text-base font-semibold text-gray-700 mb-4">Quick Access</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {quickActions.slice(1).map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all group"
          >
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Account Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
          <Activity className="w-3 h-3" />
          Active
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
