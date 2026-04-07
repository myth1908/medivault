'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Heart, Plus, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bloodType, setBloodType] = useState('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [medications, setMedications] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [organDonor, setOrganDonor] = useState(false)
  const [emergencyNotes, setEmergencyNotes] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newCondition, setNewCondition] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('medical_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setBloodType(data.blood_type || '')
        setAllergies(data.allergies || [])
        setMedications(data.medications || [])
        setConditions(data.conditions || [])
        setOrganDonor(data.organ_donor || false)
        setEmergencyNotes(data.emergency_notes || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('medical_profiles').upsert({
      user_id: user.id,
      blood_type: bloodType,
      allergies,
      medications,
      conditions,
      organ_donor: organDonor,
      emergency_notes: emergencyNotes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addItem = (list: string[], setList: (v: string[]) => void, value: string, setValue: (v: string) => void) => {
    const trimmed = value.trim()
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed])
      setValue('')
    }
  }

  const removeItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item))
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Medical Profile</h1>
          <p className="text-gray-600 mt-1">This info is shared with emergency responders</p>
        </div>
        <Button onClick={save} loading={saving} size="lg">
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : 'Save Profile'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Blood Type */}
        <Card>
          <CardHeader><CardTitle>🩸 Blood Type</CardTitle></CardHeader>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {bloodTypes.map(type => (
              <button
                key={type}
                onClick={() => setBloodType(t => t === type ? '' : type)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                  bloodType === type
                    ? 'bg-red-600 border-red-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader><CardTitle>⚠️ Allergies</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {allergies.map(a => (
              <span key={a} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {a}
                <button onClick={() => removeItem(allergies, setAllergies, a)} className="hover:text-red-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add allergy (e.g. Penicillin, Peanuts)"
              value={newAllergy}
              onChange={e => setNewAllergy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(allergies, setAllergies, newAllergy, setNewAllergy)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => addItem(allergies, setAllergies, newAllergy, setNewAllergy)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader><CardTitle>💊 Current Medications</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {medications.map(m => (
              <span key={m} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {m}
                <button onClick={() => removeItem(medications, setMedications, m)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add medication (e.g. Metformin 500mg)"
              value={newMedication}
              onChange={e => setNewMedication(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(medications, setMedications, newMedication, setNewMedication)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => addItem(medications, setMedications, newMedication, setNewMedication)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader><CardTitle>🏥 Medical Conditions</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {conditions.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {c}
                <button onClick={() => removeItem(conditions, setConditions, c)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add condition (e.g. Diabetes Type 2)"
              value={newCondition}
              onChange={e => setNewCondition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(conditions, setConditions, newCondition, setNewCondition)}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => addItem(conditions, setConditions, newCondition, setNewCondition)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Organ Donor */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">💙 Organ Donor</p>
              <p className="text-sm text-gray-500">Register your organ donor status</p>
            </div>
            <button
              onClick={() => setOrganDonor(!organDonor)}
              className={`relative w-12 h-6 rounded-full transition-all ${organDonor ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${organDonor ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </Card>

        {/* Emergency Notes */}
        <Card>
          <CardHeader><CardTitle>📝 Emergency Notes</CardTitle></CardHeader>
          <textarea
            value={emergencyNotes}
            onChange={e => setEmergencyNotes(e.target.value)}
            placeholder="Any additional information for emergency responders..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          />
        </Card>

        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Heart className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">This information will be visible to emergency responders when you activate SOS.</p>
        </div>

        <Button onClick={save} loading={saving} size="lg" className="w-full">
          {saved ? <><CheckCircle className="w-4 h-4" /> Profile Saved!</> : 'Save Medical Profile'}
        </Button>
      </div>
    </div>
  )
}
