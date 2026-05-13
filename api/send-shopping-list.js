export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { toEmail, toName, items } = req.body;
  if (!toEmail || !items) return res.status(400).json({ error: 'Missing required fields' });

  const resendKey = process.env.RESEND_API_KEY;

  // Build grouped shopping list
  const grouped = {};
  items.forEach(i => {
    const cat = i.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`${i.qty || 1} ${i.unit || ''} ${i.name}`.trim());
  });

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
      <div style="background:#1A2344;padding:16px 20px;border-radius:8px 8px 0 0;">
        <span style="color:#C8963E;font-size:20px;font-weight:bold;">Smart Kitchen™</span>
        <span style="color:#fff;font-size:14px;margin-left:12px;">Shopping List</span>
      </div>
      <div style="border:1px solid #e2e6ef;border-top:none;border-radius:0 0 8px 8px;padding:20px;">
        ${toName ? `<p style="color:#555;margin-bottom:16px;">Hi ${toName}, here's your shopping list:</p>` : ''}
        ${Object.entries(grouped).map(([cat, list]) => `
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;letter-spacing:1px;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px;">${cat}</div>
            ${list.map(item => `<div style="padding:5px 0;font-size:15px;color:#333;">☐ &nbsp;${item}</div>`).join('')}
          </div>
        `).join('')}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center;">
          Sent from Smart Kitchen™ · smart-kitchen-opal.vercel.app
        </div>
      </div>
    </div>
  `;

  const textBody = Object.entries(grouped)
    .map(([cat, list]) => `${cat.toUpperCase()}\n${list.map(i => '  - ' + i).join('\n')}`)
    .join('\n\n');

  if (!resendKey) {
    // No key configured — return mailto fallback
    return res.status(200).json({
      success: false,
      fallback: true,
      mailtoUrl: `mailto:${toEmail}?subject=${encodeURIComponent('Shopping List - Smart Kitchen')}&body=${encodeURIComponent(textBody)}`
    });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Smart Kitchen <onboarding@resend.dev>',
        to: [toEmail],
        subject: '🛒 Your Smart Kitchen Shopping List',
        html: htmlBody,
        text: textBody
      })
    });

    const data = await r.json();

    if (data.id) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Resend error:', JSON.stringify(data));
      return res.status(200).json({
        success: false,
        fallback: true,
        mailtoUrl: `mailto:${toEmail}?subject=${encodeURIComponent('Shopping List - Smart Kitchen')}&body=${encodeURIComponent(textBody)}`
      });
    }
  } catch (e) {
    console.error('Email send error:', e.message);
    return res.status(200).json({
      success: false,
      fallback: true,
      mailtoUrl: `mailto:${toEmail}?subject=${encodeURIComponent('Shopping List - Smart Kitchen')}&body=${encodeURIComponent(textBody)}`
    });
  }
}
