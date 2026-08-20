import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LANDING_URL = process.env.VITE_APP_URL || 'https://smart-kitchen-opal.vercel.app';

// Referral & Partner Payment Tracking — Commit 2 of 4 (Link 1: QR Scan)
// Per SmartKitchen_ReferralPartnerTracking_Scope_v1.docx Section 3: "The QR should point at a
// Smart Kitchen-controlled URL that logs the scan itself before redirecting, keeping every link
// inside your own stack" — replaces relying on QR Tiger's own analytics as source of truth.
//
// Also bundles the Section 5/7 rate-limiting requirement ("basic protection... before scan counts
// are used for partner fee disputes") rather than deferring it, since the doc explicitly calls out
// bundling it into this same commit.

export default async function handler(req, res) {
  const code = req.query.code;

  // No code at all — just send to the landing page, nothing to log
  if (!code) {
    res.writeHead(302, { Location: LANDING_URL });
    return res.end();
  }

  try {
    const { data: partner } = await supabase
      .from('partner_accounts')
      .select('id, status')
      .eq('referral_code', code)
      .maybeSingle();

    // Rate limiting / dedup: one logged scan per IP per code per hour. Prevents inflated scan
    // counts from bots, link previews, or someone repeatedly tapping the same QR — important
    // before these numbers are ever used to settle a partner fee dispute.
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress || 'unknown';
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data: recentScan } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referral_code', code)
      .eq('link', 'scan')
      .gte('occurred_at', oneHourAgo)
      .contains('metadata', { ip })
      .limit(1)
      .maybeSingle();

    if (!recentScan) {
      const { error } = await supabase.from('referral_events').insert({
        referral_code: code,
        partner_id: partner?.id || null,
        link: 'scan',
        metadata: {
          ip,
          userAgent: req.headers['user-agent'] || null,
          partnerFound: !!partner,
          partnerActive: partner?.status === 'active',
        },
      });
      if (error) console.error('Scan log insert error:', error.message);
    }
  } catch (e) {
    // A logging failure must never degrade the actual user experience — always fall through to
    // the redirect below regardless of what happened above.
    console.error('Redirect logging error:', e.message);
  }

  // Carry the code forward as a query param so the app can pick it up (e.g. pre-fill/auto-apply
  // the matching promo code at checkout) — this is what actually connects Link 1 (this scan) to
  // Link 2 (Code Applied, already wired in the Stripe webhook) instead of requiring the user to
  // remember and manually retype the code later.
  const dest = LANDING_URL + '?ref=' + encodeURIComponent(code);
  res.writeHead(302, { Location: dest });
  res.end();
}
