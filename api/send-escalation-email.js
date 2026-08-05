export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userName, tier, tag, userMsg, profile } = req.body;

  if (!tag || !userMsg) return res.status(400).json({ error: 'Missing required fields' });

  const resendKey = process.env.RESEND_API_KEY;

  const tagColors = {
    'Bug': '#dc2626',
    'Scanner-Issue': '#dc2626',
    'Dietary-Concern': '#b91c1c',
    'Upgrade-Objection': '#d97706',
    'Confusion': '#3b82f6',
    'Feature-Request': '#10b981',
    'Feedback-Negative': '#dc2626',
  };
  const tagColor = tagColors[tag] || '#888';

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
    <div style="background:#1A2344;padding:20px;border-radius:8px 8px 0 0;">
      <span style="color:#C8963E;font-size:22px;font-weight:bold;">Smart Kitchen&#8482;</span>
      <span style="color:#fff;font-size:15px;margin-left:12px;">Support Escalation</span>
    </div>
    <div style="border:1px solid #e2e6ef;border-top:none;border-radius:0 0 8px 8px;padding:22px;">
      <div style="display:inline-block;background:${tagColor}18;border:1px solid ${tagColor}55;color:${tagColor};font-weight:bold;font-size:12px;padding:5px 12px;border-radius:20px;margin-bottom:16px;">${tag}</div>
      <table width="100%" style="border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 0;color:#888;font-size:12px;width:90px;">User</td><td style="padding:4px 0;color:#333;font-size:13px;font-weight:bold;">${userName || 'Unknown'}</td></tr>
        <tr><td style="padding:4px 0;color:#888;font-size:12px;">Tier</td><td style="padding:4px 0;color:#333;font-size:13px;">${tier || 'Unknown'}</td></tr>
      </table>
      <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;letter-spacing:1px;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px;">Message</div>
      <div style="background:#f9f9f9;border-left:4px solid ${tagColor};padding:12px 14px;border-radius:0 6px 6px 0;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;margin-bottom:18px;">${(userMsg || '').replace(/</g,'&lt;')}</div>
      ${profile ? `<div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#888;letter-spacing:1px;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px;">Household Profile</div>
      <div style="color:#555;font-size:12px;line-height:1.6;white-space:pre-wrap;margin-bottom:8px;">${profile.replace(/</g,'&lt;')}</div>` : ''}
      <div style="margin-top:20px;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#aaa;text-align:center;">
        Auto-escalated from in-app support chat &middot; smart-kitchen-opal.vercel.app
      </div>
    </div>
  </body></html>`;

  const textBody = `Smart Kitchen Support Escalation\nTag: ${tag}\nUser: ${userName || 'Unknown'}\nTier: ${tier || 'Unknown'}\n\nMessage:\n${userMsg}\n${profile ? `\nProfile:\n${profile}` : ''}`;

  if (!resendKey) {
    console.error('send-escalation-email: Missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Smart Kitchen <noreply@rinehartra.com>',
        to: ['thesmartkitchenapp@gmail.com'],
        subject: `Smart Kitchen ${tag} — ${userName || 'Unknown user'} (${tier || 'Unknown'})`,
        html,
        text: textBody,
        tags: [{ name: 'category', value: 'support-escalation' }]
      })
    });

    const data = await r.json();

    if (data.id) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Resend error (escalation):', JSON.stringify(data));
      return res.status(500).json({ error: data.message || 'Send failed' });
    }
  } catch (e) {
    console.error('Escalation email send error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
