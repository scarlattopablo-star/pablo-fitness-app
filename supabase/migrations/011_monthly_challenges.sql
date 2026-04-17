-- Monthly group challenges — one active challenge per month
-- Admin sets the challenge, users auto-enroll, leaderboard aggregates from weekly_rankings or exercise_logs

CREATE TABLE IF NOT EXISTS public.monthly_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL UNIQUE, -- first day of the month
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('sessions', 'xp', 'volume', 'streak')),
  target_value INTEGER NOT NULL DEFAULT 12, -- e.g. 12 sessions
  prize TEXT, -- e.g. "Sesion gratis 1a1 con Pablo"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read challenges
CREATE POLICY "Anyone can read challenges" ON public.monthly_challenges
  FOR SELECT USING (true);

-- Only admins manage them
CREATE POLICY "Admins manage challenges" ON public.monthly_challenges
  FOR ALL USING (public.is_admin());

-- Progress table: cached user progress for the current challenge
CREATE TABLE IF NOT EXISTS public.monthly_challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.monthly_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress_value INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.monthly_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress and top board" ON public.monthly_challenge_progress
  FOR SELECT USING (true);

CREATE POLICY "Service role manages progress" ON public.monthly_challenge_progress
  FOR ALL USING (true) WITH CHECK (true);

-- Seed a demo challenge for the current month (uncomment + customize)
-- INSERT INTO public.monthly_challenges (month, title, description, metric, target_value, prize)
-- VALUES (date_trunc('month', CURRENT_DATE)::date, '12 sesiones en el mes', 'Entrena 12 veces este mes y ganas un premio', 'sessions', 12, 'Sesion 1a1 GRATIS con Pablo')
-- ON CONFLICT (month) DO NOTHING;
