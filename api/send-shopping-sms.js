export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { toPhone, items, fromName } = req.body;
  if (!toPhone || !items) return res.status(400).json({ error: 'Missing required fields' });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = process.env.TWILIO_PHONE_NUMBER;

  // If items carry an assigned store, group by store (then category within) with subtotals and
  // per-item price -- mirrors the on-screen and emailed versions -- otherwise fall back to the
  // plain category grouping.
  const hasAssignedStore = items.some(i => i.assignedStore);
  let listText;

  const groupByCategory = (list) => {
    const g = {};
    list.forEach(i => {
      const cat = i.category || 'Other';
      if (!g[cat]) g[cat] = [];
      const qty  = i.qty  ? String(i.qty)  : '1';
      const unit = i.unit ? ' ' + i.unit   : '';
      g[cat].push(`- ${qty}${unit} ${i.name}`.trim() + (i.assignedPrice != null ? ` — $${i.assignedPrice.toFixed(2)}` : ''));
    });
    return g;
  };

  if (hasAssignedStore) {
    const priced = items.filter(i => i.assignedStore);
    const unpriced = items.filter(i => !i.assignedStore);
    const storeNames = [...new Set(priced.map(i => i.assignedStore))];
    const storeGroups = storeNames.map(store => {
      const storeItems = priced.filter(i => i.assignedStore === store);
      const total = storeItems.reduce((sum, i) => sum + (i.assignedPrice || 0), 0);
      return { store, items: storeItems, total };
    }).sort((a, b) => b.items.length - a.items.length || b.total - a.total);

    listText = storeGroups.map(({ store, items: storeItems, total }) => {
      const grouped = groupByCategory(storeItems);
      return `${store.toUpperCase()} (${storeItems.length} items · $${total.toFixed(2)})\n` +
        Object.entries(grouped).map(([cat, lines]) => `${cat.toUpperCase()}\n${lines.join('\n')}`).join('\n');
    }).join('\n\n');

    if (unpriced.length > 0) {
      const grouped = groupByCategory(unpriced);
      listText += `\n\nNOT YET PRICED\n` + Object.entries(grouped).map(([cat, lines]) => `${cat.toUpperCase()}\n${lines.join('\n')}`).join('\n');
    }
  } else {
    const grouped = groupByCategory(items);
    listText = Object.entries(grouped)
      .map(([cat, lines]) => `${cat.toUpperCase()}\n${lines.join('\n')}`)
      .join('\n\n');
  }

  const body = `Smart Kitchen Shopping List${fromName ? ' for ' + fromName : ''}:\n\n${listText}\n\n-- Smart Kitchen`;

  // Twilio not configured — return SMS fallback (sms: link)
  if (!accountSid || !authToken || !fromPhone) {
    const smsUrl = `sms:${toPhone}?body=${encodeURIComponent(body)}`;
    return res.status(200).json({ success: false, fallback: true, smsUrl });
  }

  // Normalize phone — strip non-digits, add +1 if needed
  let phone = toPhone.replace(/\D/g, '');
  if (phone.length === 10) phone = '1' + phone;
  if (!phone.startsWith('+')) phone = '+' + phone;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ From: fromPhone, To: phone, Body: body }).toString()
      }
    );

    const data = await r.json();

    if (data.sid) {
      return res.status(200).json({ success: true, sid: data.sid });
    } else {
      console.error('Twilio error:', JSON.stringify(data));
      // Graceful fallback to native SMS app
      const smsUrl = `sms:${toPhone}?body=${encodeURIComponent(body)}`;
      return res.status(200).json({ success: false, fallback: true, smsUrl });
    }
  } catch (e) {
    console.error('SMS send error:', e.message);
    const smsUrl = `sms:${toPhone}?body=${encodeURIComponent(body)}`;
    return res.status(200).json({ success: false, fallback: true, smsUrl });
  }
}
