-- Migration: Add nutritional_goal column to surveys table
-- This allows plans without inherent nutritional objectives (entrenamiento-casa, post-parto, etc.)
-- to store the client's chosen goal (deficit/surplus/maintenance)

ALTER TABLE public.surveys
ADD COLUMN IF NOT EXISTS nutritional_goal TEXT
CHECK (nutritional_goal IN ('perder-grasa', 'ganar-musculo', 'mantenimiento'));
