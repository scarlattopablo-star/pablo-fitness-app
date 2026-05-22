# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Dev server on localhost:3000
npm run build        # Production build (includes TypeScript type checking)
npm run lint         # ESLint (flat config: eslint.config.mjs)
npx playwright test  # E2E tests (runs against production URL by default)
BASE_URL=http://localhost:3000 npx playwright test  # E2E against local
npm run cap:sync     # Sync Capacitor mobile builds
```

## Stack

- **Next.js 16.2.1** + **React 19** + **TypeScript 5** (strict mode)
- **Supabase** — auth, Postgres DB, realtime subscriptions, RLS, storage
- **Tailwind CSS v4** via `@tailwindcss/postcss` — no `tailwind.config`; design tokens live in `globals.css` using `@theme inline`
- **Capacitor 8** — iOS/Android native wrapper; points to remote URL (`pabloscarlattoentrenamientos.com`), not a local build
- **MercadoPago** — payment processing with webhook at `/api/mercadopago/webhook`
- **Resend** — transactional email
- **Anthropic SDK + OpenAI SDK** — AI features (chat bot, content generation, technique analysis, coach nudges)
- **Remotion** — programmatic video generation
- **Playwright** — E2E tests in `tests/`, chromium only, defaults to production URL

## Architecture

### Next.js 16 Breaking Changes
This is Next.js 16, not 15. Page `params` are `Promise<{}>` and must be unwrapped with `use(params)`. The `middleware.ts` convention is deprecated in favor of `proxy`. Check `node_modules/next/dist/docs/` before using any Next.js API you're unsure about.

### Providers & Root Layout
`src/app/layout.tsx` wraps everything in `<Providers>` (`src/app/providers.tsx`): `ErrorBoundary > I18nProvider > AuthProvider > VisitTracker`. Providers delay rendering until client mounts to avoid hydration mismatches in in-app browsers. Fonts: Inter (body, `--font-inter`) + Outfit (headings, `--font-outfit`) via `next/font/google`.

### Auth & Roles
- `src/lib/auth-context.tsx` — React context providing `user`, `profile`, `subscription`, `isExpired`, `hasActiveSubscription`, `isTrial`, `trialDaysLeft`, `isDirectClient`
- Two roles: `profiles.is_admin = true` (admin/trainer) vs `false` (client)
- Admin API routes verify admin via Bearer token → `supabase.auth.getUser()` → check `profiles.is_admin`
- Admin routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Database uses `is_admin()` SQL function for RLS policies (avoids infinite recursion)
- Admin 2FA: `admin/layout.tsx` checks `localStorage("admin-2fa-verified")` within 24h, redirects to `/admin/verify` → `/api/admin/verify-2fa` against `ADMIN_2FA_PIN` env var

### Supabase Client Patterns
- **Browser**: singleton from `src/lib/supabase.ts` using anon key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) with memory fallback for SSR/in-app browsers
- **API routes**: inline `createClient()` with `SUPABASE_SERVICE_ROLE_KEY` per request — no shared server helper. Copy the pattern from any existing admin route.

### Route Structure
- `/src/app/dashboard/*` — Client-facing app (requires auth + active subscription)
- `/src/app/admin/*` — Admin panel (requires `is_admin`, protected by 2FA in `admin/layout.tsx`)
- `/src/app/api/*` — Server routes; admin endpoints under `/api/admin/*`
- `/src/app/api/cron/*` — Scheduled jobs (`weekly-report`, `coach-ai-nudge`)
- `/src/app/api/push/*` — Push notification endpoints (`subscribe`, `send`, `send-general`, `motivational`, `achievement`, `webhook`)
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
- Recipes: `src/lib/recipes-database.ts` — must only use foods from the plan, no extra ingredients (spices/condiments allowed)

### Plan Generation (AI)
- `src/lib/generate-training-plan.ts` — Evidence-based (ACSM/NSCA), targets 2x/week per muscle group, supports methods: superset, giant-set, drop-set, pyramid, rest-pause, cluster
- `src/lib/generate-meal-plan.ts` — Uses Harris-Benedict TDEE from `src/lib/harris-benedict.ts`, handles dietary restrictions (vegan, gluten-free, diabetic, etc.)
- Plans are generated client-side OR server-side via `/api/generate-plans`

### Gamification
- XP events tracked in `gamification_events` table
- Achievements, streaks, weekly challenges in `src/lib/gamification.ts` and `src/lib/weekly-challenges.ts`
- Leaderboard API at `/api/gamification/leaderboard`
- In-app toasts via `AchievementToast` component in dashboard layout

### Realtime
- Dashboard layout subscribes to `messages` and `general_messages` tables via `supabase.channel()` for in-app chat notification toasts
- `PresenceProvider` (`src/hooks/use-presence.tsx`) wraps dashboard content for online status tracking

### Key Patterns
- All client pages use `"use client"` and `useAuth()` hook for session
- Admin API pattern: parse Bearer token → `getUser()` → check `is_admin` → use `createClient()` with service role key
- Offline-first: `src/lib/offline-cache.ts` caches plans/surveys in localStorage
- Push notifications: VAPID web-push + `pg_net` webhook from Supabase for server-side triggers
- Path alias: `@/*` maps to `./src/*`
- PWA: service worker registered in root layout, manifest at `/manifest.json`, install prompt handled in both layout files

### CSS & Design System
Tailwind v4 with custom design tokens in `src/app/globals.css`. Dark theme only (background `#09090b`). Key custom classes to reuse instead of reinventing:
- `glass-card` — frosted glass card with backdrop blur
- `card-premium` — solid card with hover lift + green glow
- `gradient-primary`, `gradient-gold`, `gradient-dark` — brand gradients
- `text-gradient` — green gradient text via background-clip
- `btn-shimmer` — animated gradient CTA button
- `btn-outline-premium` — ghost button with hover border
- `badge-gold`, `badge-primary` — pill badges
- `line-accent` — decorative horizontal divider
- `stat-glow`, `hover-glow` — green shadow effects

Tailwind theme colors: `primary`, `primary-dark`, `primary-light`, `card-bg`, `card-border`, `muted`, `danger`, `warning`, `accent` (gold).

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase (bypasses RLS)
- `ANTHROPIC_API_KEY` — AI features (chat bot, content gen, technique analysis)
- `RESEND_API_KEY` — transactional email
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` — web push
- `ADMIN_2FA_PIN` — admin panel 2FA code

Optional:
- `NEXT_PUBLIC_FB_PIXEL_ID` — Facebook pixel tracking
- `NEXT_PUBLIC_SITE_URL` — canonical site URL (defaults to production domain)

## Database

Schema defined in `supabase/schema.sql`, migrations in `supabase/migrations/`. Key tables:
- `profiles`, `surveys`, `subscriptions`, `plans` — user & billing
- `training_plans`, `nutrition_plans` — JSONB plan storage
- `exercise_logs`, `progress_entries` — client tracking data
- `exercises`, `exercise_categories` — exercise library
- `chat_messages`, `messages`, `general_messages` — coach-client and group messaging
- `gamification_events` — XP/achievement tracking
- `push_subscriptions` — VAPID push subscription storage
- `free_access_codes`, `referrals`, `payments`, `page_visits`

All tables have RLS enabled. Admin access uses `is_admin()` function.

## Language

The app and all UI text is in **Spanish**. User communication must always be in Spanish. The codebase supports i18n via `src/lib/i18n.tsx` but Spanish is primary.
