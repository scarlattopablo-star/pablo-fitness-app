-- Onboarding post-pago: meta 7 dias + foto antes + checklist completion
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_goal_7d TEXT,
  ADD COLUMN IF NOT EXISTS welcome_goal_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Last weekly report sent (prevents double-sends)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_weekly_report_at TIMESTAMPTZ;
