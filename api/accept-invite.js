import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://wnlqvmedocpgjawmwivd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { invite_code, invitee_uid, invitee_email, invitee_name } = req.body;
  if (!invite_code || !invitee_uid) {
    return res.status(400).json({ error: 'Missing invite code or user ID' });
  }

  const clean = invite_code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Look up the invite
  const { data: invite, error: inviteErr } = await supabase
    .from('household_invites')
    .select('*')
    .eq('invite_code', clean)
    .eq('status', 'pending')
    .maybeSingle();

  if (inviteErr || !invite) {
    return res.status(404).json({ error: 'Invite not found or already used.' });
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This invitation has expired. Ask for a new one.' });
  }

  // Prevent owner from accepting their own invite
  if (invite.owner_uid === invitee_uid) {
    return res.status(400).json({ error: 'You cannot accept your own invitation.' });
  }

  // Write role to invitee's user_data row
  // First check if invitee has a user_data row
  const { data: existingData } = await supabase
    .from('user_data')
    .select('user_id')
    .eq('user_id', invitee_uid)
    .maybeSingle();

  if (existingData) {
    // Update existing row
    const { error: updateErr } = await supabase
      .from('user_data')
      .update({
        account_role: invite.role,
        owner_uid: invite.owner_uid,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', invitee_uid);

    if (updateErr) {
      console.error('Update error:', updateErr);
      return res.status(500).json({ error: 'Failed to assign role' });
    }
  } else {
    // Insert new minimal row for invitee
    const { error: insertErr } = await supabase
      .from('user_data')
      .insert({
        user_id: invitee_uid,
        account_role: invite.role,
        owner_uid: invite.owner_uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return res.status(500).json({ error: 'Failed to assign role' });
    }
  }

  // Mark invite as accepted
  await supabase
    .from('household_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Send confirmation email to owner
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && invite.owner_email) {
    const roleLabel = invite.role === 'manager' ? 'Manager' : 'Viewer';
    const inviteeName = invitee_name || invitee_email || 'Someone';
    const ownerFirst = (invite.owner_name || 'there').split(' ')[0];

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#f8f8f8;">
        <div style="background:#1A2344;padding:24px 28px;border-radius:10px 10px 0 0;">
          <div style="color:#C8963E;font-size:26px;font-weight:bold;">Smart Kitchen™</div>
          <div style="color:#fff;font-size:14px;margin-top:4px;">AI-Powered Meal Planning</div>
        </div>
        <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;">
          <h2 style="color:#1A2344;margin-top:0;">Your ${roleLabel} invitation was accepted</h2>
          <p style="color:#444;line-height:1.6;">Hi ${ownerFirst},</p>
          <p style="color:#444;line-height:1.6;">
            <strong>${inviteeName}</strong> has accepted your invitation and can now access your Smart Kitchen account as a <strong>${roleLabel}</strong>.
          </p>
          ${invite.role === 'manager'
            ? '<p style="color:#444;line-height:1.6;">They can now help manage your meal plan and inventory. You remain in full control of your account settings and subscription.</p>'
            : '<p style="color:#444;line-height:1.6;">They can now view your meal plan and inventory in read-only mode.</p>'
          }
          <p style="color:#888;font-size:13px;margin-top:24px;">If you did not send this invitation, please contact us at thesmartkitchenapp@gmail.com immediately.</p>
        </div>
        <div style="text-align:center;padding:16px;color:#aaa;font-size:12px;">
          Smart Kitchen™ · smart-kitchen-opal.vercel.app
        </div>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Smart Kitchen <noreply@rinehartra.com>',
        to: invite.owner_email,
        subject: `${inviteeName} accepted your Smart Kitchen ${roleLabel} invitation`,
        html: htmlBody
      })
    });
  }

  return res.status(200).json({
    success: true,
    role: invite.role,
    owner_uid: invite.owner_uid,
    owner_name: invite.owner_name
  });
}
