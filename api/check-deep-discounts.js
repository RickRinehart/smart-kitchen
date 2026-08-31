import { createClient } from '@supabase/supabase-js';

// Deep Discount Alerts — daily cron. Mirrors the check-recalls pattern in send-shopping-list.js
// exactly: compute matches server-side, upsert into a table with a persistent top-of-app banner
// reading from it — not an SMS/push notification. This makes a deep discount visible even if the
// user doesn't happen to open the Meal Plan tab that day, without adding new notification
// infrastructure beyond what's already proven in this codebase.
//
// The matching/normalization logic here is a direct Node port of the client-side functions in
// App.jsx (matchSaleItemToInventoryItem, parsePartnerAdQuantity, normalizePartnerAdPrice) —
// kept behaviorally identical on purpose, so "what counts as a match" never diverges between
// the in-app banner and this alert.

function matchSaleItemToInventoryItem(saleItemName, inventoryItemName) {
  const s = (saleItemName || "").toLowerCase().trim();
  const inv = (inventoryItemName || "").toLowerCase().trim();
  if (!s || !inv || inv.length < 3) return false;
  if (s.includes(" or ") || (s.match(/,/g) || []).length > 1) return false;
  return s.includes(inv) || inv.includes(s);
}

function parsePartnerAdQuantity(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();
  let m;
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*lb/))) return { qty: parseFloat(m[1]), family: "lb" };
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*oz/))) return { qty: parseFloat(m[1]) / 16, family: "lb" };
  if (/^lb\.?s?$/.test(t)) return { qty: 1, family: "lb" };
  if (/^oz\.?$/.test(t)) return { qty: 1 / 16, family: "lb" };
  if (/^each$|^ea\.?$/.test(t)) return { qty: 1, family: "each" };
  return null;
}

function normalizePartnerAdPrice(adPrice, adUnitSize, invUnit) {
  if (adPrice == null) return null;
  const adQty = parsePartnerAdQuantity(adUnitSize);
  const invQty = parsePartnerAdQuantity(invUnit);
  if (!adQty || !invQty || adQty.family !== invQty.family || !adQty.qty) return null;
  return +(adPrice / adQty.qty).toFixed(2);
}

export default async function handler(req, res) {
  const cronAction = req.method === 'GET' ? req.query.action : null;
  if (cronAction !== 'check-deep-discounts') return res.status(405).end();

  const authHeader = req.headers['authorization'] || '';
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Eligible users: active SWTS addon OR still within trial. Admin bypass intentionally
    // omitted here -- this is a production alert job, not a UI entitlement gate.
    const nowIso = new Date().toISOString();
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, smarter_way_to_shop_addon, trial_ends_at')
      .or(`smarter_way_to_shop_addon.eq.true,trial_ends_at.gt.${nowIso}`);
    if (profErr) return res.status(500).json({ error: 'profiles query failed', detail: profErr.message });
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ ok: true, message: 'No eligible users.', usersScanned: 0 });
    }

    let totalAlerts = 0;
    let usersScanned = 0;

    for (const profile of profiles) {
      const userId = profile.id;

      const { data: markets } = await supabaseAdmin
        .from('user_preferred_markets')
        .select('partner_store_id')
        .eq('user_id', userId);
      if (!markets || markets.length === 0) continue;
      const storeIds = markets.map(m => m.partner_store_id);

      const { data: prefs } = await supabaseAdmin
        .from('user_shopping_preferences')
        .select('deep_discount_alert_threshold_pct')
        .eq('user_id', userId)
        .maybeSingle();
      const threshold = prefs?.deep_discount_alert_threshold_pct ?? 40;

      const { data: userData } = await supabaseAdmin
        .from('user_data')
        .select('inventory')
        .eq('user_id', userId)
        .maybeSingle();
      const inventory = userData?.inventory || [];
      if (inventory.length === 0) continue;

      const today = new Date().toISOString().slice(0, 10);
      const { data: ads } = await supabaseAdmin
        .from('partner_ads')
        .select('item_name, regular_price, card_price, compare_at_price, unit_size, sale_start, sale_end, partner_stores(name, inventory_model)')
        .in('partner_store_id', storeIds)
        .or(`sale_start.is.null,sale_start.lte.${today}`)
        .or(`sale_end.is.null,sale_end.gte.${today}`);
      if (!ads || ads.length === 0) continue;

      usersScanned++;
      const matchRows = [];

      for (const ad of ads) {
        if (!ad.compare_at_price) continue; // no deep-discount signal without a stated compare price
        for (const inv of inventory) {
          if (!matchSaleItemToInventoryItem(ad.item_name, inv.name)) continue;

          const rawAdPrice = ad.card_price ?? ad.regular_price ?? null;
          const basis = ad.regular_price ?? rawAdPrice;
          if (!basis) continue;
          const discountPct = +(((ad.compare_at_price - basis) / ad.compare_at_price) * 100).toFixed(1);

          const isDeepDiscountEligible = discountPct >= threshold && (inv.purchaseCount || 0) >= 1;
          if (!isDeepDiscountEligible) continue;

          matchRows.push({
            user_id: userId,
            item_name: ad.item_name,
            inventory_item_name: inv.name,
            store_name: ad.partner_stores?.name || 'Unknown store',
            discount_pct: discountPct,
            compare_at_price: ad.compare_at_price,
            ad_price: basis,
            inventory_model: ad.partner_stores?.inventory_model || null,
          });
          break; // one match per ad item, same conservative rule as the client-side bridge
        }
      }

      if (matchRows.length > 0) {
        // ignoreDuplicates:true, matching the recall-alert pattern exactly -- if this exact
        // user+item+store alert already exists, leave it (and its read status) untouched rather
        // than re-surfacing something the user already dismissed for the same match.
        const { error: upsertErr } = await supabaseAdmin
          .from('user_deep_discount_alerts')
          .upsert(matchRows, { onConflict: 'user_id,item_name,store_name', ignoreDuplicates: true });
        if (upsertErr) console.error('deep discount upsert error:', upsertErr.message);
        else totalAlerts += matchRows.length;
      }

      // Stale cleanup -- remove alerts for matches that no longer qualify (ad ended, price
      // changed, item removed from inventory), same approach as check-recalls.
      const currentKeys = new Set(matchRows.map(m => `${m.item_name}::${m.store_name}`));
      const { data: existingAlerts } = await supabaseAdmin
        .from('user_deep_discount_alerts')
        .select('id, item_name, store_name')
        .eq('user_id', userId);
      const staleIds = (existingAlerts || [])
        .filter(a => !currentKeys.has(`${a.item_name}::${a.store_name}`))
        .map(a => a.id);
      if (staleIds.length > 0) {
        await supabaseAdmin.from('user_deep_discount_alerts').delete().in('id', staleIds);
      }
    }

    return res.status(200).json({ ok: true, usersScanned, totalAlerts });
  } catch (e) {
    console.error('check-deep-discounts error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
