export type UserRole = 'user' | 'responder' | 'admin' | 'superadmin'

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  responder: 'Responder',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  responder: 1,
  admin: 2,
  superadmin: 3,
}

export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole]
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  created_at: string
}

export interface UserWithRole {
  id: string
  email: string
  full_name: string
  created_at: string
  role: UserRole
  profile?: {
    blood_type: string | null
    organ_donor: boolean
    allergies: string[]
  }
}

export interface MedicalProfile {
  id: string
  user_id: string
  blood_type: string
  allergies: string[]
  medications: string[]
  conditions: string[]
  organ_donor: boolean
  emergency_notes: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  relationship: string
  is_primary: boolean
  created_at: string
}

export interface EmergencyIncident {
  id: string
  user_id: string
  type: 'cardiac' | 'trauma' | 'respiratory' | 'neurological' | 'other'
  status: 'active' | 'responding' | 'resolved' | 'cancelled'
  location_lat: number
  location_lng: number
  location_address: string
  notes: string
  responder_id?: string
  created_at: string
  resolved_at?: string
}

export interface Hospital {
  id: string
  name: string
  address: string
  phone: string
  lat: number
  lng: number
  type: 'emergency' | 'urgent_care' | 'clinic' | 'trauma_center'
  emergency_available: boolean
  wait_time_minutes?: number
  distance_km?: number
}

export interface FirstAidGuide {
  id: string
  title: string
  category: string
  description: string
  steps: GuideStep[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  icon: string
}

export interface GuideStep {
  order: number
  title: string
  description: string
  warning?: string
}
