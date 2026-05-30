# Smart Kitchen™ — Session Handoff
**Date:** May 29, 2026  
**Session:** Medical+ Module — Full Build  
**Last commit:** `af5da65b` — Medical+: Can I Have This button always visible in top bar

---

## 🔑 PUSH RULES — READ FIRST

**GitHub token must be regenerated each session** — previously shared tokens are compromised.  
Go to: github.com → Profile → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token (classic) → check `repo` scope → copy immediately.

**Patching workflow:**
- Python patch scripts via PowerShell temp files: `Out-File -FilePath "$env:TEMP\patch.py" -Encoding utf8` then `python3 "$env:TEMP\patch.py"`
- Always run `esbuild /home/claude/App.jsx --bundle=false` before pushing — zero errors required
- Push via GitHub API (base64 encode, PUT to contents endpoint)
- Vercel auto-deploys ~60 seconds after push to main
- Test on live URL: smart-kitchen-opal.vercel.app

---

## 📍 Project State

**Live URL:** smart-kitchen-opal.vercel.app  
**GitHub:** github.com/RickRinehart/smart-kitchen  
**Local:** `C:\Users\FPI Laptop\OneDrive\Desktop\smart-kitchen\`  
**Stack:** React/Vite PWA, Vercel (hosting + serverless), Supabase (auth), Stripe (subscriptions), Resend (email, domain: rinehartra.com), Anthropic `claude-sonnet-4-5`  
**App size:** ~400KB App.jsx (single-file architecture)  
**Deployments:** 340+ production deployments

---

## ✅ COMPLETE — All Shipped Features

### Phase 1 (April 2026)
- 7-day dinner meal plan generator
- Inventory manager (manual, receipt scanner, shelf scanner)
- Family profiles with dietary restrictions (9 presets)
- Custom dietitian parameters per member
- Busy Night flag (quick meals under 20 min)
- Leftover Scanner with photo persistence
- Desserts tab
- Shopping list with email via Resend
- Google Calendar "Add to Calendar" per meal card
- Print meal plan
- Star ratings (1–5) with Keeper rotation (4-week cooldown)
- Change Meal / swap per day
- Rejected meals view with Restore
- Substitute Tool
- Make This (step-by-step cooking)
- Web recipe search
- Recipe Photo System (camera pill buttons, canvas compression)
- Wild Harvest inventory (27 species, freezer life intelligence)
- Home Harvest inventory (40+ produce items, eggs, livestock)
- Harvest Label Printing (Avery 5160/5163/5164)
- Adaptive Learning (Made It, star ratings, rejections, leftovers)
- Yield Correction (repackage bag count delta logging)
- Senior Mode (enlarged text, simplified layout)

### Phase 1.5 (May 2026)
- Stripe live mode checkout — Solo/Family/Medical+ Monthly and Annual
- 6 live price IDs in Vercel env vars
- SMG528 promo code ($5/month off first 12 months)
- 14-day free trial (no credit card required)
- Trial countdown in Settings
- Trial touchpoints at days 15/10/5/daily
- Day 5 retention conversation in support chat
- Admin bypass (thesmartkitchenapp@gmail.com, michiganrvvacations@gmail.com)
- In-app Claude support chat (all tiers, draggable bubble)
- Support chat loads full user profile + dietary restrictions
- Escalation emails to thesmartkitchenapp@gmail.com for bugs/scanner failures/dietary compliance/feature requests/frustrated users/seniors struggling
- Weekly Ad Scanner (batch multi-image upload)
- Viewer Code System (read-only access via 4–12 char code)
- Server-side API for viewer data fetch (bypasses Supabase RLS)
- Cloud sync (Supabase `user_data` table, 25+ columns)
- Light/Dark theme toggle (CSS variables)
- Welcome email via Resend with PDF attachments
- Family Guide v10.0 + User Manual v8.0 in `public/` folder (stable URLs, no version numbers)

### Phase 2 — Medical+ Module (May 29, 2026) ✅ COMPLETE
- Per-member Medical+ profile fields:
  - Dietary Plan selector (10 options: Diabetic-Friendly, Renal, Cardiac, Bariatric, Low Sodium, Low FODMAP, Mediterranean, Keto, Gluten-Free, Custom)
  - Allergy buttons (9 standard + free-text custom field)
  - Medications (Name with 200-drug autocomplete / Dose / Schedule)
  - Supplements (Name / Dose / Schedule)
  - AI Enforcement Level (Strict / Warn / Inform — set by parent or caregiver per member)
- Medical+ section styling: red left border `#dc2626`, theme-aware (light + dark mode)
- Gating: dimmed at 45% + transparent overlay fires `onUpgrade()` without Medical+ subscription
- "Add $10/mo" badge on locked section
- Medication autocomplete: 200+ drug database, 2-char trigger, dropdown up to 8 matches, tap to fill, free-text fallback
- AI prompt injection via `familySummary()`: all Medical+ profiles injected into meal plan, recipe, dessert, Make This, Can I Have This prompts
- `getMedicalWarnings(mealName)` helper: checks meal name against food-drug interaction library
- Food-drug interaction library (10 interaction patterns):
  - Warfarin/Coumadin → vitamin K greens + grapefruit
  - Statins (rosuvastatin, atorvastatin, lovastatin, simvastatin, pravastatin) → grapefruit
  - ACE inhibitors/ARBs (lisinopril, enalapril, ramipril, losartan, valsartan) → high potassium foods
  - Metformin → alcohol
  - Antidepressants (fluoxetine, sertraline, paroxetine, amitriptyline, trazodone, mirtazapine) → tyramine-rich foods
  - Levothyroxine → soy + cruciferous vegetables
  - Opioids (oxycodone, hydrocodone, morphine, tramadol) → grapefruit
  - Spironolactone → high potassium foods
  - Prednisone/Fludrocortisone → high sodium processed foods
