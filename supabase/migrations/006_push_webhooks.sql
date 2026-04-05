-- Server-side push notifications via database triggers
-- Uses pg_net to call our webhook API on every new message

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger for private messages
CREATE OR REPLACE FUNCTION notify_push_on_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://pabloscarlattoentrenamientos.com/api/push/webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer push-webhook-secret-2024"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'record', jsonb_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'conversation_id', NEW.conversation_id,
        'content', NEW.content
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for general messages
CREATE OR REPLACE FUNCTION notify_push_on_general_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://pabloscarlattoentrenamientos.com/api/push/webhook',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer push-webhook-secret-2024"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'general_messages',
      'record', jsonb_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'content', NEW.content
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS push_on_message ON public.messages;
CREATE TRIGGER push_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_push_on_message();

DROP TRIGGER IF EXISTS push_on_general_message ON public.general_messages;
CREATE TRIGGER push_on_general_message
  AFTER INSERT ON public.general_messages
  FOR EACH ROW EXECUTE FUNCTION notify_push_on_general_message();
