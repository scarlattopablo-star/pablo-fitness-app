-- =============================================
-- GAMIFICATION: Streaks, XP, Achievements, Rankings
-- =============================================

-- User XP and level tracking
CREATE TABLE IF NOT EXISTS public.user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Novato',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak tracking (consecutive training days)
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY, -- e.g. 'first-session', 'streak-7'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji
  xp_reward INTEGER DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('training', 'nutrition', 'streak', 'social', 'milestone')),
  sort_order INTEGER DEFAULT 0
);

-- User earned achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES public.achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Weekly ranking snapshots
CREATE TABLE IF NOT EXISTS public.weekly_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- RLS Policies
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

-- Everyone can read achievements list
CREATE POLICY "Anyone can read achievements" ON public.achievements FOR SELECT USING (true);

-- Users can read their own data
CREATE POLICY "Users read own xp" ON public.user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read all rankings" ON public.weekly_rankings FOR SELECT USING (true);

-- Service role can do everything (APIs use service role)
CREATE POLICY "Service role manages xp" ON public.user_xp FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages streaks" ON public.user_streaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages user_achievements" ON public.user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages rankings" ON public.weekly_rankings FOR ALL USING (true) WITH CHECK (true);

-- Seed achievement definitions
INSERT INTO public.achievements (id, name, description, icon, xp_reward, category, sort_order) VALUES
  -- Training
  ('first-session', 'Primera Sesion', 'Completa tu primera sesion de entrenamiento', '🏋️', 50, 'training', 1),
  ('sessions-5', '5 Sesiones', 'Completa 5 sesiones de entrenamiento', '💪', 100, 'training', 2),
  ('sessions-10', '10 Sesiones', 'Completa 10 sesiones de entrenamiento', '🔥', 200, 'training', 3),
  ('sessions-25', '25 Sesiones', 'Completa 25 sesiones de entrenamiento', '⚡', 500, 'training', 4),
  ('sessions-50', '50 Sesiones', 'Completa 50 sesiones de entrenamiento', '🏆', 1000, 'training', 5),
  ('sessions-100', 'Centurion', 'Completa 100 sesiones de entrenamiento', '👑', 2000, 'training', 6),
  ('personal-record', 'Marca Personal', 'Supera tu mejor peso en un ejercicio', '📈', 75, 'training', 7),
  -- Streaks
  ('streak-3', '3 Dias Seguidos', 'Entrena 3 dias consecutivos', '🔥', 50, 'streak', 10),
  ('streak-7', 'Semana Perfecta', 'Entrena 7 dias consecutivos', '⭐', 150, 'streak', 11),
  ('streak-14', '2 Semanas Imparable', 'Entrena 14 dias consecutivos', '💎', 300, 'streak', 12),
  ('streak-30', 'Mes de Hierro', 'Entrena 30 dias consecutivos', '🏅', 750, 'streak', 13),
  -- Nutrition
  ('first-swap', 'Chef Creativo', 'Cambia un alimento en tu plan', '🍳', 25, 'nutrition', 20),
  -- Social
  ('first-chat', 'Social', 'Envia tu primer mensaje en el chat', '💬', 25, 'social', 30),
  ('referral', 'Embajador', 'Invita a un amigo que se registre', '🤝', 200, 'social', 31),
  -- Milestones
  ('first-progress', 'Primer Control', 'Sube tu primera foto de progreso', '📸', 50, 'milestone', 40),
  ('weight-lost-5', '-5kg', 'Pierde 5kg desde tu peso inicial', '🎯', 300, 'milestone', 41),
  ('weight-lost-10', '-10kg', 'Pierde 10kg desde tu peso inicial', '🌟', 750, 'milestone', 42)
ON CONFLICT (id) DO NOTHING;
