-- UPC Cache Table — Shared across Smart Kitchen, Smart Money, Smart Cellar
-- Run this in the Supabase SQL Editor at supabase.com/dashboard
-- Project: wnlqvmedocpgjawmwivd

CREATE TABLE IF NOT EXISTS public.upc_cache (
  upc           text PRIMARY KEY,
  name          text,
  brand         text,
  size          text,
  category      text,
  image_url     text,
  nutrition     jsonb DEFAULT '{}'::jsonb,
  ingredients   text,
  cached_at     timestamptz DEFAULT now(),
  last_refreshed timestamptz DEFAULT now()
);

-- No RLS — this is a shared read/write cache for all authenticated users
-- Any user can read or write UPC data (it's generic product data, not personal)
ALTER TABLE public.upc_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can read UPC cache"
  ON public.upc_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Any authenticated user can insert UPC cache"
  ON public.upc_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any authenticated user can update UPC cache"
  ON public.upc_cache FOR UPDATE
  TO authenticated
  USING (true);

GRANT ALL ON public.upc_cache TO authenticated;
GRANT ALL ON public.upc_cache TO service_role;
