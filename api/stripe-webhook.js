import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map Stripe price IDs to tier names
const PRICE_TO_TIER = {
  [process.env.STRIPE_PRICE_SOLO_MONTHLY]: 'solo',
  [process.env.STRIPE_PRICE_SOLO_ANNUAL]: 'solo',
  [process.env.STRIPE_PRICE_FAMILY_MONTHLY]: 'family',
  [process.env.STRIPE_PRICE_FAMILY_ANNUAL]: 'family',
  [process.env.STRIPE_PRICE_MEDICAL_MONTHLY]: 'medical',
  [process.env.STRIPE_PRICE_MEDICAL_ANNUAL]: 'medical',
};

export const config = {
  api: { bodyParser: false }
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const userId = session.metadata?.supabase_user_id;

      if (!userId) {
        console.error('No supabase_user_id in session metadata');
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const tier = PRICE_TO_TIER[priceId] || 'solo';

      await supabase.from('profiles').update({
        tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        trial_ends_at: null,
      }).eq('id', userId);

      break;
    }

    case 'customer.subscription.updated': {
      const priceId = session.items.data[0]?.price.id;
      const tier = PRICE_TO_TIER[priceId] || 'free';
      const status = session.status;

      await supabase.from('profiles')
        .update({ tier, subscription_status: status })
        .eq('stripe_subscription_id', session.id);
      break;
    }

    case 'customer.subscription.deleted': {
      await supabase.from('profiles')
        .update({ tier: 'free', subscription_status: 'canceled' })
        .eq('stripe_subscription_id', session.id);
      break;
    }

    case 'invoice.payment_failed': {
      await supabase.from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', session.customer);
      break;
    }
  }

  res.json({ received: true });
}
