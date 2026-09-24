import { createClient } from '@supabase/supabase-js';

// Service role client -- required to both verify the caller's access token and write past RLS,
// since sendBeacon requests carry no custom headers (no Authorization header is possible), only
// a plain POST body. The access token travels in that body instead and is verified here before
// anything is trusted from it.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { access_token, row } = req.body || {};
    if (!access_token || !row) {
      return res.status(400).json({ error: 'Missing access_token or row' });
    }

    // Verify the token server-side and derive the real user id from it -- never trust a
    // client-supplied user_id, since a beacon request has no other authentication on it.
    const { data: userData, error: authErr } = await supabase.auth.getUser(access_token);
    if (authErr || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const safeRow = { ...row, user_id: userData.user.id, updated_at: new Date().toISOString() };

    const { error } = await supabase
      .from('user_data')
      .upsert(safeRow, { onConflict: 'user_id' });

    if (error) {
      console.error('Beacon save failed:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Beacon save error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
