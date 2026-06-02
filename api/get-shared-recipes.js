export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'No share code provided' });

    const supabaseUrl = 'https://wnlqvmedocpgjawmwivd.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_KEY ||
                        process.env.VITE_SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_KEY;

    if (!supabaseKey) {
      console.error('Missing Supabase key');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    console.log('Looking up share code:', cleanCode);

    // Query WITHOUT expires_at filter first to debug
    const url = `${supabaseUrl}/rest/v1/shared_recipes?share_code=eq.${cleanCode}&select=*`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log('Supabase response status:', response.status);
    console.log('Supabase response text:', responseText.slice(0, 200));

    if (!response.ok) {
      return res.status(404).json({ error: 'Could not query database: ' + responseText.slice(0, 100) });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch(e) {
      console.error('JSON parse error:', e.message, 'Response was:', responseText.slice(0, 100));
      return res.status(500).json({ error: 'Invalid database response' });
    }

    if (!data || !data.length) {
      return res.status(404).json({ error: 'Share code not found or expired. Please check and try again.' });
    }

    const record = data[0];

    // Check expiry
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return res.status(404).json({ error: 'This share link has expired.' });
    }

    // Increment views async (fire and forget)
    fetch(`${supabaseUrl}/rest/v1/shared_recipes?share_code=eq.${cleanCode}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ views: (record.views || 0) + 1 })
    }).catch(() => {});

    return res.status(200).json({ success: true, share: record });

  } catch (e) {
    console.error('get-shared-recipes error:', e.message, e.stack);
    return res.status(500).json({ error: 'Server error: ' + e.message });
  }
}
