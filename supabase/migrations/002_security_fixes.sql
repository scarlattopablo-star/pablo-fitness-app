-- Security fixes: run in Supabase SQL Editor

-- 1. Fix RLS: only admin can update free_access_codes
DROP POLICY IF EXISTS "Anyone can update codes" ON public.free_access_codes;
CREATE POLICY "Only admin can update codes" ON public.free_access_codes
  FOR UPDATE USING (public.is_admin());

-- 2. Prevent multiple active subscriptions per user
-- (check if constraint already exists before creating)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'one_active_sub_per_user'
  ) THEN
    CREATE UNIQUE INDEX one_active_sub_per_user ON public.subscriptions (user_id)
      WHERE status = 'active';
  END IF;
END $$;

-- 3. Auto-expire subscriptions daily (optional: requires pg_cron extension)
-- If pg_cron is enabled:
-- SELECT cron.schedule('expire-subscriptions', '0 3 * * *',
--   $$UPDATE public.subscriptions SET status = 'expired' WHERE status = 'active' AND end_date < CURRENT_DATE$$
-- );
