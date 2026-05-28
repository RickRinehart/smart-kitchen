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
