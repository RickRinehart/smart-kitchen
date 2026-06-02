export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { recipes, title, ownerName, ownerUid } = req.body;
    if (!recipes || (Array.isArray(recipes) ? !recipes.length : !Object.keys(recipes).length)) {
      return res.status(400).json({ error: 'No recipes provided' });
    }

    // Try all possible env var names Vercel might expose
    const supabaseUrl = 'https://wnlqvmedocpgjawmwivd.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_KEY ||
                        process.env.VITE_SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_ANON_KEY ||
                        process.env.SUPABASE_KEY;

    if (!supabaseKey) {
      console.error('No Supabase key found in env vars');
      return res.status(500).json({ error: 'Server configuration error — missing key' });
    }

    // Generate 6-char share code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

    // Normalize recipes — handle both array and object formats
    const recipeArray = Array.isArray(recipes) ? recipes : Object.values(recipes);

    const cleanRecipes = recipeArray.map(r => ({
      id: String(r.id || Date.now() + Math.random()),
      name: r.name || 'Unnamed Recipe',
      description: r.description || '',
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      time: r.time || '',
      difficulty: r.difficulty || '',
      notes: r.notes || '',
      isFamilyRecipe: r.isFamilyRecipe || false,
      kitchenOf: r.kitchenOf || '',
      rating: r.rating || 0,
      sharedBy: ownerName || 'A Smart Kitchen user',
    }));

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const response = await fetch(`${supabaseUrl}/rest/v1/shared_recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        share_code: code,
        owner_uid: ownerUid || null,
        owner_name: ownerName || 'Smart Kitchen User',
        title: title || 'Shared Recipes',
        recipes: cleanRecipes,
        recipe_count: cleanRecipes.length,
        expires_at: expiresAt.toISOString(),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase error:', response.status, errText.slice(0, 200));
      return res.status(500).json({ error: 'Could not save — ' + errText.slice(0, 80) });
    }

    const data = await response.json();
    const record = Array.isArray(data) ? data[0] : data;
    const shareUrl = `https://smart-kitchen-opal.vercel.app?import=${record.share_code}`;

    return res.status(200).json({ success: true, code: record.share_code, url: shareUrl });

  } catch (e) {
    console.error('share-recipes error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
