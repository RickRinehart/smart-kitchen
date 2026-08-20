import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRICE_TO_TIER = {
  [process.env.STRIPE_PRICE_SOLO_MONTHLY]: 'solo',
  [process.env.STRIPE_PRICE_SOLO_ANNUAL]: 'solo',
  [process.env.STRIPE_PRICE_COUPLE_MONTHLY]: 'couple',
  [process.env.STRIPE_PRICE_COUPLE_ANNUAL]: 'couple',
  [process.env.STRIPE_PRICE_FAMILY_MONTHLY]: 'family',
  [process.env.STRIPE_PRICE_FAMILY_ANNUAL]: 'family',
  [process.env.STRIPE_PRICE_MEDICAL_ADDON_MONTHLY]: 'medical_addon',
  [process.env.STRIPE_PRICE_MEDICAL_ADDON_ANNUAL]: 'medical_addon',
  // Legacy grandfathered
  [process.env.STRIPE_PRICE_MEDICAL_MONTHLY]: 'medical',
  [process.env.STRIPE_PRICE_MEDICAL_ANNUAL]: 'medical',
};

// -- Referral & Partner Payment Tracking (Commit 3 of 4, per the scope doc) --------------------
// Links 2-4 of the six-link chain. Deliberately isolated and defensively wrapped everywhere it's
// called below: a referral-tracking failure must NEVER break the core subscription/tier update
// logic this webhook already handles — that's the actual product, referral tracking is secondary.
async function findPartnerByCode(promoCode) {
  if (!promoCode) return null;
  try {
    const { data } = await supabase.from('partner_accounts').select('id, referral_code')
      .eq('referral_code', promoCode).eq('status', 'active').maybeSingle();
    return data || null;
  } catch (e) { console.error('findPartnerByCode error:', e.message); return null; }
}
async function logReferralEvent(row) {
  try {
    const { error } = await supabase.from('referral_events').insert(row);
    if (error) console.error('logReferralEvent error:', error.message);
  } catch (e) { console.error('logReferralEvent exception:', e.message); }
}
// A subscription's referral_code isn't known at conversion/cancellation time unless it was tagged
// earlier — looks up the earliest referral-tagged event for this subscription, if any exists.
async function getReferralForSubscription(subscriptionId) {
  try {
    const { data } = await supabase.from('referral_events').select('referral_code, partner_id')
      .eq('stripe_subscription_id', subscriptionId).not('referral_code', 'is', null)
      .order('occurred_at', { ascending: true }).limit(1).maybeSingle();
    return data || null;
  } catch (e) { console.error('getReferralForSubscription error:', e.message); return null; }
}
// --------------------------------------------------------------------------------------------

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Required — without this, Vercel pre-parses the request body before this
// handler runs, so the bytes buffer(req) reconstructs no longer match what
// Stripe originally signed, and constructEvent() fails on every request.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  let rawBody;
  try {
    rawBody = await buffer(req);
  } catch (err) {
    console.error('Failed to read body:', err.message);
    return res.status(400).send('Could not read body');
  }

  console.log('Body length:', rawBody.length, 'Secret length:', webhookSecret.length, 'Sig present:', !!sig);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  const obj = event.data.object;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const customerId = obj.customer;
        const subscriptionId = obj.subscription;
        const userId = obj.metadata && obj.metadata.supabase_user_id;
        const promoCode = obj.metadata && obj.metadata.promo_code;
        console.log('checkout.session.completed userId:', userId);
        if (!userId) { console.error('No supabase_user_id in metadata'); break; }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0] && subscription.items.data[0].price.id;
        const tier = PRICE_TO_TIER[priceId] || 'solo';
        console.log('Updating to tier:', tier, 'for user:', userId);
        const { error } = await supabase.from('profiles').update({
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          trial_ends_at: null,
        }).eq('id', userId);
        if (error) console.error('Supabase error:', error);
        else console.log('Profile updated successfully');

        // Referral tracking — Links 2 (Code Applied) & 3 (Trial Started). Both happen together
        // here since a completed checkout immediately starts the trial. Only logs anything if the
        // promo code used matches an active partner_accounts.referral_code — a non-partner promo
        // code (e.g. a plain discount) correctly logs nothing.
        try {
          const partner = await findPartnerByCode(promoCode);
          if (partner) {
            await logReferralEvent({ referral_code: partner.referral_code, partner_id: partner.id, link: 'code_applied', user_id: userId, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId });
            await logReferralEvent({ referral_code: partner.referral_code, partner_id: partner.id, link: 'trial_started', user_id: userId, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId });
          }
        } catch (e) { console.error('Referral tracking (checkout) failed:', e.message); }

        // Send plan-confirmation email now that the real tier is known
        try {
          const customerEmail = obj.customer_email || obj.customer_details?.email;
          const customerName = obj.customer_details?.name || '';
          if (customerEmail) {
            await fetch(`${process.env.VITE_APP_URL}/api/send-welcome-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: customerEmail, name: customerName, tier, event: 'plan_confirmed' }),
            });
          }
        } catch (e) {
          console.warn('Plan-confirmation email failed:', e.message);
        }
        // Send approval email if FAMILY100 was used
        if (promoCode && promoCode.toUpperCase() === 'FAMILY100') {
          const customerEmail = obj.customer_email || obj.customer_details?.email || 'unknown';
          const customerName = obj.customer_details?.name || 'unknown';
          const stripeUrl = `https://dashboard.stripe.com/customers/${customerId}`;
          // Use Mailchimp transactional or just log — we'll use mailto redirect via a serverless-safe approach
          console.log(`FAMILY100 USED: ${customerName} (${customerEmail}) - Customer ID: ${customerId}`);
          // Fire notification via fetch to our own mailchimp endpoint
          try {
            await fetch(`${process.env.VITE_APP_URL}/api/family-approval-notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: customerName, email: customerEmail, customerId, stripeUrl, tier }),
            });
          } catch(e) {
            console.warn('Approval notify failed:', e.message);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const priceId = obj.items && obj.items.data[0] && obj.items.data[0].price.id;
        const tier = PRICE_TO_TIER[priceId] || 'free';
        await supabase.from('profiles').update({ tier, subscription_status: obj.status }).eq('stripe_subscription_id', obj.id);
        // Referral tracking — Link 4 (Conversion). Only fires once, the first time this
        // subscription transitions to active, and only if it was referral-tagged at checkout.
        if (obj.status === 'active') {
          try {
            const ref = await getReferralForSubscription(obj.id);
            if (ref) {
              const { data: already } = await supabase.from('referral_events').select('id')
                .eq('stripe_subscription_id', obj.id).eq('link', 'converted').maybeSingle();
              if (!already) {
                await logReferralEvent({ referral_code: ref.referral_code, partner_id: ref.partner_id, link: 'converted', stripe_subscription_id: obj.id });
              }
            }
          } catch (e) { console.error('Referral tracking (conversion) failed:', e.message); }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        await supabase.from('profiles').update({ tier: 'free', subscription_status: 'canceled' }).eq('stripe_subscription_id', obj.id);
        // Referral tracking — Link 4 (Drop-off variant). Only a meaningful failure signal if this
        // subscription never converted — canceling AFTER a normal paid period is unrelated to the
        // referral funnel and shouldn't be logged as a drop-off.
        try {
          const ref = await getReferralForSubscription(obj.id);
          if (ref) {
            const { data: converted } = await supabase.from('referral_events').select('id')
              .eq('stripe_subscription_id', obj.id).eq('link', 'converted').maybeSingle();
            if (!converted) {
              await logReferralEvent({ referral_code: ref.referral_code, partner_id: ref.partner_id, link: 'dropped_off', stripe_subscription_id: obj.id });
            }
          }
        } catch (e) { console.error('Referral tracking (drop-off) failed:', e.message); }
        break;
      }
      case 'invoice.payment_failed': {
        await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', obj.customer);
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).send('Internal error');
  }

  return res.status(200).json({ received: true });
}
