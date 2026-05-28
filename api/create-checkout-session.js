import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { priceId, addOnPriceId, userId, userEmail, promoCode } = req.body;
  if (!priceId || !userId) {
    return res.status(400).json({ error: 'priceId and userId required' });
  }

  const priceMap = {
    'solo_monthly':         process.env.STRIPE_PRICE_SOLO_MONTHLY,
    'solo_annual':          process.env.STRIPE_PRICE_SOLO_ANNUAL,
    'couple_monthly':       process.env.STRIPE_PRICE_COUPLE_MONTHLY,
    'couple_annual':        process.env.STRIPE_PRICE_COUPLE_ANNUAL,
    'family_monthly':       process.env.STRIPE_PRICE_FAMILY_MONTHLY,
    'family_annual':        process.env.STRIPE_PRICE_FAMILY_ANNUAL,
    'medical_addon_monthly': process.env.STRIPE_PRICE_MEDICAL_ADDON_MONTHLY,
    'medical_addon_annual':  process.env.STRIPE_PRICE_MEDICAL_ADDON_ANNUAL,
    // Legacy — keep for beta family grandfathered pricing
    'medical_monthly':      process.env.STRIPE_PRICE_MEDICAL_MONTHLY,
    'medical_annual':       process.env.STRIPE_PRICE_MEDICAL_ANNUAL,
  };

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
