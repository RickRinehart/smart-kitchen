import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

// Server-side proxy for every Claude call the app makes. The Anthropic key lives ONLY here, as a
// non-VITE env var (ANTHROPIC_API_KEY), so it is never shipped to the browser. The browser sends
// {system, messages, max_tokens}; the MODEL is chosen here (env AI_MODEL) so it can be changed or
// rolled back from Vercel settings without a code change.
//
// Who may call it:
//  - signed-in users: Supabase token verified, generous per-user hourly limit;
//  - guests (the app is usable before sign-up): allowed, but with a stricter per-IP hourly limit
//    plus a daily cap across ALL guests, so a stranger can't run up the bill.
// Counters live in Supabase (ai_rate_check, see supabase_ai_rate_limit.sql) because serverless
// memory is not shared between invocations.

const DEFAULT_MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS_CAP = 16000;       // the ad-PDF extraction asks for 16000
const MAX_MESSAGES = 30;
const ALLOWED_BLOCK_TYPES = new Set(['text', 'image', 'document']);
const UPSTREAM_TIMEOUT_MS = 115000; // just under maxDuration (120s) in vercel.json

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || String(req.headers['x-real-ip'] || '') || 'unknown';
}

function validBody(b) {
  if (!b || typeof b !== 'object') return 'Invalid request';
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX_MESSAGES) return 'Invalid messages';
  for (const m of b.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return 'Invalid message role';
    if (typeof m.content === 'string') continue;
    if (!Array.isArray(m.content) || m.content.length === 0) return 'Invalid message content';
    for (const blk of m.content) {
      if (!blk || !ALLOWED_BLOCK_TYPES.has(blk.type)) return 'Unsupported content type';
    }
  }
  if (b.system !== undefined && typeof b.system !== 'string') return 'Invalid system prompt';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'proxy_not_configured' });

  const body = req.body;
  const problem = validBody(body);
  if (problem) return res.status(400).json({ error: problem });

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Who is calling?
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  let user = null;
  if (token) {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      user = !error && data ? data.user : null;
    } catch (e) { user = null; }
    // A token was presented but is bad/expired: refuse rather than silently treating them as a guest.
    if (!user) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  // Rate limits
  const check = async (bucket, limit, windowSeconds) => {
    const { data, error } = await supabaseAdmin.rpc('ai_rate_check', {
      p_bucket: bucket, p_limit: limit, p_window_seconds: windowSeconds,
    });
    if (error) throw new Error(error.message);
    return data === true;
  };
  try {
    if (user) {
      const ok = await check('user:' + user.id, num(process.env.AI_USER_LIMIT_PER_HOUR, 200), 3600);
      if (!ok) return res.status(429).json({ error: 'rate_limited' });
    } else {
      const ipHash = createHash('sha256').update(clientIp(req) + (process.env.CRON_SECRET || '')).digest('hex').slice(0, 32);
      const okIp = await check('ip:' + ipHash, num(process.env.AI_GUEST_LIMIT_PER_HOUR, 30), 3600);
      if (!okIp) return res.status(429).json({ error: 'rate_limited' });
      const okAll = await check('guests-global', num(process.env.AI_GUEST_GLOBAL_PER_DAY, 1500), 86400);
      if (!okAll) return res.status(429).json({ error: 'rate_limited' });
    }
  } catch (e) {
    console.error('ai rate-limit check failed:', e.message);
    // If the counter itself is broken: keep signed-in people working, but don't leave guests unmetered.
    if (!user) return res.status(503).json({ error: 'temporarily_unavailable' });
  }

  const payload = {
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    max_tokens: Math.min(num(body.max_tokens, 1000), MAX_TOKENS_CAP),
    messages: body.messages,
  };
  if (body.system) payload.system = body.system;

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = e && (e.name === 'TimeoutError' || e.name === 'AbortError');
    console.error('ai upstream fetch failed:', e && e.message);
    return res.status(timedOut ? 504 : 502).json({ error: timedOut ? 'upstream_timeout' : 'upstream_unreachable' });
  }

  let data;
  try { data = await upstream.json(); } catch (e) { data = null; }
  if (!upstream.ok || !data) {
    console.error('ai upstream error', upstream.status, data && data.error && data.error.type, data && data.error && data.error.message);
    // Pass Anthropic's error shape through (the client already reads data.error.message) without ever echoing keys.
    return res.status(upstream.status >= 400 ? upstream.status : 502).json({ error: (data && data.error) || { message: 'AI service error' } });
  }
  // Newer models can prepend a "thinking" block. The app only ever wants the text, so hand back text
  // blocks only (keeps every caller simple and safe, even ones that read content[0]).
  const textOnly = Array.isArray(data.content) ? data.content.filter((b) => b && b.type === 'text') : [];
  return res.status(200).json({ ...data, content: textOnly });
}
