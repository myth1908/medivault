# MediVault — Emergency Medical Platform

A complete medical emergency platform built with Next.js, Supabase, and deployed on Vercel.

## Features

- 🆘 **One-Tap SOS** — Instant emergency alerts with GPS location
- ❤️ **Medical Profile** — Blood type, allergies, medications, conditions
- 📞 **Emergency Contacts** — Manage and notify contacts in emergencies
- 🏥 **Hospital Finder** — Real-time nearby hospitals via OpenStreetMap
- 📖 **First Aid Guides** — 8+ step-by-step emergency guides (CPR, Heimlich, etc.)
- 🔐 **Secure Auth** — Supabase Auth with Row Level Security
- 🛠 **Admin Dashboard** — Monitor incidents and users

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel
- **Maps**: OpenStreetMap / Nominatim (free, no API key needed)

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/myth1908/medivault
cd medivault
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy your project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor. This creates:

- `medical_profiles` — User health data
- `emergency_contacts` — Emergency contact list
- `emergency_incidents` — SOS alert history

All tables use Row Level Security (RLS) so users only access their own data.

## Deployment

The app is deployed on Vercel and connected to this GitHub repo. Push to `main` to auto-deploy.

Make sure to add all environment variables in the Vercel dashboard.
