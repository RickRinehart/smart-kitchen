-- Smarter Way to Shop — core schema
-- Run this in the Supabase SQL Editor at supabase.com/dashboard, or applied
-- directly via Supabase MCP migration in-session (this file is the readable
-- reference copy, matching the existing pattern for this project).
-- Project: wnlqvmedocpgjawmwivd
--
-- Covers the four tables defined across:
--   SmartKitchen_SmarterWayToShop_PricingTripDecision_v2.docx
--   SmartKitchen_SmarterWayToShop_DeepDiscountAlerts_v1.docx
--
-- partner_stores / partner_ads are shared reference data, collected centrally
-- (Horrocks email parser, future collector submissions) — not user-generated.
-- Every authenticated user can read them; only service_role can write, same
-- pattern as upc_cache.
--
-- user_preferred_markets / user_shopping_preferences are personal, per-user
-- data — RLS scoped to auth.uid(), same pattern as user_data.

-- ============================================================
-- partner_stores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_stores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  chain                 text,
  location_handling_type text,   -- free text for now; formal enum is still an open decision
  inventory_model       text NOT NULL DEFAULT 'recurring'
                          CHECK (inventory_model IN ('recurring','closeout_limited')),
  ad_cycle_start_day    text,
  ad_cycle_end_day      text,
  active                boolean NOT NULL DEFAULT true,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can read partner_stores"
  ON public.partner_stores FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.partner_stores TO authenticated;
GRANT ALL ON public.partner_stores TO service_role;

-- ============================================================
-- partner_ads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partner_ads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id  uuid NOT NULL REFERENCES public.partner_stores(id) ON DELETE CASCADE,
  item_name         text NOT NULL,
  canonical_key     text,           -- cross-store matching key; nullable until assigned
  regular_price     numeric(10,2),
  card_price        numeric(10,2),
  mix_match_price   numeric(10,2),
  coupon_price      numeric(10,2),
  compare_at_price  numeric(10,2),  -- retailer-stated reference price; never used in
                                     -- cross-store "lowest price" comparisons, only for
                                     -- Deep Discount Alerts' discount-percentage calc
  department        text,           -- retailer-side department tag (produce, meat, deli,
                                     -- grocery, tavern, ...) -- lets Smart Kitchen and Smart
                                     -- Cellar each filter this same table for what's relevant
                                     -- to them, without needing separate tables
  unit_size         text,
  sale_start        date,
  sale_end          date,
  source            text,           -- 'email' | 'pdf' | 'manual' | future collector sources
  entered_by        text,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_ads_canonical_key_idx ON public.partner_ads (canonical_key);
CREATE INDEX IF NOT EXISTS partner_ads_store_dates_idx ON public.partner_ads (partner_store_id, sale_start, sale_end);
CREATE INDEX IF NOT EXISTS partner_ads_department_idx ON public.partner_ads (department);

ALTER TABLE public.partner_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can read partner_ads"
  ON public.partner_ads FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.partner_ads TO authenticated;
GRANT ALL ON public.partner_ads TO service_role;

-- ============================================================
-- user_preferred_markets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferred_markets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_store_id  uuid NOT NULL REFERENCES public.partner_stores(id) ON DELETE CASCADE,
  route_status      text NOT NULL DEFAULT 'regular_route'
                      CHECK (route_status IN ('regular_route','special_trip')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_store_id)
);

ALTER TABLE public.user_preferred_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferred markets"
  ON public.user_preferred_markets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferred markets"
  ON public.user_preferred_markets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferred markets"
  ON public.user_preferred_markets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferred markets"
  ON public.user_preferred_markets FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON public.user_preferred_markets TO authenticated;
GRANT ALL ON public.user_preferred_markets TO service_role;

-- ============================================================
-- user_shopping_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_shopping_preferences (
  user_id                             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_loyalty_card                    boolean NOT NULL DEFAULT true,
  buys_in_bulk                        boolean NOT NULL DEFAULT false,
  split_trip_min_savings              numeric(10,2),       -- nullable; no minimum by default
  deep_discount_alert_threshold_pct   numeric(5,2) NOT NULL DEFAULT 40,
  updated_at                          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_shopping_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shopping preferences"
  ON public.user_shopping_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping preferences"
  ON public.user_shopping_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping preferences"
  ON public.user_shopping_preferences FOR UPDATE
  USING (auth.uid() = user_id);

GRANT ALL ON public.user_shopping_preferences TO authenticated;
GRANT ALL ON public.user_shopping_preferences TO service_role;
