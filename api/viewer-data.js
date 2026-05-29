import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for viewer code lookups
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });

  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 4) return res.status(400).json({ error: 'Invalid code' });

  try {
    // Look up the viewer code
    const { data: codeData, error: codeErr } = await supabase
      .from('viewer_codes')
      .select('owner_user_id, label, active')
      .eq('code', clean)
      .single();

    if (codeErr || !codeData) {
      return res.status(404).json({ error: 'Code not found. Check with your family member.' });
    }
    if (!codeData.active) {
      return res.status(403).json({ error: 'This code has been deactivated.' });
    }

    // Fetch the owner's data using service role (bypasses RLS)
    const { data: userData, error: dataErr } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', codeData.owner_user_id)
      .single();

    if (dataErr || !userData) {
      return res.status(404).json({ error: 'No data found for this account yet.' });
    }

    // Return owner data + owner ID for future refreshes
    return res.status(200).json({
      success: true,
      ownerUserId: codeData.owner_user_id,
      label: codeData.label,
      data: userData
    });

  } catch (err) {
    console.error('Viewer fetch error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
