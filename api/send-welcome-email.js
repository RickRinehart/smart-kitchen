export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, tier } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

  const firstName = name ? name.split(' ')[0] : 'there';
  const appUrl = 'https://smart-kitchen-opal.vercel.app';
  const baseUrl = appUrl;

  // Stable URLs — no version number so they always point to latest
  const manualUrl  = `${baseUrl}/SmartKitchen_UserManual.pdf`;
  const guideUrl   = `${baseUrl}/SmartKitchen_FamilyGuide.pdf`;

  const tierNote = tier === 'medical' 
    ? '<p style="background:#e6f4ed;border-left:4px solid #1A7A4A;padding:12px 16px;border-radius:0 8px 8px 0;color:#1A7A4A;font-weight:bold;">Your Medical+ plan includes unlimited family profiles, medical dietary enforcement, and caregiver features coming in Phase 2.</p>'
    : tier === 'family'
    ? '<p style="background:#EEF1F8;border-left:4px solid #1A2344;padding:12px 16px;border-radius:0 8px 8px 0;color:#1A2344;">Your Family plan includes up to 6 family profiles with per-member dietary restrictions — set them up in the Family tab.</p>'
    : '<p style="background:#EEF1F8;border-left:4px solid #1A2344;padding:12px 16px;border-radius:0 8px 8px 0;color:#1A2344;">Your Solo plan includes full AI meal planning, inventory management, and all core features.</p>';

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#f8f8f8;">

      <!-- Header -->
      <div style="background:#1A2344;padding:24px 28px;border-radius:10px 10px 0 0;">
        <div style="color:#C8963E;font-size:26px;font-weight:bold;letter-spacing:0.5px;">Smart Kitchen™</div>
        <div style="color:#fff;font-size:14px;margin-top:4px;">AI-Powered Meal Planning for Your Family</div>
      </div>

      <!-- Body -->
      <div style="background:#fff;border:1px solid #e2e6ef;border-top:none;border-radius:0 0 10px 10px;padding:28px;">

        <p style="font-size:18px;color:#1A2344;font-weight:bold;margin-top:0;">Welcome, ${firstName}! 👋</p>

        <p style="color:#333;font-size:15px;line-height:1.7;">
          Thank you for joining Smart Kitchen™. I built this app at my own kitchen table — my wife Sue was dealing with some health challenges and I took over the cooking. 
          I needed a better system. Smart Kitchen is that system, and now it's yours.
        </p>

        <p style="color:#333;font-size:15px;line-height:1.7;">
          Your <strong>30-day free trial</strong> is active. No credit card required. Here's how to get started:
        </p>

        <!-- Steps -->
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin:20px 0;">
          <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
            <div style="background:#C8963E;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;flex-shrink:0;margin-right:12px;margin-top:2px;">1</div>
            <div><strong style="color:#1A2344;">Set up your family profiles</strong><br><span style="color:#555;font-size:14px;">Add family members and any dietary restrictions. The AI enforces them automatically on every meal plan.</span></div>
          </div>
          <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
            <div style="background:#C8963E;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;flex-shrink:0;margin-right:12px;margin-top:2px;">2</div>
            <div><strong style="color:#1A2344;">Add what's in your kitchen</strong><br><span style="color:#555;font-size:14px;">Scan a receipt, photograph pantry shelves, or add items manually. The AI builds meals around what you have.</span></div>
          </div>
          <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
            <div style="background:#C8963E;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;flex-shrink:0;margin-right:12px;margin-top:2px;">3</div>
            <div><strong style="color:#1A2344;">Generate your first meal plan</strong><br><span style="color:#555;font-size:14px;">Tap "Generate Meal Plan" for a personalized 7-day dinner plan built around your inventory, family, and preferences.</span></div>
          </div>
          <div style="display:flex;align-items:flex-start;">
            <div style="background:#C8963E;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;flex-shrink:0;margin-right:12px;margin-top:2px;">4</div>
            <div><strong style="color:#1A2344;">Add your family recipes</strong><br><span style="color:#555;font-size:14px;">Type them in, photograph handwritten cards, or describe an idea — the AI creates a full recipe card. Print any recipe as a PDF.</span></div>
          </div>
        </div>

        ${tierNote}



        <!-- Documents -->
        <p style="color:#1A2344;font-weight:bold;font-size:15px;margin-bottom:10px;">📎 Your documents are attached:</p>
        <ul style="color:#333;font-size:14px;line-height:2;">
          <li><strong>Smart Kitchen™ User Manual</strong> — Complete feature reference. Every feature, every button, how everything works.</li>
          <li><strong>Smart Kitchen™ Family Guide</strong> — Quick-start guide for your household. Great to share with family members.</li>
        </ul>

        <!-- CTA -->
        <div style="text-align:center;margin:28px 0 16px;">
          <a href="${appUrl}" style="background:#C8963E;color:#1A2344;font-weight:bold;font-size:16px;padding:14px 36px;border-radius:8px;text-decoration:none;display:inline-block;">Open Smart Kitchen™ →</a>
        </div>

        <p style="color:#888;font-size:13px;line-height:1.7;">
          Questions? Tap the chat bubble inside the app anytime — it knows your profile and is always ready to help. 
          You can also reply to this email and I'll get back to you personally.
        </p>

        <p style="color:#555;font-size:14px;margin-top:20px;">
          — Rick Rinehart<br>
          <span style="color:#888;font-size:13px;">Creator, Smart Kitchen™ &nbsp;•&nbsp; RG Digital Labs, LLC</span>
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:16px;color:#aaa;font-size:12px;">
        Smart Kitchen™ &nbsp;•&nbsp; RG Digital Labs, LLC &nbsp;•&nbsp; 
        <a href="${appUrl}" style="color:#C8963E;text-decoration:none;">smart-kitchen-opal.vercel.app</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rick Rinehart — Smart Kitchen <noreply@rinehartra.com>',
        to: [email],
        subject: 'Welcome to Smart Kitchen™ — Your documents are attached',
        html: htmlBody,
        attachments: [
          {
            path: manualUrl,
            filename: 'SmartKitchen_UserManual.pdf',
          },
          {
            path: guideUrl,
            filename: 'SmartKitchen_FamilyGuide.pdf',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: data.message || 'Failed to send welcome email' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Welcome email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
