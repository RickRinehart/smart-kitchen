export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'No share code provided' });

    const supabaseUrl = 'https://wnlqvmedocpgjawmwivd.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_KEY ||
                        process.env.VITE_SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/shared_recipes?share_code=eq.${code.toUpperCase()}&expires_at=gt.${new Date().toISOString()}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    if (!response.ok) return res.status(404).json({ error: 'Share not found' });

    const data = await response.json();
    if (!data?.length) return res.status(404).json({ error: 'Share link not found or expired' });

    // Increment views async
    fetch(`${supabaseUrl}/rest/v1/shared_recipes?share_code=eq.${code.toUpperCase()}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`,
                 'Content-Type': 'application/json' },
      body: JSON.stringify({ views: (data[0].views || 0) + 1 })
    }).catch(() => {});

    return res.status(200).json({ success: true, share: data[0] });

  } catch (e) {
    console.error('get-shared-recipes error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
