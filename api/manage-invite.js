import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function handleSend(req, res) {
  const { owner_uid, owner_name, owner_email, invitee_email, role } = req.body;
  if (!owner_uid || !invitee_email || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['manager', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Manager role requires Medical+ subscription
  if (role === 'manager') {
    const { data: userData, error: userErr } = await supabase
      .from('user_data')
      .select('subscription_tier')
      .eq('user_id', owner_uid)
      .single();
    if (userErr || !userData) return res.status(404).json({ error: 'Account not found' });
    if (userData.subscription_tier !== 'medical') {
      return res.status(403).json({ error: 'Manager role requires Medical+ subscription' });
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

  // Generate unique invite code
  let invite_code = generateCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from('household_invites')
      .select('id')
      .eq('invite_code', invite_code)
      .maybeSingle();
    if (!existing) break;
    invite_code = generateCode();
  }

  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertErr } = await supabase
    .from('household_invites')
    .insert({ invite_code, owner_uid, owner_name: owner_name || 'Your family member', owner_email: owner_email || '', invitee_email, role, status: 'pending', expires_at });

  if (insertErr) {
    console.error('Insert error:', insertErr);
    return res.status(500).json({ error: 'Failed to create invite' });
  }

  const appUrl = 'https://smart-kitchen-opal.vercel.app';
  const acceptUrl = `${appUrl}?accept=${invite_code}`;
  const roleLabel = role === 'manager' ? 'Manager' : 'Viewer';
  const roleDesc = role === 'manager'
    ? 'As a Manager, you can view and edit their meal plan and inventory to help manage their diet and nutrition.'
    : 'As a Viewer, you can monitor their meal plan and inventory to stay informed about their diet.';
  const ownerFirst = (owner_name || 'Someone').split(' ')[0];

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f8f8;">
      <div style="background:#1A2344;padding:24px 28px;border-radius:10px 10px 0 0;">
        <div style="color:#C8963E;font-size:26px;font-weight:bold;">Smart Kitchen™</div>
        <div style="color:#fff;font-size:14px;margin-top:4px;">AI-Powered Meal Planning</div>
      </div>
      <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;">
        <h2 style="color:#1A2344;margin-top:0;">You've been invited as a ${roleLabel}</h2>
        <p style="color:#444;line-height:1.6;"><strong>${ownerFirst}</strong> has invited you to access their Smart Kitchen account as a <strong>${roleLabel}</strong>.</p>
        <p style="color:#444;line-height:1.6;">${roleDesc}</p>
        <div style="background:#f0f4ff;border-left:4px solid #1A2344;padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
          <div style="color:#888;font-size:12px;margin-bottom:4px;">Your invite code</div>
          <div style="color:#1A2344;font-size:28px;font-weight:bold;letter-spacing:4px;">${invite_code}</div>
        </div>
        <p style="color:#444;line-height:1.6;">Click below to accept — you'll need to sign in or create a free account.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${acceptUrl}" style="background:#C8963E;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">Accept Invitation</a>
        </div>
        <p style="color:#888;font-size:13px;">Or enter code <strong>${invite_code}</strong> in the Smart Kitchen app under Settings &rarr; Household Members.</p>
        <p style="color:#aaa;font-size:12px;margin-top:24px;">This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
      </div>
      <div style="text-align:center;padding:16px;color:#aaa;font-size:12px;">Smart Kitchen™ &middot; smart-kitchen-opal.vercel.app</div>
    </div>`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Smart Kitchen <noreply@rinehartra.com>', to: invitee_email, subject: `${ownerFirst} invited you to their Smart Kitchen account`, html: htmlBody })
  });

  if (!emailRes.ok) {
    console.error('Resend error:', await emailRes.text());
    return res.status(500).json({ error: 'Failed to send invite email' });
  }

  return res.status(200).json({ success: true, invite_code });
}

async function handleAccept(req, res) {
  const { invite_code, invitee_uid, invitee_email, invitee_name } = req.body;
  if (!invite_code || !invitee_uid) {
    return res.status(400).json({ error: 'Missing invite code or user ID' });
  }

  const clean = invite_code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const { data: invite, error: inviteErr } = await supabase
    .from('household_invites')
    .select('*')
    .eq('invite_code', clean)
    .eq('status', 'pending')
    .maybeSingle();

  if (inviteErr || !invite) return res.status(404).json({ error: 'Invite not found or already used.' });
  if (new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'This invitation has expired. Ask for a new one.' });
  if (invite.owner_uid === invitee_uid) return res.status(400).json({ error: 'You cannot accept your own invitation.' });

  const { data: existingData } = await supabase.from('user_data').select('user_id').eq('user_id', invitee_uid).maybeSingle();

  if (existingData) {
    const { error: updateErr } = await supabase.from('user_data')
      .update({ account_role: invite.role, owner_uid: invite.owner_uid, updated_at: new Date().toISOString() })
      .eq('user_id', invitee_uid);
    if (updateErr) return res.status(500).json({ error: 'Failed to assign role' });
  } else {
    const { error: insertErr } = await supabase.from('user_data')
      .insert({ user_id: invitee_uid, account_role: invite.role, owner_uid: invite.owner_uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (insertErr) return res.status(500).json({ error: 'Failed to assign role' });
  }

  await supabase.from('household_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Notify owner
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && invite.owner_email) {
    const roleLabel = invite.role === 'manager' ? 'Manager' : 'Viewer';
    const inviteeName = invitee_name || invitee_email || 'Someone';
    const ownerFirst = (invite.owner_name || 'there').split(' ')[0];
    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f8f8;">
        <div style="background:#1A2344;padding:24px 28px;border-radius:10px 10px 0 0;">
          <div style="color:#C8963E;font-size:26px;font-weight:bold;">Smart Kitchen™</div>
          <div style="color:#fff;font-size:14px;margin-top:4px;">AI-Powered Meal Planning</div>
        </div>
        <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;">
          <h2 style="color:#1A2344;margin-top:0;">Your ${roleLabel} invitation was accepted</h2>
          <p style="color:#444;line-height:1.6;">Hi ${ownerFirst},</p>
          <p style="color:#444;line-height:1.6;"><strong>${inviteeName}</strong> has accepted your invitation and can now access your Smart Kitchen account as a <strong>${roleLabel}</strong>.</p>
          ${invite.role === 'manager' ? '<p style="color:#444;line-height:1.6;">They can now help manage your meal plan and inventory. You remain in full control of your account settings and subscription.</p>' : '<p style="color:#444;line-height:1.6;">They can now view your meal plan and inventory in read-only mode.</p>'}
          <p style="color:#888;font-size:13px;margin-top:24px;">If you did not send this invitation, please contact us at thesmartkitchenapp@gmail.com immediately.</p>
        </div>
        <div style="text-align:center;padding:16px;color:#aaa;font-size:12px;">Smart Kitchen™ &middot; smart-kitchen-opal.vercel.app</div>
      </div>`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Smart Kitchen <noreply@rinehartra.com>', to: invite.owner_email, subject: `${inviteeName} accepted your Smart Kitchen ${roleLabel} invitation`, html: htmlBody })
    });
  }

  return res.status(200).json({ success: true, role: invite.role, owner_uid: invite.owner_uid, owner_name: invite.owner_name });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { action } = req.body;
  if (action === 'send') return handleSend(req, res);
  if (action === 'accept') return handleAccept(req, res);
  return res.status(400).json({ error: 'Invalid action. Use "send" or "accept".' });
}
