'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SetupForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/bootstrap-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/admin'), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">You&apos;re a Superadmin!</h1>
          <p className="text-gray-600">Redirecting to admin panel…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Setup</h1>
          <p className="text-gray-600 mt-2">
            No superadmin exists yet. Claim the superadmin role for your account.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Account</p>
            <p className="text-sm font-semibold text-gray-900">{email}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold text-gray-700">Superadmin privileges include:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-yellow-500">★</span> Full admin panel access</li>
              <li className="flex items-center gap-2"><span className="text-yellow-500">★</span> Role management for all users</li>
              <li className="flex items-center gap-2"><span className="text-yellow-500">★</span> Audit log visibility</li>
              <li className="flex items-center gap-2"><span className="text-yellow-500">★</span> Incident status control</li>
            </ul>
          </div>

          <Button
            onClick={handleSetup}
            loading={loading}
            className="w-full"
            size="lg"
          >
            Claim Superadmin Role
          </Button>

          <p className="text-xs text-gray-400 text-center mt-4">
            This page will disappear once a superadmin exists.
          </p>
        </div>
      </div>
    </div>
  )
}
