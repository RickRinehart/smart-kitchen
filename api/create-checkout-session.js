import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  'solo_monthly':          process.env.STRIPE_PRICE_SOLO_MONTHLY,
  'solo_annual':           process.env.STRIPE_PRICE_SOLO_ANNUAL,
  'couple_monthly':        process.env.STRIPE_PRICE_COUPLE_MONTHLY,
  'couple_annual':         process.env.STRIPE_PRICE_COUPLE_ANNUAL,
  'family_monthly':        process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  'family_annual':         process.env.STRIPE_PRICE_FAMILY_ANNUAL,
  'medical_addon_monthly': process.env.STRIPE_PRICE_MEDICAL_ADDON_MONTHLY,
  'medical_addon_annual':  process.env.STRIPE_PRICE_MEDICAL_ADDON_ANNUAL,
  // Smarter Way to Shop -- separate a-la-carte add-on, purchasable by any tier including free.
  // Unlike medical_addon (only ever bundled with a base plan at signup), this can be added or
  // removed independently at any time, so it also needs its own standalone checkout entry point
  // (priceId itself, not just addOnPriceId) for existing subscribers adding it after the fact.
  'sws_addon_monthly':     process.env.STRIPE_PRICE_SWS_ADDON_MONTHLY,
  'sws_addon_annual':      process.env.STRIPE_PRICE_SWS_ADDON_ANNUAL,
  // Legacy — keep for beta family grandfathered pricing
  'medical_monthly':       process.env.STRIPE_PRICE_MEDICAL_MONTHLY,
  'medical_annual':        process.env.STRIPE_PRICE_MEDICAL_ANNUAL,
};

// GET ?action=current-pricing — live-reads current Stripe prices for the public-facing tiers so an
// in-app pricing display can never silently drift from what's actually configured in Stripe. Legacy
// grandfathered keys are intentionally excluded — a current subscriber viewing "what does this cost
// today" should see standard pricing, not their own or someone else's special-case rate.
async function handleCurrentPricing(req, res) {
  const PUBLIC_KEYS = ['solo_monthly','solo_annual','couple_monthly','couple_annual','family_monthly','family_annual','medical_addon_monthly','medical_addon_annual','sws_addon_monthly','sws_addon_annual'];
  try {
    const entries = PUBLIC_KEYS.filter(k => PRICE_MAP[k]);
    const prices = await Promise.all(entries.map(async (key) => {
      const p = await stripe.prices.retrieve(PRICE_MAP[key]);
      return {
        key,
        amount: (p.unit_amount || 0) / 100,
        currency: p.currency,
        interval: p.recurring ? p.recurring.interval : null,
        active: p.active,
      };
    }));
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min edge cache — live enough, not hammering Stripe on every open
    res.json({ prices, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Current pricing fetch error:', err);
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.action === 'current-pricing') {
    return handleCurrentPricing(req, res);
  }
  if (req.method !== 'POST') return res.status(405).end();
  const { priceId, addOnPriceId, addOnPriceIds, userId, userEmail, promoCode } = req.body;
  if (!priceId || !userId) {
    return res.status(400).json({ error: 'priceId and userId required' });
  }

  const priceMap = PRICE_MAP;

  const resolvedPriceId = priceMap[priceId] || priceId;
  // Accepts either the original singular addOnPriceId (Medical+ only, kept for backward
  // compatibility) or the newer addOnPriceIds array (supports bundling multiple add-ons -- e.g.
  // Medical+ and Smarter Way to Shop -- into the same checkout/subscription at signup).
  const rawAddOns = addOnPriceIds && addOnPriceIds.length ? addOnPriceIds : (addOnPriceId ? [addOnPriceId] : []);
  const resolvedAddOns = rawAddOns.map(id => priceMap[id] || id).filter(Boolean);

  console.log('Checkout debug:', { priceId, resolvedPriceId, addOns: resolvedAddOns, hasKey: !!process.env.STRIPE_SECRET_KEY });

  if (!resolvedPriceId) {
    return res.status(400).json({ error: 'Could not resolve price ID for: ' + priceId });
  }

  try {
    // Build line items — base plan + any add-ons
    const lineItems = [{ price: resolvedPriceId, quantity: 1 }];
    for (const addOn of resolvedAddOns) {
      lineItems.push({ price: addOn, quantity: 1 });
    }

    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: lineItems,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          has_addon: resolvedAddOns.length ? 'true' : 'false',
        },
      },
      metadata: {
        supabase_user_id: userId,
        promo_code: promoCode || '',
        has_addon: resolvedAddOns.length ? 'true' : 'false',
      },
      success_url: `${process.env.VITE_APP_URL}/?checkout=success`,
      cancel_url: `${process.env.VITE_APP_URL}/`,
    };

    if (promoCode) {
      try {
        const codes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
        if (codes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: codes.data[0].id }];
          delete sessionParams.allow_promotion_codes;
        }
      } catch(e) {
        console.warn('Promo code lookup failed:', e.message);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: err.message });
  }
}
