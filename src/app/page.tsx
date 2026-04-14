import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Heart,
  Hospital,
  Phone,
  Shield,
  Users,
  Zap,
} from 'lucide-react'

const features = [
  { icon: AlertCircle, title: 'One-Tap SOS', description: 'Instantly alert emergency services and your contacts with your exact location in seconds.', color: 'text-red-600', bg: 'bg-red-50' },
  { icon: Heart, title: 'Medical Profile', description: 'Store blood type, allergies, medications, and conditions — accessible by first responders.', color: 'text-pink-600', bg: 'bg-pink-50' },
  { icon: Phone, title: 'Emergency Contacts', description: 'Manage and instantly notify your emergency contacts with your status and location.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Hospital, title: 'Nearby Hospitals', description: 'Find the closest emergency rooms and urgent care centers with real-time directions.', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: BookOpen, title: 'First Aid Guides', description: 'Step-by-step instructions for CPR, choking, burns, fractures, and 20+ emergencies.', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Shield, title: 'Secure & Private', description: 'Your medical data is encrypted and only accessible to you and authorized responders.', color: 'text-gray-600', bg: 'bg-gray-50' },
]

async function getContent() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_content').select('key, value')
    const map: Record<string, string> = {}
    data?.forEach(item => { map[item.key] = item.value })
    return map
  } catch {
    return {} as Record<string, string>
  }
}

export default async function LandingPage() {
  const c = await getContent()

  const stats = [
    { value: c.stat_1_value || '< 3s', label: c.stat_1_label || 'SOS Alert Time' },
    { value: c.stat_2_value || '24/7', label: c.stat_2_label || 'Always Available' },
    { value: c.stat_3_value || '100%', label: c.stat_3_label || 'Encrypted Data' },
    { value: c.stat_4_value || '50+', label: c.stat_4_label || 'First Aid Guides' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-xl text-red-600">
              <Activity className="w-6 h-6" />
              MediVault
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 bg-gradient-to-b from-red-50 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            {c.hero_badge || 'Emergency-Ready in Seconds'}
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            {c.hero_title || 'Your Medical Emergency'}{' '}
            <span className="text-red-600">{c.hero_title_highlight || 'Platform'}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {c.hero_subtitle || 'Store your critical medical information, manage emergency contacts, and get instant help when every second counts.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 text-lg font-bold bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95">
              {c.hero_cta_primary || 'Create Your Profile — Free'}
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-white text-gray-900 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
              {c.hero_cta_secondary || 'Sign In'}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOS Demo */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-10 text-white text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-extrabold mb-3">{c.sos_title || "One tap. That's all it takes."}</h2>
            <p className="text-red-100 text-lg max-w-xl mx-auto mb-8">
              {c.sos_subtitle || "In an emergency, every second matters. MediVault's SOS system alerts your contacts and emergency services with your location instantly."}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              {['Location Shared', 'Contacts Notified', 'Help Dispatched'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className="w-8 h-px bg-red-400" />}
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-red-200" />
                    <span className="font-medium">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              {c.features_title || 'Everything you need in an emergency'}
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {c.features_subtitle || 'MediVault brings together all critical tools into one platform — always accessible, even offline.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className={`inline-flex p-3 rounded-xl ${bg} mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-16">{c.howit_title || 'Get set up in 3 minutes'}</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: c.step_1_title || 'Create Account', desc: c.step_1_desc || 'Sign up free and create your secure medical profile.' },
              { step: '02', title: c.step_2_title || 'Add Your Info', desc: c.step_2_desc || 'Enter blood type, allergies, medications, and emergency contacts.' },
              { step: '03', title: c.step_3_title || "You're Protected", desc: c.step_3_desc || 'Use the SOS button and access guides anytime, anywhere.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-lg mb-4">{step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-4xl font-extrabold text-white mb-4">
            {c.cta_title || 'Be prepared before an emergency happens'}
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            {c.cta_subtitle || 'Join thousands of people who trust MediVault with their emergency preparedness.'}
          </p>
          <Link href="/auth/signup" className="inline-flex px-8 py-4 text-lg font-bold bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg">
            {c.cta_button || 'Create Your Free Account'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-red-600">
            <Activity className="w-5 h-5" />
            MediVault
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} MediVault. {c.footer_tagline || 'Your health, always protected.'}
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
