export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, tag } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const server = process.env.MAILCHIMP_SERVER || 'us9';

  const [firstName, ...rest] = (name || '').split(' ');
  const lastName = rest.join(' ') || '';

  const data = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      FNAME: firstName || '',
      LNAME: lastName || '',
    },
    tags: [tag || 'trial'],
  };

  try {
    const response = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    // 400 with title "Member Exists" is fine — they're already in the list
    if (!response.ok && result.title !== 'Member Exists') {
      console.error('Mailchimp error:', result);
      return res.status(500).json({ error: result.detail || 'Mailchimp error' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mailchimp subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
