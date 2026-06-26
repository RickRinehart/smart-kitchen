# Smart Kitchen™ — Session Handoff
**Date:** June 26, 2026
**Session:** UPC Cache Enrichment + Smart Money Scope
**Last commits:** `693201d` (UPC functions), `4adfad4` (timeout + background enrichment)

---

## 🔑 PUSH RULES — READ FIRST

**GitHub token must be regenerated each session** — previously shared tokens are compromised.
Go to: github.com → Profile → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token (classic) → check `repo` scope → copy immediately.

**Patching workflow:**
- Python patch scripts via bash_tool in Claude
- Always fetch fresh SHA immediately before each push
- Vercel auto-deploys ~60 seconds after push to main
- Test on live URL: smart-kitchen-opal.vercel.app
- API timeout is now 60s (was 25s)

---

## 📍 Project State

**Live URL:** smart-kitchen-opal.vercel.app
**GitHub:** github.com/RickRinehart/smart-kitchen
**Stack:** React/Vite PWA, Vercel, Supabase, Stripe, Resend, Anthropic claude-sonnet-4-5
**App size:** ~655KB App.jsx (single-file architecture)

---

## ✅ COMPLETE — June 26, 2026

### UPC Cache-First Receipt Enrichment
- `lookupUPC(upc)` — cache-first: checks Supabase upc_cache, calls UPCitemdb free API on miss, writes back to cache
- `enrichItemsWithUPC(items)` — batch enriches scanned items, 5 at a time with 500ms delay
- Receipt prompt updated to extract UPC codes from receipt image (works any retailer)
- UPC enrichment is non-blocking — items appear immediately, badges populate in background
- ✓ UPC badge + brand + size shown in review screen
- Enriched fields stored on inventory: brand, size, nutrition, image_url, upc, upc_enriched
- Meijer * prefix stripped — internal codes cleaned before lookup
- API timeout increased from 25s to 60s

### Supabase upc_cache Table (NEW — created June 26, 2026)
- Table: public.upc_cache
- Columns: upc (PK), name, brand, size, category, image_url, nutrition (jsonb), ingredients, cached_at, last_refreshed
- RLS enabled — any authenticated user can read/write
- Shared across all apps and all users
- 90-day refresh threshold
- Retailer-agnostic — UPCs work across Meijer, Kroger, Target, Walmart

### Smart Money Module — Scoped
- Standalone app, same Supabase/Stripe/Anthropic infrastructure
- Domain secured: TheSmartMoneyApp.com ($0.01/yr)
- Features: income, fixed expenses, variable tracking, debt reduction (avalanche/snowball), retirement savings, AI financial literacy tutor
- Target demographic: fixed-income seniors, caregivers, Medical+ users
- Build starts next session

### Smart Cellar Integration (from previous sessions — also live)
- Smart Kitchen × Smart Cellar bidirectional write path
- Mark as Used — decrements sc_cloud_data.remaining_pct via Supabase
- 75% threshold → auto-add to Smart Kitchen shopping list
- Category-smart pour deduction (wine ~20%, beer ~47%, spirits ~6%, fallback ~10%)
- Add from Smart Cellar button in SK shopping tab
- sc_shoppingList synced via Supabase user_data

---

## 🔴 Priority — Next Session

1. **Smart Money app skeleton** — new GitHub repo, Vercel project, Supabase shared project, Stripe
2. **Smart Money core views** — income, fixed expenses, variable tracking, grocery auto-fed from SK UPC data
3. **Debt reduction calculator** — avalanche vs. snowball, AI payoff timeline
4. **UPC test with real receipt** — validate enrichment pipeline with receipt containing visible barcodes
5. **Start Garden 100 video** — July 12 submission deadline

---

## 🟡 Near-Term Build Queue

- Meijer UPC Phase 2 — swap UPCitemdb for Meijer direct product catalog (sale price, aisle location, mPerks coupon flag)
- Smart Money financial literacy AI tutor
- Sip & Go — third flywheel product (geo-location winery/distillery discovery)
- SmartCellarApp.com domain secured ($0.01) — redirect to smart-cellar-rho.vercel.app
- TheSmartMoneyApp.com domain secured ($0.01) — reserved for Smart Money app

---

## 💳 Stripe (Live Mode)

| Code | Discount | Duration |
|------|----------|----------|
| `SMG528` | $5/month off | 12 months |
| `FAMILY100` | 100% off | Forever (approval flow active) |

**Current Pricing:**
- Solo: $7.99/mo · $49.99/yr
- Family: $12.99/mo · $99.99/yr
- Medical+: $19.99/mo · $179.99/yr

---

## 📋 Key Technical Patterns

### UPC Lookup
- Cache-first: `supabase.from('upc_cache').select('*').eq('upc', upc).single()`
- API: `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}` (no key required)
- Upsert: `supabase.from('upc_cache').upsert(record, { onConflict: 'upc' })`
- 90-day refresh: `(Date.now() - new Date(cached.last_refreshed).getTime()) / (1000*60*60*24) < 90`

### Receipt Scanner
- `analyzeReceipt()` — Claude vision, 60s timeout, extracts upc field from receipt image
- After parse: normalize UPCs (`String(upc).replace(/[^0-9]/g,'').slice(-12)`)
- `enrichItemsWithUPC()` runs in background via `.then()` after `setScanResults()`

### callClaude timeout
- `AbortSignal.timeout(60000)` — 60 seconds (was 25s)

---

## 📅 Start Garden 100 Timeline

| Date | Milestone |
|------|-----------|
| July 12, 2026 | Video pitch submission deadline |
| July 21, 2026 | Semifinalists announced |
| August 7–8, 2026 | Bootcamp (MANDATORY — both days) |
| October 22, 2026 | Demo Day |

**Meijer Partnership Brief:** completed, includes UPC/aisle intelligence section, mPerks discount structure, basket value comparison, three-tier shopper model (curbside/in-store/hybrid).

---

## 🗂 Full Feature Backlog

*(See previous handoff — May 29, 2026 — for complete backlog)*

Key additions from June 26 session:
- Smart Money standalone app
- UPC enrichment pipeline
- Meijer Phase 2 product catalog integration
- Aisle-organized in-store shopping list
- Start Garden 100 pitch materials

---

## 📞 Accounts & Contacts

| Service | Detail |
|---------|--------|
| App email | thesmartkitchenapp@gmail.com |
| Supabase | wnlqvmedocpgjawmwivd.supabase.co |
| Resend domain | rinehartra.com |
| Stripe | Live mode active |
| Anthropic Console | platform.claude.com |
| UPC API | UPCitemdb free tier — no key required |

---

## 📄 Documents — Current Versions

| Document | Version | Date |
|----------|---------|------|
| Session Handoff | This document | June 26, 2026 |
| SK Team Handoff | SmartKitchen_SessionHandoff_June26.docx | June 26, 2026 |
| Meijer Partnership Brief | Meijer_Partnership_Brief_RGDigitalLabs.docx | June 26, 2026 |
| SC Phase 2 Handoff | SmartCellar_SK_Integration_Handoff_Phase2_Updated.docx | June 25, 2026 |
| Executive Brief | v11.0 | May 29, 2026 |

