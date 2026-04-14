'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface GuideStep {
  title: string
  description: string
  warning?: string
}

interface Guide {
  id: string
  title: string
  category: string
  emoji: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  steps: GuideStep[]
}

const guides: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    category: 'Cardiac',
    emoji: '❤️',
    severity: 'critical',
    description: 'Perform CPR on an unresponsive adult who is not breathing normally.',
    steps: [
      { title: 'Call 911', description: 'Call emergency services immediately or ask someone nearby to call.' },
      { title: 'Check Responsiveness', description: 'Tap shoulders firmly and shout "Are you okay?" Check for breathing (no more than 10 seconds).' },
      { title: 'Position the Person', description: 'Lay them on their back on a firm, flat surface. Kneel beside them.' },
      { title: 'Open the Airway', description: 'Tilt head back gently, lift chin to open the airway.' },
      { title: 'Chest Compressions', description: 'Place hands on center of chest. Compress at least 2 inches deep, 100-120 times per minute. Allow full chest recoil between compressions.', warning: 'Push hard and fast — it\'s okay if ribs crack.' },
      { title: 'Rescue Breaths (if trained)', description: 'Give 2 rescue breaths after every 30 compressions. Pinch nose, create seal, breathe for 1 second each.' },
      { title: 'Continue Until Help Arrives', description: 'Keep going until emergency services arrive, the person revives, or you are too exhausted to continue.' },
    ],
  },
  {
    id: 'choking',
    title: 'Choking — Heimlich Maneuver',
    category: 'Airway',
    emoji: '🫁',
    severity: 'critical',
    description: 'For a conscious adult or child (over 1 year) who is choking.',
    steps: [
      { title: 'Identify Choking', description: 'Look for: cannot cough, speak, or breathe; grasping throat; bluish skin.' },
      { title: 'Encourage Coughing', description: 'If they can cough, encourage them to keep coughing. Only intervene if coughing stops or becomes ineffective.' },
      { title: 'Give 5 Back Blows', description: 'Lean them forward, give 5 firm blows between shoulder blades with the heel of your hand.' },
      { title: 'Heimlich Maneuver', description: 'Stand behind them, wrap arms around waist. Make a fist above navel, below ribs. Cover fist with other hand. Give 5 firm upward thrusts.', warning: 'Do not perform on infants under 1 year.' },
      { title: 'Alternate Back Blows & Thrusts', description: 'Alternate between 5 back blows and 5 abdominal thrusts until object is expelled or person loses consciousness.' },
      { title: 'If Unconscious', description: 'Lower to ground, call 911, begin CPR. With each breath attempt, check mouth for visible object.' },
    ],
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    category: 'Trauma',
    emoji: '🩹',
    severity: 'high',
    description: 'Control severe bleeding from a wound.',
    steps: [
      { title: 'Protect Yourself', description: 'Use gloves or a plastic bag to protect from bloodborne pathogens if available.' },
      { title: 'Apply Direct Pressure', description: 'Press firmly on the wound with a clean cloth, gauze, or clothing. Do not remove — add more material on top if soaked.' },
      { title: 'Elevate the Limb', description: 'If possible, raise the injured area above heart level to slow bleeding.' },
      { title: 'Apply a Tourniquet (limbs only)', description: 'If bleeding is life-threatening and on an arm or leg: apply 2-3 inches above wound. Tighten until bleeding stops. Note the time.', warning: 'Tourniquet causes pain and may damage tissue — only use for life-threatening bleeding.' },
      { title: 'Keep Person Warm', description: 'Cover with blankets to prevent shock. Keep them lying down with legs elevated if no head/spine injury.' },
      { title: 'Call 911', description: 'Severe bleeding is a medical emergency. Call immediately.' },
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke — FAST Recognition',
    category: 'Neurological',
    emoji: '🧠',
    severity: 'critical',
    description: 'Recognize and respond to a stroke using the FAST method.',
    steps: [
      { title: 'F — Face Drooping', description: 'Ask the person to smile. Is one side of the face drooping or numb?' },
      { title: 'A — Arm Weakness', description: 'Ask them to raise both arms. Does one arm drift downward or feel weak?' },
      { title: 'S — Speech Difficulty', description: 'Ask them to repeat a simple phrase. Is speech slurred, strange, or impossible?' },
      { title: 'T — Time to Call 911', description: 'If ANY of these signs are present, call 911 IMMEDIATELY. Note the time symptoms started.', warning: 'Every minute counts — "time is brain." Do not wait to see if symptoms improve.' },
      { title: 'While Waiting', description: 'Keep them calm and still. Do not give food, water, or medication. Loosen tight clothing. Do not leave them alone.' },
    ],
  },
  {
    id: 'burns',
    title: 'Burns Treatment',
    category: 'Trauma',
    emoji: '🔥',
    severity: 'medium',
    description: 'Treat minor to moderate burns correctly.',
    steps: [
      { title: 'Remove from Source', description: 'Stop the burning: remove from heat, extinguish flames (stop drop roll), remove hot clothing/jewelry near burn — not stuck to skin.' },
      { title: 'Cool the Burn', description: 'Run cool (not cold/ice) water over the burn for 10-20 minutes. This reduces pain and limits damage.', warning: 'Never use ice, butter, toothpaste, or any creams on fresh burns.' },
      { title: 'Cover the Burn', description: 'Loosely cover with a clean non-fluffy material (cling film works well). Do not use fluffy bandages or burst blisters.' },
      { title: 'Seek Medical Help', description: 'Go to A&E for: burns larger than palm, burns on face/hands/genitals/feet, chemical/electrical burns, burns in children or elderly.' },
      { title: 'Manage Pain', description: 'Over-the-counter pain relievers (ibuprofen, acetaminophen) can help for minor burns.' },
    ],
  },
  {
    id: 'fracture',
    title: 'Suspected Fracture / Broken Bone',
    category: 'Trauma',
    emoji: '🦴',
    severity: 'medium',
    description: 'Manage a suspected broken bone before medical help arrives.',
    steps: [
      { title: 'Do Not Move', description: 'Keep the injured person as still as possible. Do not try to straighten the bone.' },
      { title: 'Immobilize the Injury', description: 'Splint the fracture using padding and something rigid (board, rolled magazine). Extend splint beyond joints above and below fracture.' },
      { title: 'Control Bleeding', description: 'If there is an open wound, apply gentle pressure around (not directly on) the bone with clean dressing.' },
      { title: 'Apply Ice Pack', description: 'Apply ice wrapped in cloth to reduce swelling. Never apply ice directly to skin.', warning: 'Do not apply ice to open wounds.' },
      { title: 'Treat for Shock', description: 'If they look pale and feel faint, keep warm, lie flat with legs raised (unless leg is injured).' },
      { title: 'Seek Medical Attention', description: 'All suspected fractures need X-ray and medical evaluation. Call 911 for severe/spinal injuries.' },
    ],
  },
  {
    id: 'allergic',
    title: 'Severe Allergic Reaction (Anaphylaxis)',
    category: 'Allergy',
    emoji: '⚠️',
    severity: 'critical',
    description: 'Respond to a life-threatening allergic reaction.',
    steps: [
      { title: 'Call 911 Immediately', description: 'Anaphylaxis is life-threatening. Call emergency services at once.' },
      { title: 'Use Epinephrine (EpiPen)', description: 'If the person has an auto-injector (EpiPen), use it immediately in the outer thigh. Can be given through clothing.', warning: 'A second dose may be given 5-15 minutes later if available and symptoms persist.' },
      { title: 'Lay Them Down', description: 'Have them lie flat with legs raised. If breathing is difficult, let them sit up. If unconscious and not breathing, prepare for CPR.' },
      { title: 'Monitor Breathing', description: 'Watch for worsening symptoms: throat swelling, difficulty breathing, loss of consciousness.' },
      { title: 'Stay Until Help Arrives', description: 'Do not leave them alone. Be prepared to perform CPR if they stop breathing.' },
    ],
  },
  {
    id: 'diabetic',
    title: 'Diabetic Emergency (Hypoglycemia)',
    category: 'Medical',
    emoji: '🍬',
    severity: 'high',
    description: 'Help someone experiencing low blood sugar.',
    steps: [
      { title: 'Recognize the Signs', description: 'Look for: confusion, shakiness, sweating, pale skin, weakness, headache, rapid heartbeat.' },
      { title: 'Give Fast-Acting Sugar', description: 'If conscious and able to swallow: give 15-20g of fast sugar. Options: 4 glucose tablets, 4oz juice, 4oz regular soda (not diet), or hard candies.', warning: 'Only give sugar if they are conscious and can swallow safely.' },
      { title: 'Wait 15 Minutes', description: 'Have them rest and recheck symptoms after 15 minutes. If not improving, repeat sugar and call 911.' },
      { title: 'Give Follow-up Snack', description: 'Once improved, give a snack with protein and carbs (crackers and peanut butter) to stabilize blood sugar.' },
      { title: 'If Unconscious', description: 'Call 911 immediately. Do not give anything by mouth. Place in recovery position.' },
    ],
  },
]

const categories = ['All', ...Array.from(new Set(guides.map(g => g.category)))]
const severityConfig = {
  critical: { label: 'Critical', variant: 'red' as const },
  high: { label: 'High', variant: 'amber' as const },
  medium: { label: 'Medium', variant: 'blue' as const },
  low: { label: 'Low', variant: 'green' as const },
}

export default function GuidesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || g.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">First Aid Guides</h1>
        <p className="text-gray-600 mt-1">Step-by-step instructions for emergencies</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search guides..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(guide => {
          const isOpen = expanded === guide.id
          const sev = severityConfig[guide.severity]

          return (
            <Card key={guide.id} className="overflow-hidden p-0">
              <button
                onClick={() => setExpanded(isOpen ? null : guide.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{guide.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{guide.title}</p>
                    <Badge variant={sev.variant}>{sev.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{guide.description}</p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-5">
                  <div className="space-y-3 mt-4">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                          {step.warning && (
                            <div className="mt-1.5 flex items-start gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <span className="text-amber-600 text-xs">⚠️</span>
                              <p className="text-xs text-amber-700">{step.warning}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No guides found for &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
