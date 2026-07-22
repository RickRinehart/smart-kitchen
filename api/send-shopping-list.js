export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action } = req.body;

  // ── Nutrition Report action ──────────────────────────────────────────────
  if (action === 'nutrition-report') {
    const { toEmail, memberName, dateRange, dailyData, weeklyAvgs, narrative, bpReadings } = req.body;
    if (!toEmail) return res.status(400).json({ error: 'Missing email' });
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

    const rowsHtml = (dailyData||[]).map(d => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:6px 10px;font-size:12px;color:#333;">${d.date}</td>
        <td style="padding:6px 10px;font-size:12px;color:#3b82f6;text-align:center;">${d.protein_g}g</td>
        <td style="padding:6px 10px;font-size:12px;color:#f59e0b;text-align:center;">${d.calories}</td>
        <td style="padding:6px 10px;font-size:12px;color:#22c55e;text-align:center;">${d.carbs_g}g</td>
        <td style="padding:6px 10px;font-size:12px;color:#ef4444;text-align:center;">${d.sat_fat_g}g</td>
        <td style="padding:6px 10px;font-size:12px;color:#8b5cf6;text-align:center;">${d.fiber_g}g</td>
      </tr>`).join('');

    const bpCatColors = { Normal: '#22c55e', Elevated: '#eab308', 'Stage 1': '#f59e0b', 'Stage 2': '#dc2626', Crisis: '#7f1d1d' };
    const bpRowsHtml = (bpReadings||[]).map(b => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:6px 10px;font-size:12px;color:#333;">${b.date}</td>
        <td style="padding:6px 10px;font-size:12px;color:#333;text-align:center;">${b.systolic}/${b.diastolic}${b.pulse ? ' &middot; '+b.pulse+' bpm' : ''}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:center;color:${bpCatColors[b.category]||'#333'};font-weight:bold;">${b.category||''}</td>
      </tr>`).join('');
    const bpSectionHtml = (bpReadings && bpReadings.length > 0) ? `
        <div style="font-weight:bold;color:#1A2344;margin:20px 0 12px;">Blood Pressure</div>
        <table width="100%" style="border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee;margin-bottom:8px;">
          <thead><tr style="background:#1A2344;">
            <th style="padding:8px 10px;color:#fff;font-size:12px;text-align:left;">Date</th>
            <th style="padding:8px 10px;color:#fff;font-size:12px;">Reading</th>
            <th style="padding:8px 10px;color:#fff;font-size:12px;">Category</th>
          </tr></thead>
          <tbody>${bpRowsHtml}</tbody>
        </table>
        <p style="font-size:10px;color:#999;margin-bottom:16px;">Categories follow standard clinical ranges for informational purposes. Your physician is the final authority on your health &mdash; Smart Kitchen only assists with day-to-day implementation.</p>` : '';

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#1A2344;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <div style="color:#C8963E;font-size:24px;font-weight:bold;">Smart Kitchen&#8482;</div>
        <div style="color:#fff;font-size:16px;margin-top:4px;">Nutrition Report</div>
        <div style="color:#aaa;font-size:13px;margin-top:4px;">${memberName||'Member'} &bull; ${dateRange||''}</div>
      </div>
      <div style="background:#f9f9f9;border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
        ${narrative ? `<div style="background:#e8f5e9;border-left:4px solid #10b981;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
          <div style="font-weight:bold;color:#10b981;margin-bottom:6px;">Weekly Summary</div>
          <div style="color:#333;font-size:14px;line-height:1.6;">${narrative}</div>
        </div>` : ''}
        <div style="font-weight:bold;color:#1A2344;margin-bottom:12px;">Daily Breakdown</div>
        <table width="100%" style="border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee;">
          <thead><tr style="background:#1A2344;">
            <th style="padding:8px 10px;color:#fff;font-size:12px;text-align:left;">Date</th>
            <th style="padding:8px 10px;color:#3b82f6;font-size:12px;">Protein</th>
            <th style="padding:8px 10px;color:#f59e0b;font-size:12px;">Calories</th>
            <th style="padding:8px 10px;color:#22c55e;font-size:12px;">Carbs</th>
            <th style="padding:8px 10px;color:#ef4444;font-size:12px;">Sat.Fat</th>
            <th style="padding:8px 10px;color:#8b5cf6;font-size:12px;">Fiber</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
          ${weeklyAvgs ? `<tfoot><tr style="background:#f0f0f0;font-weight:bold;">
            <td style="padding:8px 10px;font-size:12px;">7-Day Avg</td>
            <td style="padding:8px 10px;font-size:12px;color:#3b82f6;text-align:center;">${weeklyAvgs.protein_g}g</td>
            <td style="padding:8px 10px;font-size:12px;color:#f59e0b;text-align:center;">${weeklyAvgs.calories}</td>
            <td style="padding:8px 10px;font-size:12px;color:#22c55e;text-align:center;">${weeklyAvgs.carbs_g}g</td>
            <td style="padding:8px 10px;font-size:12px;color:#ef4444;text-align:center;">${weeklyAvgs.sat_fat_g}g</td>
            <td style="padding:8px 10px;font-size:12px;color:#8b5cf6;text-align:center;">${weeklyAvgs.fiber_g}g</td>
          </tr></tfoot>` : ''}
        </table>
        ${bpSectionHtml}
        <p style="font-size:11px;color:#999;margin-top:20px;text-align:center;">Self-reported nutritional data tracked via Smart Kitchen Medical+. For guidance only. Always consult your healthcare provider. Not medical advice.</p>
        <p style="font-size:11px;color:#C8963E;text-align:center;margin-top:8px;">smart-kitchen-opal.vercel.app</p>
      </div>
    </body></html>`;

    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Smart Kitchen <noreply@rinehartra.com>',
          to: [toEmail],
          subject: `Your Nutrition Report - ${memberName||'Smart Kitchen'} - ${dateRange||''}`,
          html
        })
      });
      const result = await r.json();
      if (result.id) return res.status(200).json({ success: true });
      return res.status(500).json({ error: result.message||'Send failed' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Shopping List action (original) ─────────────────────────────────────
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
        from: 'Smart Kitchen <noreply@rinehartra.com>',
        reply_to: 'thesmartkitchenapp@gmail.com',
        to: [toEmail],
        subject: 'Your Smart Kitchen Shopping List',
        html: htmlBody,
        text: textBody,
        tags: [{ name: 'category', value: 'shopping-list' }]
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
