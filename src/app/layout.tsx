import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediVault — Emergency Medical Platform',
  description: 'Your complete medical emergency platform. Store your medical profile, manage emergency contacts, and get instant help when it matters most.',
  keywords: ['medical emergency', 'SOS', 'first aid', 'emergency contacts', 'medical profile'],
  openGraph: {
    title: 'MediVault — Emergency Medical Platform',
    description: 'Get instant help when it matters most.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
