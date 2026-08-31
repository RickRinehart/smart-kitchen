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

// Smarter Way to Shop -- a separate a-la-carte add-on (its own profiles column, not a tier value).
// Purchasable standalone (its own subscription) or alongside a base plan, at signup or later.
const SWS_ADDON_PRICE_IDS = [
  process.env.STRIPE_PRICE_SWS_ADDON_MONTHLY,
  process.env.STRIPE_PRICE_SWS_ADDON_ANNUAL,
].filter(Boolean);

// Derives {tier, hasSWSAddon} from a FULL list of a subscription's line items, not just item[0].
// The previous single-item check (subscription.items.data[0]) silently broke whenever an add-on
// wasn't in the first position -- e.g. a base plan + add-on checkout, where the add-on line item
// is added second (see create-checkout-session.js). This checks every item instead, so an add-on
// is detected regardless of its position, and a tier is only returned if a real tier price is
// actually present -- an add-on-only subscription (no base-tier item) correctly returns tier=null
// rather than guessing, so it never accidentally overwrites someone's real tier.
function deriveEntitlementsFromItems(items) {
  let tier = null;
  let hasSWSAddon = false;
  for (const item of items || []) {
    const priceId = item.price && item.price.id;
    if (!priceId) continue;
    if (SWS_ADDON_PRICE_IDS.includes(priceId)) { hasSWSAddon = true; continue; }
    if (PRICE_TO_TIER[priceId]) { tier = PRICE_TO_TIER[priceId]; }
  }
  return { tier, hasSWSAddon };
}

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
        const { tier: derivedTier, hasSWSAddon } = deriveEntitlementsFromItems(subscription.items.data);
        console.log('Derived tier:', derivedTier, 'hasSWSAddon:', hasSWSAddon, 'for user:', userId);
        const profileUpdate = {
          stripe_customer_id: customerId,
          subscription_status: 'active',
          trial_ends_at: null,
        };
        // Only set tier when a real base-tier price was actually in this checkout. An addon-only
        // purchase (e.g. buying just Smarter Way to Shop with no base plan) must NOT overwrite
        // whatever tier the user already has -- falling back to a default here would incorrectly
        // "upgrade" a free user, or downgrade an existing family/medical subscriber, just because
        // this particular checkout session didn't happen to include a base-tier line item.
        if (derivedTier) {
          profileUpdate.tier = derivedTier;
          profileUpdate.stripe_subscription_id = subscriptionId;
        }
        if (hasSWSAddon) {
          profileUpdate.smarter_way_to_shop_addon = true;
          // Addon-only purchase (no base tier in this same checkout) -> its own subscription ID,
          // tracked separately so cancelling it later doesn't touch the base plan or vice versa.
          if (!derivedTier) profileUpdate.stripe_sws_subscription_id = subscriptionId;
        }
        const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
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
              body: JSON.stringify({ email: customerEmail, name: customerName, tier: derivedTier || 'solo', event: 'plan_confirmed' }),
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
              body: JSON.stringify({ name: customerName, email: customerEmail, customerId, stripeUrl, tier: derivedTier || 'solo' }),
            });
          } catch(e) {
            console.warn('Approval notify failed:', e.message);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const { tier: derivedTier, hasSWSAddon } = deriveEntitlementsFromItems(obj.items && obj.items.data);
        const update = { subscription_status: obj.status };
        // Never falls back to a default tier here (unlike the pre-existing behavior this replaces)
        // -- this event fires per-subscription, and a customer can now have a base-plan subscription
        // and a separate addon-only subscription at once. A status change on the addon-only
        // subscription must not wipe the base plan's tier just because THIS subscription's own
        // items don't include a tier price.
        if (derivedTier) update.tier = derivedTier;
        // Only ever sets the addon flag true here, never clears it -- a subscription legitimately
        // updating for unrelated reasons (e.g. the base plan changing tiers) won't include the SWS
        // price either, and that must not be misread as the addon having been removed. Clearing the
        // flag is handled explicitly in customer.subscription.deleted below, where "this specific
        // subscription is gone" is an unambiguous signal.
        if (hasSWSAddon) update.smarter_way_to_shop_addon = true;
        await supabase.from('profiles').update(update).eq('stripe_subscription_id', obj.id);
        if (hasSWSAddon) {
          // Also covers the case where this update event IS the addon-only subscription
          await supabase.from('profiles').update(update).eq('stripe_sws_subscription_id', obj.id);
        }
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
        // Deletion is unambiguous per-subscription, unlike .updated above -- if THIS subscription
        // is gone, whatever it uniquely provided is gone too. Checked against both possible
        // subscription-id columns since either could be the one that was just cancelled.
        await supabase.from('profiles').update({ tier: 'free', subscription_status: 'canceled' }).eq('stripe_subscription_id', obj.id);
        await supabase.from('profiles').update({ smarter_way_to_shop_addon: false, stripe_sws_subscription_id: null }).eq('stripe_sws_subscription_id', obj.id);
        // Covers the bundled case too: addon purchased alongside a base plan in the same
        // subscription (like the existing medical_addon pattern) -- if that shared subscription is
        // cancelled, the addon flag needs clearing even though it was never in stripe_sws_subscription_id.
        const { tier: deletedTier, hasSWSAddon: deletedHadSWSAddon } = deriveEntitlementsFromItems(obj.items && obj.items.data);
        if (deletedHadSWSAddon) {
          await supabase.from('profiles').update({ smarter_way_to_shop_addon: false }).eq('stripe_subscription_id', obj.id);
        }
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
      case 'invoice.paid': {
        // Referral tracking — ongoing revenue ledger. A flat per-conversion fee only needs the
        // one 'converted' event, but a percentage-of-revenue bonus (hybrid fee structures) needs
        // a running total of what a referred subscription actually paid over time, since
        // subscriptions keep billing monthly. Only logs anything if this subscription was
        // referral-tagged at checkout — a non-referred customer's invoice correctly logs nothing.
        try {
          const customerId = obj.customer;
          const amountPaid = (obj.amount_paid || 0) / 100; // Stripe amounts are in cents
          const subscriptionId = obj.subscription;
          if (subscriptionId && amountPaid > 0) {
            const ref = await getReferralForSubscription(subscriptionId);
            if (ref) {
              await logReferralEvent({
                referral_code: ref.referral_code,
                partner_id: ref.partner_id,
                link: 'revenue',
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                amount: amountPaid,
              });
            }
          }
        } catch (e) { console.error('Referral tracking (revenue) failed:', e.message); }
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
