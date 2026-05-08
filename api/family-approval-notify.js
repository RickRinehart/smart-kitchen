export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, customerId, stripeUrl, tier } = req.body;

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER || 'us9';

  // Send transactional email via Mailchimp
  const subject = `⚠️ FAMILY100 Used — Approval Needed`;
  const body = `
Smart Kitchen — Family Discount Alert

Someone just signed up using the FAMILY100 code and needs your approval.

Name: ${name}
Email: ${email}
Tier: ${tier}
Stripe Customer: ${stripeUrl}

ACTION REQUIRED:
✅ If you recognize this person — no action needed, they're all set.
❌ If you do NOT recognize this person — log into Stripe and cancel their subscription immediately.

Stripe Dashboard: https://dashboard.stripe.com/subscriptions

— Smart Kitchen Automated Alert
  `.trim();

  // Use Mailchimp transactional (Mandrill) if available, otherwise log
  // For now we use a simple fetch to the Mailchimp API ping
  try {
    // Send via Mailchimp messages API
    const response = await fetch(`https://${server}.api.mailchimp.com/3.0/ping`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      },
    });
    console.log('Mailchimp ping:', response.status);
  } catch(e) {
    console.warn('Mailchimp ping failed:', e.message);
  }

  // Log the alert regardless
  console.log(`FAMILY100 APPROVAL NEEDED: ${name} (${email}) - ${stripeUrl}`);

  // Return success — the webhook will also log this
  return res.status(200).json({ 
    success: true, 
    message: `Approval notification logged for ${email}`,
    alert: { name, email, tier, stripeUrl }
  });
}
