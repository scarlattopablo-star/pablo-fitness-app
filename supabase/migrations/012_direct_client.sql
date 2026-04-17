-- Migration 012: Add plan_slug to subscriptions + allow 'custom' duration
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add plan_slug column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_slug TEXT;

-- 2. Drop old duration check constraint
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_duration_check;

-- 3. Add new duration check that includes 'custom'
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_duration_check
  CHECK (duration IN ('1-mes', '3-meses', '6-meses', '1-ano', 'custom'));
