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
  [process.env.STRIPE_PRICE_FAMILY_MONTHLY]: 'family',
  [process.env.STRIPE_PRICE_FAMILY_ANNUAL]: 'family',
  [process.env.STRIPE_PRICE_MEDICAL_MONTHLY]: 'medical',
  [process.env.STRIPE_PRICE_MEDICAL_ANNUAL]: 'medical',
};

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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  // Read raw body
  const rawBody = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  console.log('Raw body length:', rawBody.length);
  console.log('Signature header present:', !!sig);
  console.log('Webhook secret length:', webhookSecret?.length);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const customerId = obj.customer;
        const subscriptionId = obj.subscription;
        const userId = obj.metadata?.supabase_user_id;

        console.log('checkout completed - userId:', userId);

        if (!userId) {
          console.error('No supabase_user_id in metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || 'solo';

        const { error } = await supabase.from('profiles').update({
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          trial_ends_at: null,
        }).eq('id', userId);

        if (error) console.error('Supabase error:', error);
        else console.log('Profile updated to tier:', tier);
        break;
      }

      case 'customer.subscription.updated': {
        const priceId = obj.items?.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || 'free';
        await supabase.from('profiles')
          .update({ tier, subscription_status: obj.status })
          .eq('stripe_subscription_id', obj.id);
        break;
      }

      case 'customer.subscription.deleted': {
        await supabase.from('profiles')
          .update({ tier: 'free', subscription_status: 'canceled' })
          .eq('stripe_subscription_id', obj.id);
        break;
      }

      case 'invoice.payment_failed': {
        await supabase.from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', obj.customer);
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).send('Internal error');
  }

  return res.status(200).json({ received: true });
}
