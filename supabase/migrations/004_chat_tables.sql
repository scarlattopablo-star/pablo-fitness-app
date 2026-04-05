-- =============================================
-- Chat "Gym Bro" - Messaging System
-- =============================================

-- 1. Conversations (1:1 chats)
-- Convention: user1_id < user2_id (lexicographic) to prevent duplicates
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id),
  CONSTRAINT no_self_chat CHECK (user1_id <> user2_id)
);

CREATE INDEX idx_conv_user1 ON public.conversations(user1_id);
CREATE INDEX idx_conv_user2 ON public.conversations(user2_id);
CREATE INDEX idx_conv_last_msg ON public.conversations(last_message_at DESC);

-- 2. Messages
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  read_at TIMESTAMPTZ,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_msg_conv ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_msg_unread ON public.messages(conversation_id, sender_id) WHERE read_at IS NULL;

-- 3. Chat blocks (moderation)
CREATE TABLE public.chat_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reason TEXT,
  warnings_count INTEGER DEFAULT 0,
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_endpoint UNIQUE (endpoint)
);

CREATE INDEX idx_push_user ON public.push_subscriptions(user_id);

-- =============================================
-- Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- Trigger: update conversation on new message
-- =============================================
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 50)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- =============================================
-- RPC: unread message count
-- =============================================
CREATE OR REPLACE FUNCTION public.get_unread_count(uid UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE (c.user1_id = uid OR c.user2_id = uid)
    AND m.sender_id <> uid
    AND m.read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE POLICY "Users view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages
CREATE POLICY "Users view messages in own conversations" ON public.messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ));
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );
CREATE POLICY "Users mark messages as read" ON public.messages
  FOR UPDATE USING (
    sender_id <> auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Chat blocks
CREATE POLICY "Users view own block" ON public.chat_blocks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manage blocks" ON public.chat_blocks
  FOR ALL USING (public.is_admin());

-- Push subscriptions
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Allow authenticated users to search profiles by name
CREATE POLICY "Authenticated users can search profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
