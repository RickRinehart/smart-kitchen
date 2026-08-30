import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

// Horrocks Weekly Specials ingestion — triggered daily by Vercel Cron.
// Horrocks is the only surveyed retailer that's genuinely automatable end-to-end:
// a clean plain-text email (graphics@horrocksmarket.com) with a consistent
// "Item Name.....$Price unit" line format, no OCR or layout parsing needed.
// See SmartKitchen_SmarterWayToShop_RealDataFindings_Aug2026.docx, finding 1.

const HORROCKS_STORE_NAME = 'Horrocks Market (Kentwood)';

// Food/grocery departments feed Smart Kitchen's own canonical_key matching and comparison
// logic. TAVERN (wine/beer/cider) is included too, but tagged separately via the
// `department` column -- Smart Cellar already connects to Smart Kitchen for Pair a Drink
// and cooking-ingredient use, so its own future consumption of Tavern sale data can filter
// this same table by department='tavern' rather than needing a separate ingestion path.
// FLORAL and GIFT and GARDEN remain excluded -- not relevant to either app.
const INCLUDED_DEPARTMENTS = ['PRODUCE', 'MEAT', 'DELI', 'GROCERY', 'TAVERN'];

const MONTHS = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, SEPT: 8, OCT: 9, NOV: 10, DEC: 11,
};

// Extracts the effective date range from the email's own header line, e.g.
// "** SUN. AUG 30 - SAT. SEPT 5, 2026" — never guessed, left null if not found.
function parseDateRange(body) {
  const m = body.match(
    /\*\*\s*[A-Z]+\.?\s*([A-Z]+)\s+(\d{1,2})\s*-\s*[A-Z]+\.?\s*([A-Z]+)\s+(\d{1,2}),\s*(\d{4})/
  );
  if (!m) return { start: null, end: null };
  const [, mon1, day1, mon2, day2, year] = m;
  const idx = (mon) => MONTHS[mon.slice(0, 4).toUpperCase()] ?? MONTHS[mon.slice(0, 3).toUpperCase()];
  const mi1 = idx(mon1), mi2 = idx(mon2);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    start: mi1 != null ? `${year}-${pad(mi1 + 1)}-${pad(day1)}` : null,
    end: mi2 != null ? `${year}-${pad(mi2 + 1)}-${pad(day2)}` : null,
  };
}

