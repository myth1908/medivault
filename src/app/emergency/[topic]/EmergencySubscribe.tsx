'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, CheckCircle, ExternalLink, Smartphone } from 'lucide-react'

export default function EmergencySubscribe({ topic }: { topic: string }) {
  const [subscribed, setSubscribed] = useState(false)
  const [messages, setMessages] = useState<{ title: string; message: string; time: number }[]>([])

  const ntfyWebUrl = `https://ntfy.sh/${topic}`
  const ntfyAppUrl = `ntfy://${topic}`

  useEffect(() => {
    const eventSource = new EventSource(`https://ntfy.sh/${topic}/sse`)
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'message') {
          setMessages(prev => [{ title: data.title || 'Emergency', message: data.message, time: data.time }, ...prev])
          if (Notification.permission === 'granted') {
            new Notification(data.title || 'Emergency SOS', { body: data.message, icon: '/favicon.ico' })
          }
        }
      } catch { /* ignore parsing errors */ }
    }
    setSubscribed(true)
    return () => eventSource.close()
  }, [topic])

  const enableBrowserNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        new Notification('MediVault Alerts Enabled', {
          body: 'You will now receive emergency SOS alerts on this device.',
          icon: '/favicon.ico',
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BellRing className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Emergency SOS Alerts</h1>
          <p className="text-gray-600 mt-2">
            Someone has added you as an emergency contact on MediVault.
            Subscribe to get instant alerts if they trigger an SOS.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Option 1: Browser notifications (this page) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Browser Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Get alerts right here in your browser. Keep this tab open or bookmark it.</p>
                <button
                  onClick={enableBrowserNotifications}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all"
                >
                  Enable Browser Alerts
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Phone app */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Phone Notifications (Recommended)</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Install the free <strong>ntfy</strong> app for reliable push notifications even when the browser is closed.
                </p>
                <div className="flex gap-2 mt-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-all flex items-center gap-1"
                  >
                    Android
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://apps.apple.com/app/ntfy/id1625396347"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-all flex items-center gap-1"
                  >
                    iPhone
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  After installing, subscribe to: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{topic}</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection status */}
        <div className={`p-3 rounded-xl text-sm text-center mb-6 ${
          subscribed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600'
        }`}>
          {subscribed ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Connected — listening for emergency alerts
            </span>
          ) : (
            'Connecting...'
          )}
        </div>

        {/* Live messages */}
        {messages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-red-700">Active Alerts:</h3>
            {messages.map((msg, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 text-sm">{msg.title}</p>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{msg.message}</p>
                <p className="text-xs text-red-400 mt-2">
                  {new Date(msg.time * 1000).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by MediVault Emergency System
        </p>
      </div>
    </div>
  )
}
