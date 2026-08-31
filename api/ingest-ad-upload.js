import { createClient } from '@supabase/supabase-js';

// Admin ad-upload commit endpoint (Smarter Way to Shop). Extraction happens client-side via
// callClaude with a PDF document block (same pattern as the existing Weekly Ad Scanner) --
// this endpoint only handles the actual database write, since partner_ads and partner_stores
// RLS only grant INSERT to service_role, not to authenticated users even as admins.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { storeId, newStore, items, saleStart, saleEnd, enteredBy } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let resolvedStoreId = storeId;

  // Create the store first if this is a brand-new one, rather than assuming it already exists.
  if (!resolvedStoreId && newStore && newStore.name) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from('partner_stores')
      .insert({
        name: newStore.name,
        chain: newStore.chain || null,
        location_handling_type: newStore.location_handling_type || null,
        inventory_model: newStore.inventory_model || 'recurring',
        ad_cycle_start_day: newStore.ad_cycle_start_day || null,
        ad_cycle_end_day: newStore.ad_cycle_end_day || null,
        notes: newStore.notes || null,
      })
      .select('id')
      .single();
    if (createErr) return res.status(500).json({ error: 'Failed to create store', detail: createErr.message });
    resolvedStoreId = created.id;
  }

  if (!resolvedStoreId) {
    return res.status(400).json({ error: 'storeId or newStore.name is required' });
  }

  const rows = items
    .filter(item => item.item_name && String(item.item_name).trim())
    .map(item => ({
      partner_store_id: resolvedStoreId,
      item_name: String(item.item_name).trim(),
      canonical_key: item.canonical_key ? String(item.canonical_key).trim() : null,
      regular_price: item.regular_price ?? null,
      card_price: item.card_price ?? null,
      mix_match_price: item.mix_match_price ?? null,
      coupon_price: item.coupon_price ?? null,
      compare_at_price: item.compare_at_price ?? null,
      department: item.department || null,
      unit_size: item.unit_size || null,
      sale_start: saleStart || null,
      sale_end: saleEnd || null,
      source: 'pdf_upload',
      entered_by: enteredBy || 'admin',
      notes: item.notes || null,
    }));

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid items (all missing item_name)' });
  }

  const { error: insertErr } = await supabaseAdmin.from('partner_ads').insert(rows);
  if (insertErr) return res.status(500).json({ error: 'Insert failed', detail: insertErr.message });

  return res.status(200).json({ ok: true, storeId: resolvedStoreId, inserted: rows.length });
}
