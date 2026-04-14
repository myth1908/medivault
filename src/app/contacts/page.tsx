'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Copy, Phone, Plus, Share2, Star, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Contact {
  id: string
  name: string
  phone: string
  relationship: string
  is_primary: boolean
}

const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Doctor', 'Other']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('Spouse')
  const [isPrimary, setIsPrimary] = useState(false)
  const [userId, setUserId] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/contacts')
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (err) {
      console.error('Load failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserId(user.id)
      })
    })
  }, [])

  const addContact = async () => {
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          relationship,
          is_primary: isPrimary,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add contact')
        setSaving(false)
        return
      }

      setName('')
      setPhone('')
      setRelationship('Spouse')
      setIsPrimary(false)
      setShowForm(false)
      setSaving(false)
      await load()
    } catch (err) {
      console.error('Add contact failed:', err)
      setError('Failed to add contact. Please try again.')
      setSaving(false)
    }
  }

  const deleteContact = async (id: string) => {
    setContacts(c => c.filter(x => x.id !== id))
    const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
    if (!res.ok) await load()
  }

  const setPrimary = async (id: string) => {
    await fetch('/api/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_primary', id }),
    })
    await load()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Emergency Contacts</h1>
          <p className="text-gray-600 mt-1">Notified when you activate SOS</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="md">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">New Emergency Contact</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-200 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
            <Input label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
              <div className="flex flex-wrap gap-2">
                {relationships.map(r => (
                  <button
                    key={r}
                    onClick={() => setRelationship(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      relationship === r
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} className="w-4 h-4 accent-red-600" />
              <span className="text-sm text-gray-700">Set as primary emergency contact</span>
            </label>
            <Button onClick={addContact} loading={saving} className="w-full">
              Add Contact
            </Button>
          </div>
        </Card>
      )}

      {contacts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No contacts yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add your first emergency contact to get started.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add First Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <Card key={contact.id} className={contact.is_primary ? 'border-red-200 bg-red-50' : ''}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-gray-600">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{contact.name}</p>
                    {contact.is_primary && <Badge variant="red">Primary</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                  <p className="text-xs text-gray-500">{contact.relationship}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!contact.is_primary && (
                    <button onClick={() => setPrimary(contact.id)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Set as primary">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <a href={`tel:${contact.phone}`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                    <Phone className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteContact(contact.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {userId && contacts.length > 0 && (
        <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900">Share alert link with your contacts</p>
              <p className="text-xs text-blue-700 mt-1">
                Send this link to your contacts so they receive automatic push notifications on their phone when you trigger SOS.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/emergency/medivault-sos-${userId.slice(0, 12)}`
                    navigator.clipboard.writeText(url)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/emergency/medivault-sos-${userId.slice(0, 12)}`
                      navigator.share({
                        title: 'MediVault Emergency Alerts',
                        text: 'Subscribe to my emergency SOS alerts. You will be notified instantly if I trigger an emergency.',
                        url,
                      }).catch(() => {})
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-blue-700 text-xs font-medium rounded-lg border border-blue-300 hover:bg-blue-100 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
