import React, { useState } from 'react'

const NAVY = '#1A2344'
const GOLD = '#C8963E'
const GREEN = '#1A7A4A'
const BLUE = '#1D4ED8'
const PURPLE = '#6D28D9'

const TIERS = [
  {
    id: 'solo',
    name: 'Solo',
    desc: 'Perfect for individuals & seniors',
    monthly: 7.99,
    annual: 79.99,
    annualPerMonth: 6.67,
    color: BLUE,
    badge: 'Best for Seniors',
    members: '1 member',
    priceIdMonthly: 'solo_monthly',
    priceIdAnnual: 'solo_annual',
    features: [
      '7-day AI dinner plan',
      'Inventory & receipt scanning',
      'Can I Have This? label scanner',
      'Family Recipes — type, photo, AI',
      'Print any recipe to PDF',
      'Senior Mode & Dark Mode',
      'In-app support chat',
      '30-day free trial',
    ],
  },
  {
    id: 'couple',
    name: 'Couple',
    desc: 'Two household members',
    monthly: 9.99,
    annual: 99.99,
    annualPerMonth: 8.33,
    color: GOLD,
    badge: 'New',
    members: '2 members',
    priceIdMonthly: 'couple_monthly',
    priceIdAnnual: 'couple_annual',
    features: [
      'Everything in Solo',
      '2 family member profiles',
      'Per-member dietary restrictions',
      'Shared meal plan & shopping list',
      'Weekly Ad Scanner',
      'Leftover Scanner',
      'Star ratings & adaptive learning',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    desc: 'Unlimited household members',
    monthly: 14.99,
    annual: 149.99,
    annualPerMonth: 12.50,
    color: GREEN,
    badge: 'Most Popular',
    members: 'Unlimited members',
    priceIdMonthly: 'family_monthly',
    priceIdAnnual: 'family_annual',
    features: [
      'Everything in Couple',
      'Unlimited family profiles',
      'Wild Harvest inventory',
      'Home Harvest inventory',
      'Harvest label printing',
      'Yield correction logging',
      'Adaptive learning AI',
    ],
  },
]

const MEDICAL_ADDON = {
  id: 'medical_addon',
  name: 'Medical+',
  monthly: 10.00,
  annual: 99.99,
  annualPerMonth: 8.33,
  color: PURPLE,
  priceIdMonthly: 'medical_addon_monthly',
  priceIdAnnual: 'medical_addon_annual',
  features: [
    'AI-enforced dietary compliance per member',
    'Diabetic · Renal · Cardiac · Bariatric',
    'Gluten-free · Low sodium · Anti-inflammatory',
    'Medical restrictions enforced on every recipe',
    'Unified family meals — one cook session',
    'Caregiver Report — coming Phase 2',
    'Medication-aware planning — coming Phase 2',
  ],
}

export default function SubscriptionModal({ user, currentTier, onClose, onSubscribed }) {
  const [billing, setBilling] = useState('monthly')
  const [addMedical, setAddMedical] = useState(false)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleSelectTier(tier) {
    setLoading(tier.id)
    setError('')
    const priceId = billing === 'annual' ? tier.priceIdAnnual : tier.priceIdMonthly
    const addOnPriceId = addMedical
      ? (billing === 'annual' ? MEDICAL_ADDON.priceIdAnnual : MEDICAL_ADDON.priceIdMonthly)
      : null

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          addOnPriceId,
          userId: user.id,
          userEmail: user.email,
          tier: tier.id,
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(null)
  }

  const medMonthly = billing === 'annual'
    ? MEDICAL_ADDON.annualPerMonth.toFixed(2)
    : MEDICAL_ADDON.monthly.toFixed(2)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.brand}>Smart Kitchen™</div>
            <h2 style={s.title}>Choose Your Plan</h2>
            <p style={s.subtitle}>30-day free trial · No credit card required · Cancel anytime</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Billing toggle */}
        <div style={s.billingRow}>
          <button
            style={{ ...s.toggleBtn, ...(billing === 'monthly' ? s.toggleActive : {}) }}
            onClick={() => setBilling('monthly')}
          >Monthly</button>
          <button
            style={{ ...s.toggleBtn, ...(billing === 'annual' ? s.toggleActive : {}) }}
            onClick={() => setBilling('annual')}
          >Annual <span style={s.saveBadge}>2 months free</span></button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Tier cards */}
        <div style={s.grid}>
          {TIERS.map(tier => {
            const price = billing === 'annual' ? tier.annualPerMonth : tier.monthly
            const medAdd = addMedical ? (billing === 'annual' ? MEDICAL_ADDON.annualPerMonth : MEDICAL_ADDON.monthly) : 0
            const total = price + medAdd
            const isCurrent = currentTier === tier.id
            return (
              <div key={tier.id} style={{ ...s.card, borderColor: tier.color, boxShadow: isCurrent ? `0 0 0 3px ${tier.color}44` : 'none' }}>
                <div style={{ ...s.badge, background: tier.color }}>{tier.badge}</div>
                <div style={s.tierName}>{tier.name}</div>
                <div style={s.tierDesc}>{tier.desc}</div>
                <div style={s.membersTag}>{tier.members}</div>
                <div style={s.priceRow}>
                  <span style={s.price}>${total.toFixed(2)}</span>
                  <span style={s.perMo}>/mo</span>
                </div>
                {billing === 'annual' && (
                  <div style={s.annualNote}>
                    ${(total * 12).toFixed(2)}/yr · save 2 months
                  </div>
                )}
                {addMedical && (
                  <div style={s.medBreakdown}>
                    ${price.toFixed(2)} plan + ${medAdd.toFixed(2)} Medical+
                  </div>
                )}
                <ul style={s.features}>
                  {tier.features.map(f => (
                    <li key={f} style={s.feature}>
                      <span style={{ color: tier.color, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                  {addMedical && MEDICAL_ADDON.features.slice(0, 2).map(f => (
                    <li key={f} style={{ ...s.feature, color: PURPLE }}>
                      <span style={{ color: PURPLE, flexShrink: 0 }}>✦</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{ ...s.selectBtn, background: isCurrent ? '#888' : tier.color, opacity: loading === tier.id ? 0.7 : 1 }}
                  onClick={() => handleSelectTier(tier)}
                  disabled={!!loading || isCurrent}
                >
                  {loading === tier.id ? 'Loading...' : isCurrent ? 'Current Plan' : `Select ${tier.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Medical+ Add-on toggle */}
        <div style={{ ...s.medAddon, borderColor: addMedical ? PURPLE : '#ddd', background: addMedical ? '#f5f3ff' : '#fafafa' }}>
          <div style={s.medAddonLeft}>
            <div style={s.medAddonToggle}>
              <input
                type="checkbox"
                id="medical-addon"
                checked={addMedical}
                onChange={e => setAddMedical(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: PURPLE }}
              />
              <label htmlFor="medical-addon" style={s.medAddonLabel}>
                <span style={{ color: PURPLE, fontWeight: 700 }}>+ Medical+ Add-on</span>
                <span style={s.medAddonPrice}> +${medMonthly}/mo per plan</span>
              </label>
            </div>
            <div style={s.medAddonDesc}>
              AI-enforced dietary compliance per family member. Diabetic, renal, cardiac, bariatric, gluten-free and more — enforced on every recipe and meal plan automatically.
            </div>
          </div>
          {addMedical && (
            <ul style={{ ...s.features, marginTop: 8, marginLeft: 8 }}>
              {MEDICAL_ADDON.features.map(f => (
                <li key={f} style={{ ...s.feature, color: '#4b2d8c', fontSize: 12 }}>
                  <span style={{ color: PURPLE, flexShrink: 0 }}>✦</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer notes */}
        <div style={s.footerNote}>
          🔒 Secure checkout via Stripe · All plans include 30-day free trial · Cancel or change plans anytime
        </div>
        <div style={s.promoNote}>
          Have a promo code? Enter it at checkout — e.g. <strong>SMG528</strong> for $5/month off your first 12 months
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    zIndex: 1000, padding: '16px', overflowY: 'auto'
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '28px',
    width: '100%', maxWidth: '760px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    marginTop: '20px', marginBottom: '20px',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  brand: { color: GOLD, fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 4 },
  title: { margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: NAVY },
  subtitle: { margin: 0, fontSize: '13px', color: '#666' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888', padding: '0 4px' },
  billingRow: { display: 'flex', gap: 8, marginBottom: 20 },
  toggleBtn: {
    padding: '8px 18px', borderRadius: 20, border: '2px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#666'
  },
  toggleActive: { borderColor: GOLD, background: '#fff8ee', color: GOLD },
  saveBadge: { background: '#e8f5e9', color: GREEN, fontSize: 11, padding: '2px 6px', borderRadius: 10, marginLeft: 6 },
  error: { background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#cc0000' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 },
  card: {
    border: '2px solid', borderRadius: 12, padding: '20px 16px',
    display: 'flex', flexDirection: 'column', gap: 6,
    position: 'relative', paddingTop: 36, transition: 'box-shadow 0.2s'
  },
  badge: {
    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px',
    borderRadius: '0 0 8px 8px', whiteSpace: 'nowrap'
  },
  tierName: { fontSize: 18, fontWeight: 700, color: NAVY },
  tierDesc: { fontSize: 12, color: '#888', marginBottom: 2 },
  membersTag: { fontSize: 11, fontWeight: 700, color: '#555', background: '#f0f0f0', borderRadius: 20, padding: '2px 10px', alignSelf: 'flex-start' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4 },
  price: { fontSize: 26, fontWeight: 800, color: NAVY },
  perMo: { fontSize: 13, color: '#888' },
  annualNote: { fontSize: 11, color: GREEN, marginTop: -4 },
  medBreakdown: { fontSize: 11, color: PURPLE, marginTop: -4 },
  features: { margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 },
  feature: { fontSize: 12, color: '#444', display: 'flex', gap: 6, lineHeight: 1.4 },
  selectBtn: {
    padding: '11px', borderRadius: 8, border: 'none',
    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 10
  },
  medAddon: {
    border: '2px solid', borderRadius: 12, padding: '16px 18px',
    marginBottom: 14, transition: 'all 0.2s'
  },
  medAddonLeft: { display: 'flex', flexDirection: 'column', gap: 6 },
  medAddonToggle: { display: 'flex', alignItems: 'center', gap: 10 },
  medAddonLabel: { fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  medAddonPrice: { fontSize: 13, color: PURPLE, fontWeight: 600 },
  medAddonDesc: { fontSize: 13, color: '#555', lineHeight: 1.6, marginLeft: 28 },
  footerNote: { textAlign: 'center', fontSize: 12, color: '#888', padding: '10px', background: '#f8f8f8', borderRadius: 8, marginBottom: 8 },
  promoNote: { textAlign: 'center', fontSize: 12, color: '#666', padding: '8px' },
}
