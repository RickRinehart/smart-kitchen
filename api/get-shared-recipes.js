import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No share code provided' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('shared_recipes')
    .select('share_code, owner_name, title, recipes, recipe_count, created_at, expires_at')
    .eq('share_code', code.toUpperCase())
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Share link not found or expired' });
  }

  // Increment view count
  await supabase
    .from('shared_recipes')
    .update({ views: (data.views || 0) + 1 })
    .eq('share_code', code.toUpperCase());

  return res.status(200).json({ success: true, share: data });
}
