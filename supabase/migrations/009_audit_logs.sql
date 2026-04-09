CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