- Warn badges on meal plan cards: ⚠️ amber `#d97706` solid, white text — member name + reason
- Strict badges on meal plan cards: 🚫 red `#dc2626` solid, white text
- Warn/Strict badges on recipe modal: same colors, larger, with member name + specific reason
- Enforcement in meal plan generation prompt: Strict = hard stop NEVER instruction injected, Warn = softer guidance
- Enforcement defaults: none — user must explicitly set per member, no auto-defaulting
- ⚕ Can I Have This? modal — fully rebuilt:
  - Text input: type any food/ingredient, press Enter or tap button
  - Label scanner: photo zone, camera opens directly on mobile, image compression
  - Full medical profile injected into AI prompt (medications, allergies, dietary plan, enforcement)
  - AI returns JSON: overall verdict + per-member breakdown with specific reasons
  - Overall verdict banner: green/amber/red solid with white text (readable both modes)
  - Per-member rows: individual verdict + specific reason per member
  - Two actions: Check Another (clears) / Done (closes)
- ⚕ Can I Have This? button in top nav bar: red `#dc2626`, bold, next to Family Recipes
  - Visible for Medical+ users OR any user with dietary restrictions active
- Cloud sync merge protection in supabaseClient.js: when loading family_profiles from cloud, Medical+ fields (medications, supplements, medicalPlan, medicalAllergies, medicalAllergiesCustom, customPlanNote, enforcement) from local copy are preserved if cloud record has empty/missing values
- Documents updated:
  - Executive Brief v11 (Medical+ as complete phase, clinical differentiator section)
  - User Manual v8 (full Medical+ setup guide, Can I Have This instructions)
  - Family Guide v10 (What's New table, Sue's profile walkthrough, real-world Bush's Beans example)
  - PDFs pushed to `public/` folder — welcome email auto-serves latest

---

## 🔴 Priority — Next Session

1. **Supabase custom SMTP** — connect thesmartkitchenapp@gmail.com to Supabase auth emails. Dashboard only, no code. Supabase → Authentication → SMTP Settings. Critical before onboarding more users (auth email rate limit risk).

2. **Proactive support chat** — auto-opens after new feature releases, greets user by name, describes feature, offers guided walkthrough. Feature flag system tracks per-user introductions. Especially valuable for Senior Mode and new Medical+ users.

3. **Meal Star Rating persistence fix** — quick meal suggestions don't survive app close/reopen. Need to save alongside `sk_mealPlan` in localStorage.

4. **Per-day New Meal button** — kept crashing in previous sessions. Needs clean approach. Lower priority after above.

---

## 🟡 Near-Term Build Queue

- **SMS shopping list** — Twilio API + serverless function at `api/send-sms.js`. User saves phone number in Settings. Clean scannable format.
- **Wizard Steps 3+4** — inventory setup choice + pantry checklist with shopping list confirm dialog
- **Date of birth on family profiles** — age-aware meals, birthday dinner recommendations, birthday emails
- **Business Partner Account tier** — free Medical+ for referring businesses, referral link tracking, co-branded experience

---

## 🗂 Full Feature Backlog (Future Phases)

- **Caregiver Report** (Medical+) — meals made, inventory levels, caloric intake, dietary compliance, remote diet auditing, flag insufficient eating
- **Senior UI** refinements for August 7 SMG demo — larger targets, simpler nav
- **Google Calendar read integration** — auto-detect busy evenings before meal plan generation (Family/Medical+)
- **Multilingual** — Spanish first, `react-i18next` with translation JSON, language selector in Settings
- **Weight loss + medication-aware planning** — GLP-1/bariatric/physician-referred users; height/weight/target/activity/medication fields
- **Dietary plan selector expansion** — Carnivore, Keto, Mediterranean, Plant-based, Low FODMAP, Diabetic-friendly, Bariatric, Custom free-text
- **Device limits by tier** — Solo=1, Family=3, Medical+=unlimited
- **Activity data + caloric tracking** — Apple Health, Google Fit, wearables (flagged as potential fundamental product expansion)
- **DIY smart fridge camera** — Wyze-style WiFi cam, motion-triggered, Claude Vision, Raspberry Pi (Phase 3 hardware)
- **Samsung SmartThings partnership** — Family Hub SmartThings open API integration
- **Multilingual** — Spanish first
- **App Store native builds**

---

## 💳 Stripe (Live Mode)

| Code | Discount | Duration |
|------|----------|----------|
| `SMG528` | $5/month off | 12 months |
| `FAMILY100` | 100% off | Forever (approval flow active) |

**Live Price IDs** (in Vercel env vars):
- `STRIPE_PRICE_SOLO_MONTHLY`, `STRIPE_PRICE_SOLO_ANNUAL`
- `STRIPE_PRICE_FAMILY_MONTHLY`, `STRIPE_PRICE_FAMILY_ANNUAL`
- `STRIPE_PRICE_MEDICAL_MONTHLY`, `STRIPE_PRICE_MEDICAL_ANNUAL`

**Current Pricing:**
- Solo: $7.99/mo · $49.99/yr
- Family: $12.99/mo · $99.99/yr
- Medical+: $19.99/mo · $179.99/yr

---

## 📋 Key Technical Patterns

### JSX / esbuild
- App.jsx is largely single-line JSX. Vite 8's rolldown bundler fails on lines exceeding ~4,800 bytes ending with patterns like `</div>)}`, `</div>);`
- **Always run:** `esbuild /home/claude/App.jsx --bundle=false` before pushing. Zero errors required.
- Strip all emoji variation selectors (U+FE0F) — they cause identical parser failures
- Reliable fix for bundler failures: rebuild from last known-good commit, apply changes as properly indented multi-line JSX

### `callClaude` response pattern
- Returns a plain string, not a response object
- All JSON parsing needs: `typeof res === "string" ? res : res?.content?.[0]?.text`
- `max_tokens` must be sized to response: receipt scanning=4000, meal plan=3000+, leftover=800+

### Patching workflow
- Python patch scripts via `Out-File -FilePath "$env:TEMP\patch.py" -Encoding utf8` then `python3 "$env:TEMP\patch.py"`
- Use exact string `.replace()` with `\n` for newlines
- When "NOT FOUND": use `c.find("partial_string")` and `print(repr(c[idx-200:idx+80]))` to inspect exact whitespace
- Read from and write to local file, not GitHub

### Stripe alignment
- Stripe live secret key and live products must be in the same Stripe account
- Mismatch (key in Vercel from different account than where products were created) has burned time before

### Supabase
- App uses Supabase only for auth + cloud sync (`user_data` table)
- All app data in localStorage, synced to Supabase on demand
- New tables must include explicit GRANT statements and Row Level Security at creation time
- Cloud sync merge: Medical+ fields preserved on load — see supabaseClient.js merge logic

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app — ~400KB single file |
| `src/main.jsx` | Auth wrapper, `can` object (tier capabilities), Root component |
| `src/supabaseClient.js` | Cloud sync, auth helpers, viewer roles, Medical+ merge logic |
| `api/create-checkout-session.js` | Stripe checkout with promo code support |
| `api/stripe-webhook.js` | FAMILY100 detection + approval notification |
| `api/send-welcome-email.js` | Welcome email via Resend — fetches PDFs from stable `public/` URLs |
| `api/send-shopping-list.js` | Shopping list email |
| `api/viewer-data.js` | Server-side data fetch for viewer accounts (bypasses Supabase RLS) |
| `api/mailchimp-subscribe.js` | Adds users to Mailchimp audience |
| `api/family-approval-notify.js` | Emails Rick when FAMILY100 is used |
| `public/SmartKitchen_UserManual.pdf` | Stable URL — v8.0 — attached to all welcome emails |
| `public/SmartKitchen_FamilyGuide.pdf` | Stable URL — v10.0 — attached to all welcome emails |

---

## 🗝 localStorage Keys

`sk_inventory`, `sk_familyProfiles`, `sk_familySize`, `sk_mealPlan`, `sk_sportsNights`, `sk_recipeSite`, `sk_seniorMode`, `sk_setupDone`, `sk_portionFixV2`, `sk_installDismissed`, `sk_reminderDismissed`, `sk_saleItems`, `sk_tempProfiles`, `sk_activeTab`, `sk_chatWelcomeDone`, `sk_tourChoice`, `sk_tourStep`, `sk_guestCaptured`, `sk_darkMode`, `sk_recipes`, `sk_recipeRatings`, `sk_dessertRatings`, `sk_desserts`, `sk_shoppingList`, `sk_familyRecipes`, `sk_madeItHistory`, `sk_changeMealHistory`, `sk_leftoverHistory`, `sk_restockQueue`, `sk_shopPartnerName`, `sk_shopPartnerEmail`, `sk_setupDone`

---

## 📅 Marketing & Events

| Event | Status |
|-------|--------|
| Trademark — Serial #99841391, Class 043 | FILED ✓ May 22, 2026 |
| LLC — Michigan File #28578874 | FILED ✓ May 22, 2026 |
| SMG West Michigan Luncheon — May 28, 2026 | COMPLETE ✓ — 3 facility invitations received |
| August 7 SMG Senior Resource Day | CONFIRMED — keynote + booth |
| Media outreach — Troy Reimink, Rachael Ruiz (Eight West WOOD TV8) | READY — emails cleared |
| Brummel's appliance dealer demo | QUEUED — post-trademark |
| Facebook page launch (552 contacts) | QUEUED |
| Referral program | QUEUED |
| Home show circuit — Novi Fall 2026, Summit County Oct 2–4 | PLANNED |

**Outreach order (when ready):**
1. Troy Reimink (troyreimink.substack.com)
2. Rachael Ruiz — Eight West, WOOD TV8 (rachael.ruiz@woodtv.com)
3. Ehren Wynder — MLive
4. Mark Sanchez — Crain's GR
5. Shelley Irwin — WGVU
6. Rapid Growth Media

---

## 👥 Beta Families

- **Andrew & Leslie's family** — Wild Harvest heavy user (venison, salmon, panfish), Home Harvest, Day One journal feedback
- **Liz & Kyle's family** — Kyle strict diabetic restriction profile, active dietary compliance testing

---

## 📞 Accounts & Contacts

| Service | Detail |
|---------|--------|
| App email | thesmartkitchenapp@gmail.com |
| Admin account 2 | michiganrvvacations@gmail.com |
| Supabase | wnlqvmedocpgjawmwivd.supabase.co |
| Resend domain | rinehartra.com |
| Stripe | Live mode active |
| Anthropic Console | platform.claude.com — auto-reload enabled |
| Mailchimp | us9 server, Audience ID 0b6628be18 |
| Marketing site | thesmartkitchenapp.lovable.app |
| Landing page | rinehartra.com/Smart-Kitchen |
| QR code | QR Tiger dynamic QR code |

---

## 🎯 August 7 SMG Senior Resource Day — Build Goals

Features to have live before August 7:
- [ ] Supabase custom SMTP (critical — before more users)
- [ ] Proactive support chat (senior onboarding experience)
- [ ] Senior UI refinements (larger tap targets, simpler nav)
- [ ] Caregiver Report MVP (Medical+ — meals made, compliance summary)
- [ ] SMS shopping list (Twilio)
- [ ] Meal star rating persistence fix

---

## 📄 Documents — Current Versions

| Document | Version | Location |
|----------|---------|----------|
| Executive Brief | v11.0 | Project files + outputs |
| User Manual | v8.0 | Project files + `public/SmartKitchen_UserManual.pdf` |
| Family Guide | v10.0 | Project files + `public/SmartKitchen_FamilyGuide.pdf` |
| Session Handoff | This document | May 29, 2026 |

**Document branding standard:**
- Navy header: `#1A2344` white bold text
- "Smart Kitchen™" in gold `#C8963E` bold size 56
- Document name navy `#1A2344` size 36 not-bold
- Italic subtitle gray `#888888` size 24
- URL gold `#C8963E` size 22
