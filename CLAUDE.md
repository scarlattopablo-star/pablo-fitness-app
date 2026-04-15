# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build (includes TypeScript type checking)
npm run lint         # ESLint
npx playwright test  # E2E tests (runs against production URL by default)
BASE_URL=http://localhost:3000 npx playwright test  # E2E against local
npm run cap:sync     # Sync Capacitor mobile builds
```

## Stack

- **Next.js 16.2.1** + **React 19** + **TypeScript 5** (strict mode)
- **Supabase** — auth, Postgres DB, realtime subscriptions, RLS, storage
- **Tailwind CSS v4** via PostCSS (not a tailwind.config file — configured in `postcss.config.mjs`)
- **Capacitor 8** — iOS/Android native wrapper (PWA-first)
- **MercadoPago** — payment processing with webhook confirmation
- **Resend + Nodemailer** — transactional email
- **Remotion** — programmatic video generation
- **Playwright** — E2E tests in `tests/`

## Architecture

### Next.js 16 Breaking Changes
This is Next.js 16, not 15. Page `params` are `Promise<{}>` and must be unwrapped with `use(params)`. The `middleware.ts` convention is deprecated in favor of `proxy`. Check `node_modules/next/dist/docs/` before using any Next.js API you're unsure about.

### Auth & Roles
- `src/lib/auth-context.tsx` — React context providing `user`, `profile`, `subscription`, `isExpired`, `hasActiveSubscription`
- Two roles: `profiles.is_admin = true` (admin/trainer) vs `false` (client)
- Admin API routes verify admin via Bearer token → `supabase.auth.getUser()` → check `profiles.is_admin`
- Admin routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Database uses `is_admin()` SQL function for RLS policies (avoids infinite recursion)

### Route Structure
- `/src/app/dashboard/*` — Client-facing app (requires auth + active subscription)
- `/src/app/admin/*` — Admin panel (requires `is_admin`, protected by 2FA in `admin/layout.tsx`)
- `/src/app/api/*` — Server routes; admin endpoints live under `/api/admin/*`
- `/src/app/planes/[slug]` — Public plan pages with MercadoPago checkout

### Data Flow: Training Plans
1. Admin creates/edits plan in `/admin/clientes/[id]/plan-editor` → `POST /api/save-plan`
2. Stored as JSONB in `training_plans.data` with shape `{ days: [{ day, exercises: [{ exerciseId, name, sets, reps, rest, notes }], instructions }] }`
3. Client loads plan in `/dashboard/plan` via direct Supabase query
4. Client (or admin via `/admin/clientes/[id]/entrenar`) starts a session, logs weights/reps per set
5. Saved to `exercise_logs` table with `{ user_id, exercise_id, exercise_name, sets_data: [{set, weight, reps}] }`
6. Plan updates trigger realtime notifications via Supabase channel subscriptions

### Data Flow: Nutrition Plans
- Stored as JSONB in `nutrition_plans.data` with shape `{ meals: [{ name, time, foods[], foodDetails[], approxCalories, approxProtein, approxCarbs, approxFats }] }`
- Kitesurf plan variant: `{ gymDay: { meals, importantNotes }, kitesurfDay: { meals, importantNotes } }`
- Food swap system in `src/lib/food-database.ts` matches by macros for substitutions

### Plan Generation (AI)
- `src/lib/generate-training-plan.ts` — Evidence-based (ACSM/NSCA), targets 2x/week per muscle group, supports methods: superset, giant-set, drop-set, pyramid, rest-pause, cluster
- `src/lib/generate-meal-plan.ts` — Uses Harris-Benedict TDEE from `src/lib/harris-benedict.ts`, handles dietary restrictions (vegan, gluten-free, diabetic, etc.)
- Plans are generated client-side OR server-side via `/api/generate-plans`

### Gamification
- XP events tracked in `gamification_events` table
- Achievements, streaks, weekly challenges in `src/lib/gamification.ts` and `src/lib/weekly-challenges.ts`
- Leaderboard API at `/api/gamification/leaderboard`

### Key Patterns
- All client pages use `"use client"` and `useAuth()` hook for session
- Admin API pattern: parse Bearer token → `getUser()` → check `is_admin` → use `createClient()` with service role key
- Offline-first: `src/lib/offline-cache.ts` caches plans/surveys in localStorage
- Push notifications: VAPID web-push + `pg_net` webhook from Supabase for server-side triggers
- Path alias: `@/*` maps to `./src/*`

## Database

Schema defined in `supabase/schema.sql`, migrations in `supabase/migrations/`. Key tables:
- `profiles`, `surveys`, `subscriptions`, `plans` — user & billing
- `training_plans`, `nutrition_plans` — JSONB plan storage
- `exercise_logs`, `progress_entries` — client tracking data
- `exercises`, `exercise_categories` — exercise library
- `chat_messages` — coach-client messaging
- `gamification_events` — XP/achievement tracking
- `free_access_codes`, `referrals`, `payments`, `page_visits`

All tables have RLS enabled. Admin access uses `is_admin()` function.

## Language

The app and all UI text is in **Spanish**. User communication must always be in Spanish. The codebase supports i18n via `src/lib/i18n.tsx` but Spanish is primary.