// Splits the email body into department sections by its "** SECTION NAME\n----" header
// pattern. Handles the occasional "**\nSECTION NAME\n----" split-line variant seen in the
// live email (e.g. the GARDEN header). Everything between one header and the next belongs
// to that department, including any promotional sub-header lines within it — those simply
// won't match the item-line pattern below and get skipped naturally.
function splitDepartments(body) {
  const re = /\*\*\s*\r?\n?\s*([A-Za-z][A-Za-z &']{2,30}?)\r?\n-{5,}/g;
  const sections = [];
  let match, lastIndex = null, lastName = null;
  while ((match = re.exec(body))) {
    if (lastName) sections.push({ name: lastName.trim(), text: body.slice(lastIndex, match.index) });
    lastName = match[1];
    lastIndex = re.lastIndex;
  }
  if (lastName) sections.push({ name: lastName.trim(), text: body.slice(lastIndex) });
  return sections;
}

// Parses one line into {name, regular_price, unit_size, notes} or returns null if the line
// isn't a dot-leader price line at all (event listings, descriptive copy, etc. are skipped
// this way without needing a separate exclusion list).
//
// Three price shapes are handled explicitly; anything else is left unparsed on purpose
// rather than guessed at:
//   "$1.99 ea."          -> straightforward single price
//   "99¢ bunch"           -> cents-only price
//   "2/$5 5 lb. bag"      -> clean multi-buy, computed to a per-unit price (5/2 = $2.50),
//                            with the original "2 for $5" kept in notes for transparency
//   "$3.79 ea. OR $37.99 dozen" -> genuinely different purchase options (not a discount
//                            tier), left as regular_price=null with the full raw text in
//                            notes rather than collapsing two different SKUs into one number
function parseItemLine(line) {
  const dotMatch = line.match(/^(.+?)\.{2,}\s*(.+)$/);
  if (!dotMatch) return null;
  const name = dotMatch[1].trim();
  const priceText = dotMatch[2].trim();
  if (!name || name.length < 3) return null;

  if (/\bOR\b/i.test(priceText)) {
    return { name, regular_price: null, unit_size: null, notes: `Multiple pricing options, needs manual review: "${priceText}"` };
  }
  let m;
  if ((m = priceText.match(/^(\d+)\s*\/\s*\$([\d.]+)\s*(.*)$/))) {
    const qty = parseFloat(m[1]), total = parseFloat(m[2]);
    if (!qty) return null;
    return {
      name,
      regular_price: +(total / qty).toFixed(2),
      unit_size: m[3].trim() || null,
      notes: `Multi-buy: ${qty} for $${total.toFixed(2)}`,
    };
  }
  if ((m = priceText.match(/^(\d+)\s*¢\s*(.*)$/))) {
    return { name, regular_price: +(parseInt(m[1], 10) / 100).toFixed(2), unit_size: m[2].trim() || null, notes: null };
  }
  if ((m = priceText.match(/^\$([\d.]+)\s*(.*)$/))) {
    return { name, regular_price: parseFloat(m[1]), unit_size: m[2].trim() || null, notes: null };
  }
  return null; // unrecognized price format -- left out rather than guessed
}

export default async function handler(req, res) {
  const cronAction = req.method === 'GET' ? req.query.action : null;
  if (cronAction !== 'ingest-horrocks') return res.status(405).end();

  // Same auth pattern as the existing check-recalls cron action.
  const authHeader = req.headers['authorization'] || '';
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: store, error: storeErr } = await supabaseAdmin
    .from('partner_stores')
    .select('id')
    .eq('name', HORROCKS_STORE_NAME)
    .single();
  if (storeErr || !store) {
    return res.status(500).json({ error: 'Horrocks partner_stores row not found', detail: storeErr?.message });
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_IMAP_USER,
      pass: process.env.GMAIL_IMAP_APP_PASSWORD,
    },
    logger: false,
  });

  let plaintextBody = '', emailDate = null;
  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000); // 12-day window, safe margin
      const uids = await client.search({ from: 'graphics@horrocksmarket.com', since });
      if (!uids || uids.length === 0) {
        return res.status(200).json({ ok: true, message: 'No Horrocks email found in search window.' });
      }
      const latestUid = uids[uids.length - 1];
      const msg = await client.fetchOne(latestUid, { source: true });
      const parsed = await simpleParser(msg.source);
      plaintextBody = parsed.text || '';
      emailDate = parsed.date;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  const { start, end } = parseDateRange(plaintextBody);

  // Idempotent by design -- safe to run daily even though Horrocks only sends weekly.
  // Re-scanning the same week's email a second time before dedupe-checking would
  // otherwise duplicate every row, so this check runs before any parsing continues.
  if (start && end) {
    const { data: existing } = await supabaseAdmin
      .from('partner_ads')
      .select('id')
      .eq('partner_store_id', store.id)
      .eq('sale_start', start)
      .eq('sale_end', end)
      .limit(1);
    if (existing && existing.length > 0) {
      return res.status(200).json({ ok: true, message: `Week ${start} to ${end} already ingested, skipping.` });
    }
  }

  const sections = splitDepartments(plaintextBody);
  const rows = [];
  for (const section of sections) {
    if (!INCLUDED_DEPARTMENTS.includes(section.name.toUpperCase())) continue;
    const lines = section.text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const item = parseItemLine(line);
      if (!item) continue;
      rows.push({
        partner_store_id: store.id,
        item_name: item.name,
        canonical_key: null, // assigned later by the matching bridge, not at ingestion time
        regular_price: item.regular_price,
        department: section.name.toUpperCase(),
        unit_size: item.unit_size,
        sale_start: start,
        sale_end: end,
        source: 'email',
        entered_by: 'ingest-horrocks-cron',
        notes: item.notes,
      });
    }
  }

  if (rows.length === 0) {
    return res.status(200).json({ ok: true, message: 'Email found but no parseable items extracted.', emailDate });
  }

  const { error: insertErr } = await supabaseAdmin.from('partner_ads').insert(rows);
  if (insertErr) return res.status(500).json({ error: 'Insert failed', detail: insertErr.message });

  return res.status(200).json({ ok: true, inserted: rows.length, sale_start: start, sale_end: end });
}
