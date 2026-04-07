import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { User } from 'lucide-react'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('medical_profiles')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Users</h1>
        <p className="text-gray-600">Registered users with medical profiles</p>
      </div>

      {!profiles || profiles.length === 0 ? (
        <Card className="text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users have created profiles yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map(profile => (
            <Card key={profile.id}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile.blood_type ? `Blood Type: ${profile.blood_type}` : 'Profile incomplete'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(profile.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.blood_type && <Badge variant="red">{profile.blood_type}</Badge>}
                  {profile.organ_donor && <Badge variant="green">Donor</Badge>}
                  {profile.allergies?.length > 0 && (
                    <Badge variant="amber">{profile.allergies.length} allergies</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
