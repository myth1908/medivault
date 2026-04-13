# MediVault — Emergency Medical Platform

A complete medical emergency platform built with Next.js, Supabase, and deployed on Vercel.

## Features

- 🆘 **One-Tap SOS** — Instant emergency alerts with GPS location
- ❤️ **Medical Profile** — Blood type, allergies, medications, conditions
- 📞 **Emergency Contacts** — Manage and notify contacts in emergencies
- 🏥 **Hospital Finder** — Real-time nearby hospitals via OpenStreetMap
- 📖 **First Aid Guides** — 8+ step-by-step emergency guides (CPR, Heimlich, etc.)
- 🔐 **Secure Auth** — Supabase Auth with Row Level Security
- 🛠 **Admin Dashboard** — Full admin panel with role-based access control, incident management, user management, and audit log
- 👑 **Superadmin** — Highest privilege level; manages roles for all other users

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
2. Run **all** SQL migrations in order in the Supabase SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_admin_roles.sql`
3. Copy your project URL, anon key, and service role key

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

Run the migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — core tables
2. `supabase/migrations/002_admin_roles.sql` — admin role system

This creates:

- `medical_profiles` — User health data
- `emergency_contacts` — Emergency contact list
- `emergency_incidents` — SOS alert history
- `user_roles` — Role assignments (user / responder / admin / superadmin)
- `admin_audit_log` — Audit trail for all admin actions

All tables use Row Level Security (RLS). Admin and superadmin users bypass RLS via server-side service-role queries.

## Admin Panel

The admin panel lives at `/admin`. Access requires at least `admin` role.

### Role Hierarchy

| Role | Permissions |
|------|-------------|
| `user` | Standard access |
| `responder` | Emergency responder |
| `admin` | Full admin panel: overview, incidents, users, audit log |
| `superadmin` | Everything above + role management for all users |

### Bootstrapping the First Superadmin

**Option A — Web UI (recommended):**
1. Sign up / log in to the app
2. Visit `/setup`
3. Click "Claim Superadmin Role"
4. This page disappears once a superadmin exists

**Option B — Supabase SQL Editor:**
```sql
SELECT promote_to_superadmin('your-email@example.com');
```
(The `promote_to_superadmin` function is created by migration `002_admin_roles.sql`)

### Default Admin Credentials

There is no hardcoded admin account. Create one via the `/setup` page after running the migrations.

## Deployment

The app is deployed on Vercel and connected to this GitHub repo. Push to `main` to auto-deploy.

Make sure to add all environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for admin panel)
