import { Metadata } from 'next'
import EmergencySubscribe from './EmergencySubscribe'

export const metadata: Metadata = {
  title: 'MediVault Emergency Alerts',
  description: 'Subscribe to receive emergency SOS alerts from your contact',
}

export default function EmergencyPage({ params }: { params: { topic: string } }) {
  return <EmergencySubscribe topic={params.topic} />
}
