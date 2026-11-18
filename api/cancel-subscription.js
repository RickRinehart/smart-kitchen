// Self-serve cancellation, confirmed by email.
//
//   POST /api/cancel-subscription?action=request   (signed-in; Bearer token)
//        -> emails the user a confirmation link and tells the team a cancellation was requested.
//   GET  /api/cancel-subscription?t=TOKEN
//        -> shows a confirm page (nothing changes yet; GET is safe for email link scanners).
//   POST /api/cancel-subscription  (form: t, action=confirm | reason, reason)
//        -> performs the cancellation / records the reason, and tells the team.
//
// Paid subscribers: the Stripe subscription is set to cancel at the end of the paid period (they keep
// access until then; the existing webhook downgrades them when it actually ends).
// Free-trial users (no Stripe subscription): the trial ends now.
import crypto from 'crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const TEAM_EMAIL = 'thesmartkitchenapp@gmail.com';
const FROM = 'Smart Kitchen <hello@mail.rgdigitallabs.com>';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const appUrl = () => (process.env.VITE_APP_URL || 'https://smart-kitchen-opal.vercel.app').replace(/\/+$/, '');
const cleanReason = (r) => String(r || '').trim().slice(0, 1000);

// ---- signed, expiring link tokens (no database table needed) -------------------------------------
function secret() { return process.env.CANCEL_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; }
const b64 = (buf) => Buffer.from(buf).toString('base64url');
function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + mac;
}
function verify(token) {
  try {
    if (!secret() || typeof token !== 'string') return null;
    const [body, mac] = token.split('.');
    if (!body || !mac) return null;
    const expect = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
    const a = Buffer.from(mac), b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (p.p !== 'cancel' || !p.u || !p.e || Date.now() > p.e) return null;
    return p;
  } catch (e) { return null; }
}

// ---- helpers --------------------------------------------------------------------------------------
async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY_RGDL;
  if (!key) throw new Error('Missing RESEND_API_KEY_RGDL');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [to], subject, html, text,
      reply_to: replyTo || TEAM_EMAIL,
      tags: [{ name: 'category', value: 'cancellation' }],
    }),
  });
  const result = await r.json().catch(() => ({}));
  if (!result.id) throw new Error(result.message || 'Email send failed');
}

async function loadAccount(userId) {
  const { data: profile } = await supabase.from('profiles')
    .select('id, email, full_name, tier, subscription_status, stripe_subscription_id, stripe_sws_subscription_id, trial_ends_at')
    .eq('id', userId).maybeSingle();
  if (!profile) return null;
  let email = profile.email;
  if (!email) {
    try { const { data } = await supabase.auth.admin.getUserById(userId); email = data && data.user && data.user.email; } catch (e) { /* ignore */ }
  }
  const hasSub = !!(profile.stripe_subscription_id || profile.stripe_sws_subscription_id)
    && ['active', 'trialing', 'past_due'].includes(profile.subscription_status);
  const trialActive = !hasSub && profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  return { ...profile, email, kind: hasSub ? 'paid' : (trialActive ? 'trial' : 'none') };
}

