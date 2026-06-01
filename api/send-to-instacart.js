export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { items, apiKey, title } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

  // No API key — return search fallback URL
  if (!apiKey) {
    const terms = items.slice(0, 10).map(i => encodeURIComponent(i.name || i)).join('+');
    const fallbackUrl = `https://www.instacart.com/store/search_v3/term?term=${terms}`;
    return res.status(200).json({ success: false, fallback: true, url: fallbackUrl });
  }

  // Build Instacart Developer Platform shopping list
  const lineItems = items
    .filter(i => i.name)
    .map(i => ({
      name: i.name,
      quantity: parseFloat(i.qty) || 1,
      unit: i.unit || null,
      filters: { brand_filters: [], health_filters: [] }
    }));

  try {
    const r = await fetch('https://connect.instacart.com/idp/v1/products/shopping_list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: title || 'Smart Kitchen Shopping List',
        image_url: 'https://smart-kitchen-opal.vercel.app/icons.svg',
        link_type: 'shopping_list',
        line_items: lineItems,
        expires_in: 7
      })
    });

    const data = await r.json();

    if (data.url) {
      return res.status(200).json({ success: true, url: data.url });
    }

    // API returned error — fall back to search
    console.error('Instacart API error:', JSON.stringify(data));
    const terms = items.slice(0, 10).map(i => encodeURIComponent(i.name || i)).join('+');
    return res.status(200).json({
      success: false, fallback: true,
      url: `https://www.instacart.com/store/search_v3/term?term=${terms}`,
      error: data.message || 'Instacart API error'
    });

  } catch (e) {
    console.error('Instacart fetch error:', e.message);
    const terms = items.slice(0, 10).map(i => encodeURIComponent(i.name || i)).join('+');
    return res.status(200).json({
      success: false, fallback: true,
      url: `https://www.instacart.com/store/search_v3/term?term=${terms}`
    });
  }
}
