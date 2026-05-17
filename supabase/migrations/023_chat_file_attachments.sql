-- Migration 023: Chat file attachments
-- Adds file_url, file_type, file_name to messages table
-- Creates chat-media storage bucket

ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT; -- 'image' | 'file'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Storage bucket for chat media (public read, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_media_upload'
  ) THEN
    CREATE POLICY "chat_media_upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'chat-media');
  END IF;
END
$$;

-- Allow authenticated users to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_media_read'
  ) THEN
    CREATE POLICY "chat_media_read" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'chat-media');
  END IF;
END
$$;
