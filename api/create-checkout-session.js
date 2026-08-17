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
  // Legacy — keep for beta family grandfathered pricing
  'medical_monthly':       process.env.STRIPE_PRICE_MEDICAL_MONTHLY,
  'medical_annual':        process.env.STRIPE_PRICE_MEDICAL_ANNUAL,
};

// GET ?action=current-pricing — live-reads current Stripe prices for the public-facing tiers so an
// in-app pricing display can never silently drift from what's actually configured in Stripe. Legacy
// grandfathered keys are intentionally excluded — a current subscriber viewing "what does this cost
// today" should see standard pricing, not their own or someone else's special-case rate.
async function handleCurrentPricing(req, res) {
  const PUBLIC_KEYS = ['solo_monthly','solo_annual','couple_monthly','couple_annual','family_monthly','family_annual','medical_addon_monthly','medical_addon_annual'];
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
  const { priceId, addOnPriceId, userId, userEmail, promoCode } = req.body;
  if (!priceId || !userId) {
    return res.status(400).json({ error: 'priceId and userId required' });
  }

  const priceMap = PRICE_MAP;

  const resolvedPriceId = priceMap[priceId] || priceId;
  const resolvedAddOn = addOnPriceId ? (priceMap[addOnPriceId] || addOnPriceId) : null;

  console.log('Checkout debug:', { priceId, resolvedPriceId, addOn: resolvedAddOn, hasKey: !!process.env.STRIPE_SECRET_KEY });

  if (!resolvedPriceId) {
    return res.status(400).json({ error: 'Could not resolve price ID for: ' + priceId });
  }

  try {
    // Build line items — base plan + optional Medical+ add-on
    const lineItems = [{ price: resolvedPriceId, quantity: 1 }];
    if (resolvedAddOn) {
      lineItems.push({ price: resolvedAddOn, quantity: 1 });
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
          has_medical_addon: resolvedAddOn ? 'true' : 'false',
        },
      },
      metadata: {
        supabase_user_id: userId,
        promo_code: promoCode || '',
        has_medical_addon: resolvedAddOn ? 'true' : 'false',
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
