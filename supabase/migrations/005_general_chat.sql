-- General chat messages (group chat for all users)
CREATE TABLE public.general_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_general_msg_date ON public.general_messages(created_at DESC);

ALTER TABLE public.general_messages ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_messages;

-- Any authenticated user can read and write
CREATE POLICY "Auth users read general" ON public.general_messages
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users write general" ON public.general_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