const shell = (title, inner) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f1ea;font-family:Arial,sans-serif;color:#1B3D2F;">
<div style="max-width:520px;margin:0 auto;padding:24px 16px;">
<div style="background:#1B3D2F;padding:18px 20px;border-radius:10px 10px 0 0;"><span style="color:#C8963E;font-size:22px;font-weight:bold;">Smart Kitchen&#8482;</span></div>
<div style="background:#fff;border:1px solid #D9E4DC;border-top:none;border-radius:0 0 10px 10px;padding:22px;line-height:1.6;font-size:15px;">${inner}</div></div></body></html>`;
const page = (res, status, title, inner) => res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(shell(title, inner));
const btn = 'display:inline-block;background:#C8963E;color:#000;font-weight:bold;border:none;border-radius:8px;padding:12px 18px;font-size:15px;text-decoration:none;cursor:pointer;';
const reasonBox = '<textarea name="reason" rows="4" maxlength="1000" placeholder="Optional — too expensive, missing a feature, hard to use, no longer needed…" style="width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;padding:10px;font-size:14px;font-family:Arial,sans-serif;"></textarea>';

const whatHappens = (kind) => kind === 'paid'
  ? 'Your plan will not renew. You keep full access until the end of the period you have already paid for.'
  : 'Your free trial will end right away. Your saved information stays in your account; reply to our email if you would like it deleted.';

// ---- handler --------------------------------------------------------------------------------------
export default async function handler(req, res) {
  try {
    // 1) Signed-in user asks to cancel -> email the confirmation link
    if (req.method === 'POST' && req.query.action === 'request') {
      const bearer = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
      if (!bearer) return res.status(401).json({ error: 'Please sign in again.' });
      const { data: auth, error: authErr } = await supabase.auth.getUser(bearer);
      if (authErr || !auth || !auth.user) return res.status(401).json({ error: 'Session expired. Please sign in again.' });

      const acct = await loadAccount(auth.user.id);
      if (!acct || !acct.email) return res.status(404).json({ error: 'Account not found.' });
      if (acct.kind === 'none') return res.status(400).json({ error: 'There is no active subscription or free trial to cancel.' });
      if (!secret()) return res.status(500).json({ error: 'Cancellation is not configured.' });

      const reason = cleanReason(req.body && req.body.reason);
      const token = sign({ p: 'cancel', u: acct.id, e: Date.now() + TOKEN_TTL_MS });
      const link = `${appUrl()}/api/cancel-subscription?t=${encodeURIComponent(token)}`;
      const name = esc((acct.full_name || '').split(' ')[0] || 'there');

      await sendEmail({
        to: acct.email,
        subject: 'Confirm your Smart Kitchen cancellation',
        text: `Hi ${acct.full_name || 'there'},\n\nWe received a request to cancel your Smart Kitchen ${acct.kind === 'paid' ? 'subscription' : 'free trial'}. Nothing has changed yet.\n\nTo confirm, open this link (valid for 24 hours):\n${link}\n\nIf you did not ask to cancel, just ignore this email and nothing will happen.\n\nIf you are willing, we would really appreciate knowing why — just reply to this email. It helps us improve.\n\nSmart Kitchen`,
        html: shell('Confirm cancellation', `<p>Hi ${name},</p><p>We received a request to cancel your Smart Kitchen ${acct.kind === 'paid' ? 'subscription' : 'free trial'}. <b>Nothing has changed yet.</b></p><p><a href="${esc(link)}" style="${btn}">Confirm my cancellation</a></p><p style="font-size:13px;color:#555;">This link works for 24 hours. If you did not ask to cancel, ignore this email and nothing will happen.</p><p>If you are willing, we would really appreciate knowing why. Just reply to this email, it helps us improve the app.</p>`),
      });
      try {
        await sendEmail({
          to: TEAM_EMAIL, replyTo: acct.email,
          subject: `Smart Kitchen Cancellation REQUESTED — ${acct.email} (${acct.kind === 'paid' ? acct.tier : 'free trial'})`,
          text: `Cancellation requested (awaiting the user's email confirmation)\n\nEmail: ${acct.email}\nName: ${acct.full_name || ''}\nTier: ${acct.tier}\nType: ${acct.kind}\nUser ID: ${acct.id}\n\nReason given in app: ${reason || '(none)'}`,
          html: shell('Cancellation requested', `<p><b>Cancellation requested</b> — waiting for the user to confirm by email.</p><p>Email: <a href="mailto:${esc(acct.email)}">${esc(acct.email)}</a><br>Name: ${esc(acct.full_name || '')}<br>Tier: ${esc(acct.tier)} (${esc(acct.kind)})<br>User ID: ${esc(acct.id)}</p><p>Reason given in app: ${esc(reason) || '<i>none</i>'}</p>`),
        });
      } catch (e) { console.error('cancel: team notice failed:', e.message); }
      return res.status(200).json({ success: true, email: acct.email });
    }

    // 2) Email link opened -> confirmation page (no changes yet)
    if (req.method === 'GET') {
      const p = verify(String(req.query.t || ''));
      if (!p) return page(res, 400, 'Link expired', '<h2>This link has expired</h2><p>For your security, cancellation links work for 24 hours. Please open the app, go to Settings, and request a new one.</p>');
      const acct = await loadAccount(p.u);
      if (!acct || acct.kind === 'none') return page(res, 200, 'Already cancelled', '<h2>Nothing left to cancel</h2><p>This account has no active subscription or free trial.</p>');
      return page(res, 200, 'Confirm cancellation', `<h2>Cancel your Smart Kitchen ${acct.kind === 'paid' ? 'subscription' : 'free trial'}?</h2>
<p>${esc(whatHappens(acct.kind))}</p>
<form method="POST" action="/api/cancel-subscription"><input type="hidden" name="t" value="${esc(req.query.t)}"><input type="hidden" name="action" value="confirm">
<p style="margin-bottom:6px;"><b>Would you tell us why you are leaving?</b> (optional, it helps us improve)</p>${reasonBox}
<p><button type="submit" style="${btn}">Yes, cancel</button></p></form>
<p><a href="${esc(appUrl())}" style="color:#1B3D2F;">No, keep my account</a></p>`);
    }

    // 3) Confirm / reason (form post)
    if (req.method === 'POST') {
      const body = req.body || {};
      const p = verify(String(body.t || ''));
      if (!p) return page(res, 400, 'Link expired', '<h2>This link has expired</h2><p>Please open the app, go to Settings, and request a new cancellation link.</p>');
      const reason = cleanReason(body.reason);
      const acct = await loadAccount(p.u);
      if (!acct) return page(res, 404, 'Not found', '<h2>Account not found</h2>');

      if (body.action === 'reason') {
        try {
          await sendEmail({
            to: TEAM_EMAIL, replyTo: acct.email || TEAM_EMAIL,
            subject: `Smart Kitchen cancellation REASON — ${acct.email}`,
            text: `Reason for cancelling\n\nEmail: ${acct.email}\nTier: ${acct.tier}\n\n${reason || '(blank)'}`,
            html: shell('Cancellation reason', `<p><b>Reason for cancelling</b></p><p>${esc(acct.email)} (${esc(acct.tier)})</p><p style="white-space:pre-wrap;">${esc(reason) || '<i>blank</i>'}</p>`),
          });
        } catch (e) { console.error('cancel: reason email failed:', e.message); }
        return page(res, 200, 'Thank you', '<h2>Thank you</h2><p>That feedback really helps us improve. We wish you and your family well.</p>');
      }

      // action === 'confirm'
      if (acct.kind === 'none') return page(res, 200, 'Already cancelled', '<h2>Already cancelled</h2><p>This account has no active subscription or free trial.</p>');

      const failures = [];
      if (acct.kind === 'paid') {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const ids = [...new Set([acct.stripe_subscription_id, acct.stripe_sws_subscription_id].filter(Boolean))];
        for (const id of ids) {
          try { await stripe.subscriptions.update(id, { cancel_at_period_end: true }); }
          catch (e) { if (!(e && e.code === 'resource_missing')) failures.push(`${id}: ${e.message}`); }
        }
      } else {
        const { error } = await supabase.from('profiles')
          .update({ trial_ends_at: new Date().toISOString(), subscription_status: 'canceled' }).eq('id', acct.id);
        if (error) failures.push('profile update: ' + error.message);
      }

      if (failures.length) {
        console.error('cancel failed for', acct.id, failures);
        try {
          await sendEmail({ to: TEAM_EMAIL, replyTo: acct.email || TEAM_EMAIL, subject: `Smart Kitchen cancellation FAILED — ${acct.email}`,
            text: `The user confirmed a cancellation but it did not complete.\n\nEmail: ${acct.email}\nUser ID: ${acct.id}\nErrors: ${failures.join(' | ')}\nReason: ${reason || '(none)'}`,
            html: shell('Cancellation failed', `<p><b>Cancellation did not complete.</b> Please handle it by hand.</p><p>${esc(acct.email)} — ${esc(acct.id)}</p><p>${esc(failures.join(' | '))}</p>`) });
        } catch (e) { /* ignore */ }
        return page(res, 500, 'Something went wrong', '<h2>We could not finish that</h2><p>Something went wrong on our end. We have been notified and will cancel it for you and email you to confirm.</p>');
      }

      try {
        await sendEmail({
          to: TEAM_EMAIL, replyTo: acct.email || TEAM_EMAIL,
          subject: `Smart Kitchen CANCELLATION CONFIRMED — ${acct.email} (${acct.kind === 'paid' ? acct.tier : 'free trial'})`,
          text: `Cancellation confirmed by the user.\n\nEmail: ${acct.email}\nName: ${acct.full_name || ''}\nTier: ${acct.tier}\nType: ${acct.kind}\nUser ID: ${acct.id}\n\nReason: ${reason || '(none given yet)'}`,
          html: shell('Cancellation confirmed', `<p><b>Cancellation confirmed</b> by the user.</p><p>Email: <a href="mailto:${esc(acct.email)}">${esc(acct.email)}</a><br>Name: ${esc(acct.full_name || '')}<br>Tier: ${esc(acct.tier)} (${esc(acct.kind)})<br>User ID: ${esc(acct.id)}</p><p>Reason: ${esc(reason) || '<i>none given yet</i>'}</p>`),
        });
      } catch (e) { console.error('cancel: team confirmation email failed:', e.message); }
      try {
        if (acct.email) await sendEmail({
          to: acct.email, subject: 'Your Smart Kitchen cancellation is confirmed',
          text: `Your cancellation is confirmed. ${whatHappens(acct.kind)}\n\nIf you did not tell us why, we would really appreciate it — just reply to this email.\n\nThank you for trying Smart Kitchen.`,
          html: shell('Cancellation confirmed', `<p>Your cancellation is confirmed.</p><p>${esc(whatHappens(acct.kind))}</p><p>If you did not tell us why, we would really appreciate it. Just reply to this email.</p><p>Thank you for trying Smart Kitchen.</p>`),
        });
      } catch (e) { console.error('cancel: user confirmation email failed:', e.message); }

      const askReason = reason ? '' : `<form method="POST" action="/api/cancel-subscription"><input type="hidden" name="t" value="${esc(body.t)}"><input type="hidden" name="action" value="reason">
<p style="margin-bottom:6px;"><b>Would you tell us why?</b> (optional, it helps us improve)</p>${reasonBox}<p><button type="submit" style="${btn}">Send feedback</button></p></form>`;
      return page(res, 200, 'Cancelled', `<h2>Your cancellation is confirmed</h2><p>${esc(whatHappens(acct.kind))} We have emailed you a confirmation.</p>${askReason}`);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('cancel-subscription error:', e.message);
    if (req.method === 'POST' && req.query.action === 'request') return res.status(500).json({ error: 'Could not send the confirmation email. Please try again.' });
    return page(res, 500, 'Something went wrong', '<h2>Something went wrong</h2><p>Please try again, or email thesmartkitchenapp@gmail.com and we will take care of it.</p>');
  }
}
