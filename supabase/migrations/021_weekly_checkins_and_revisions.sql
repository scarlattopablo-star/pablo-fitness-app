-- Nutrition v2 — F5: check-ins semanales + plan revisions
--
-- weekly_checkins: cada 7 dias el cliente sube peso/medidas/fotos/sensaciones.
-- plan_revisions: el sistema sugiere ajustes (kcal/cardio/macros) a partir
-- del check-in. Pablo (admin) los aprueba antes de aplicar al cliente.

CREATE TABLE IF NOT EXISTS public.weekly_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,                    -- semanas desde el inicio del plan
  weight          NUMERIC(5,2),
  measurements    JSONB,                                -- {chest,waist,hips,arms,legs}
  photos          JSONB,                                -- {front,side,back} (URLs)
  energy          SMALLINT CHECK (energy IS NULL OR energy BETWEEN 1 AND 5),
  hunger          SMALLINT CHECK (hunger IS NULL OR hunger BETWEEN 1 AND 5),
  performance     SMALLINT CHECK (performance IS NULL OR performance BETWEEN 1 AND 5),
  adherence_pct   SMALLINT CHECK (adherence_pct IS NULL OR adherence_pct BETWEEN 0 AND 100),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user ON public.weekly_checkins(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.plan_revisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_id      UUID REFERENCES public.weekly_checkins(id) ON DELETE SET NULL,
  triggered_by    TEXT NOT NULL CHECK (triggered_by IN ('weekly-checkin','manual','milestone')),
  delta           JSONB NOT NULL,                      -- {calories: -100, cardio: +1, macros: {...}, reason: '...'}
  rationale       TEXT,                                -- texto humano explicando por que se sugiere
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','applied')),
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_revisions_user_status ON public.plan_revisions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_revisions_status ON public.plan_revisions(status, created_at DESC);

-- RLS
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own checkins" ON public.weekly_checkins;
DROP POLICY IF EXISTS "Admin can view all checkins" ON public.weekly_checkins;
CREATE POLICY "Users can manage own checkins" ON public.weekly_checkins
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all checkins" ON public.weekly_checkins
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own revisions" ON public.plan_revisions;
DROP POLICY IF EXISTS "Admin can manage revisions" ON public.plan_revisions;
CREATE POLICY "Users can view own revisions" ON public.plan_revisions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage revisions" ON public.plan_revisions
  FOR ALL USING (public.is_admin());
