-- Smart Kitchen cloud sync table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory jsonb DEFAULT '[]'::jsonb,
  family_profiles jsonb DEFAULT '[]'::jsonb,
  family_size int DEFAULT 2,
  meal_plan jsonb DEFAULT '[]'::jsonb,
  family_recipes jsonb DEFAULT '[]'::jsonb,
  recipe_ratings jsonb DEFAULT '{}'::jsonb,
  dessert_ratings jsonb DEFAULT '{}'::jsonb,
  made_it_history jsonb DEFAULT '[]'::jsonb,
  change_meal_history jsonb DEFAULT '[]'::jsonb,
  leftover_history jsonb DEFAULT '[]'::jsonb,
  shopping_list jsonb DEFAULT '[]'::jsonb,
  recipes jsonb DEFAULT '[]'::jsonb,
  desserts jsonb DEFAULT '[]'::jsonb,
  sports_nights jsonb DEFAULT '[]'::jsonb,
  restock_queue jsonb DEFAULT '[]'::jsonb,
  sale_items jsonb DEFAULT '[]'::jsonb,
  yield_history jsonb DEFAULT '[]'::jsonb,
  recipe_site text DEFAULT 'google',
  shop_partner_name text DEFAULT '',
  shop_partner_email text DEFAULT '',
  senior_mode boolean DEFAULT false,
  dark_mode boolean DEFAULT false,
  setup_done boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security — users can only access their own data
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON public.user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON public.user_data FOR DELETE
  USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.user_data TO authenticated;
GRANT ALL ON public.user_data TO service_role;

-- Usage activity log — one row per user per calendar day active.
-- Feeds general engagement metrics (avg sessions/week) and, later, the
-- Medical+ pattern-based welfare check baseline. Applied directly via
-- Supabase MCP migration in-session — this file is kept as the readable
-- reference copy.

CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  session_count integer NOT NULL DEFAULT 1,
  first_activity_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_date)
);

CREATE INDEX IF NOT EXISTS user_activity_date_idx ON public.user_activity (activity_date);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON public.user_activity FOR UPDATE
  USING (auth.uid() = user_id);

GRANT ALL ON public.user_activity TO authenticated;
GRANT ALL ON public.user_activity TO service_role;

-- Atomic upsert function — call via supabase.rpc('log_user_activity', {p_user_id: user.id})
CREATE OR REPLACE FUNCTION public.log_user_activity(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot log activity for another user';
  END IF;
  INSERT INTO public.user_activity (user_id, activity_date, session_count, first_activity_at, last_activity_at)
  VALUES (p_user_id, CURRENT_DATE, 1, now(), now())
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET session_count = public.user_activity.session_count + 1, last_activity_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_user_activity(uuid) TO authenticated;
