import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { recipes, title, ownerName, ownerUid } = req.body;
  if (!recipes?.length) return res.status(400).json({ error: 'No recipes provided' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  // Generate a memorable 6-char share code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  // Strip photos to keep payload small
  const cleanRecipes = recipes.map(r => ({
    id: r.id || Date.now() + Math.random(),
    name: r.name,
    description: r.description || '',
    ingredients: r.ingredients || [],
    steps: r.steps || [],
    time: r.time || '',
    difficulty: r.difficulty || '',
    notes: r.notes || '',
    isFamilyRecipe: r.isFamilyRecipe || false,
    rating: r.rating || 0,
    sharedBy: ownerName || 'A Smart Kitchen user',
  }));

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days

  const { data, error } = await supabase
    .from('shared_recipes')
    .insert({
      share_code: code,
      owner_uid: ownerUid || null,
      owner_name: ownerName || 'Smart Kitchen User',
      title: title || 'Shared Recipes',
      recipes: cleanRecipes,
      recipe_count: cleanRecipes.length,
      expires_at: expiresAt.toISOString(),
    })
    .select('share_code')
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Could not create share link' });
  }

  const shareUrl = `https://smart-kitchen-opal.vercel.app/shared/${data.share_code}`;
  return res.status(200).json({ success: true, code: data.share_code, url: shareUrl });
}
