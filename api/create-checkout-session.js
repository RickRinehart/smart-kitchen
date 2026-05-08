import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { priceId, userId, userEmail, promoCode } = req.body;
  if (!priceId || !userId) {
    return res.status(400).json({ error: 'priceId and userId required' });
  }
  try {
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      metadata: { supabase_user_id: userId, promo_code: promoCode || '' },
      success_url: `${process.env.VITE_APP_URL}/?checkout=success`,
      cancel_url: `${process.env.VITE_APP_URL}/`,
    };
    // If a specific promo code was passed, look it up and apply it
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
