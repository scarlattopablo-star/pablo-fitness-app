-- Fix: Allow users to insert their own subscription (needed for cliente-directo and acceso-gratis flows)
-- Previously only admin could insert subscriptions, but the client-side signup flow needs to create one.

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
