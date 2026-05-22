-- Plan version history: snapshots of training/nutrition plans before each edit
CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('training', 'nutrition')),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  data JSONB NOT NULL,
  important_notes JSONB,
  saved_by UUID REFERENCES public.profiles(id),
  version_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can read version history
CREATE POLICY "Admins can read plan versions" ON public.plan_versions
  FOR SELECT USING (public.is_admin());

-- Service role inserts versions (from save-plan API)
CREATE POLICY "Service role can insert plan versions" ON public.plan_versions
  FOR INSERT WITH CHECK (true);

-- Indexes for fast lookups
CREATE INDEX idx_plan_versions_plan ON public.plan_versions(plan_id, created_at DESC);
CREATE INDEX idx_plan_versions_user ON public.plan_versions(user_id, plan_type, created_at DESC);
