-- Migration: Referral system
-- Each user gets a unique referral_code. When a friend signs up using it,
-- the referrer gets +7 days on their subscription and the friend gets 15% off.

-- 1. Add referral_code column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 2. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_applied BOOLEAN DEFAULT FALSE,
  days_rewarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 4. RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer)
CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Service role inserts (via API routes)
CREATE POLICY "Service can manage referrals" ON public.referrals
  FOR ALL USING (public.is_admin());

-- Allow inserts from authenticated users (for tracking)
CREATE POLICY "Auth users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Auto-generate referral codes for existing users who don't have one
-- Format: FIRST_NAME-XXXX (4 random alphanumeric chars)
UPDATE public.profiles
SET referral_code = UPPER(
  SUBSTRING(REGEXP_REPLACE(COALESCE(full_name, 'USER'), '[^a-zA-Z]', '', 'g') FROM 1 FOR 5)
  || '-'
  || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
)
WHERE referral_code IS NULL;

-- 6. Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(
      SUBSTRING(REGEXP_REPLACE(COALESCE(NEW.full_name, 'USER'), '[^a-zA-Z]', '', 'g') FROM 1 FOR 5)
      || '-'
      || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-generate on profile insert
DROP TRIGGER IF EXISTS auto_referral_code ON public.profiles;
CREATE TRIGGER auto_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();
