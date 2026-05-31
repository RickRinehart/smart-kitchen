export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { toPhone, items, fromName } = req.body;
  if (!toPhone || !items) return res.status(400).json({ error: 'Missing required fields' });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone  = process.env.TWILIO_PHONE_NUMBER;

  // Build clean SMS text — grouped by category, scannable
  const grouped = {};
  items.forEach(i => {
    const cat = i.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    const qty  = i.qty  ? String(i.qty)  : '1';
    const unit = i.unit ? ' ' + i.unit   : '';
    grouped[cat].push(`- ${qty}${unit} ${i.name}`.trim());
  });

  const listText = Object.entries(grouped)
    .map(([cat, lines]) => `${cat.toUpperCase()}\n${lines.join('\n')}`)
    .join('\n\n');

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
