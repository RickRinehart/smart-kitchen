import React, { useState } from 'react'

// NEW PRICING — updated May 2026
// Annual = 10 months price (save 2 months)
// TODO: Replace priceId values with new Stripe Price IDs after creating in Stripe dashboard
const TIERS = [
  {
    id: 'solo',
    name: 'Solo',
    price: '$7.99',
    monthlyAmount: 7.99,
    annual: '$79.90/yr',
    annualPerMonth: '$6.66',
    color: '#4a90d9',
    badge: 'Best for Seniors',
    features: [
      'Unlimited recipes',
      '5-day meal plan',
      'Busy Night flag',
      'Restock Queue',
      'Email & SMS shopping list',
      'Calendar integration',
      'Senior Mode',
    ],
    priceIdMonthly: 'price_1TSMyXAcShLCx7pOOBupnKTA',
    priceIdAnnual:  'price_1TSMyXAcShLCx7pOxCsRtGgO',
  },
  {
    id: 'family',
    name: 'Family',
    price: '$12.99',
    monthlyAmount: 12.99,
    annual: '$129.90/yr',
    annualPerMonth: '$10.83',
    color: '#c8963e',
    badge: 'Most Popular',
    features: [
      'Everything in Solo',
      '7-day meal plan',
      'Up to 3 family profiles',
      'Receipt & inventory scanner',
      'Shopping list print/export',
      'Google Calendar push',
      'Wed/Sun review reminders',
    ],
    priceIdMonthly: 'price_1TSMzRAcShLCx7pOWpCCVAV7',
    priceIdAnnual:  'price_1TSN04AcShLCx7pOfyraf2eH',
  },
  {
    id: 'medical',
    name: 'Medical+',
    price: '$19.99',
    monthlyAmount: 19.99,
    annual: '$199.90/yr',
    annualPerMonth: '$16.66',
    color: '#2e7d52',
    badge: 'Clinical Grade',
    features: [
      'Everything in Family',
      'AI-enforced medical dietary compliance',
      'Temporary medical diets',
      'Unlimited family profiles',
      'Diabetic · Heart-healthy · Renal · Anti-inflammatory',
    ],
    priceIdMonthly: 'price_1TSN5LAcShLCx7pOtVHLn5cn',
    priceIdAnnual:  'price_1TSN5qAcShLCx7pO3L4gQwTj',
  },
]

export default function SubscriptionModal({ user, currentTier, onClose, onSubscribed }) {
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  async function handleSelectTier(tier) {
    setLoading(tier.id)
    setError('')
    const priceId = billing === 'annual' ? tier.priceIdAnnual : tier.priceIdMonthly

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Choose Your Plan</h2>
            <p style={styles.subtitle}>No credit card required during trial · Cancel anytime</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Billing toggle */}
        <div style={styles.billingToggle}>
          <button
            style={{ ...styles.toggleBtn, ...(billing === 'monthly' ? styles.toggleActive : {}) }}
            onClick={() => setBilling('monthly')}
          >Monthly</button>
          <button
            style={{ ...styles.toggleBtn, ...(billing === 'annual' ? styles.toggleActive : {}) }}
            onClick={() => setBilling('annual')}
          >Annual <span style={styles.saveBadge}>2 months free</span></button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Tier cards */}
        <div style={styles.tiersGrid}>
          {TIERS.map(tier => (
            <div key={tier.id} style={{ ...styles.tierCard, borderColor: tier.color }}>
              <div style={{ ...styles.tierBadge, background: tier.color }}>{tier.badge}</div>
              <div style={styles.tierName}>{tier.name}</div>
              <div style={styles.tierPrice}>
                {billing === 'annual' ? tier.annual : `${tier.price}/mo`}
              </div>
              {billing === 'annual' && (
                <div style={styles.perMonth}>
                  ({tier.annualPerMonth}/mo billed annually)
                </div>
              )}
              <ul style={styles.featureList}>
                {tier.features.map(f => (
                  <li key={f} style={styles.featureItem}>
                    <span style={{ color: tier.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  ...styles.selectBtn,
                  background: tier.color,
                  opacity: loading === tier.id ? 0.7 : 1
                }}
                onClick={() => handleSelectTier(tier)}
                disabled={!!loading || currentTier === tier.id}
              >
                {loading === tier.id ? 'Loading...' :
                  currentTier === tier.id ? 'Current Plan' :
                  'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* 7-day plan callout */}
        <div style={styles.featureCallout}>
          📅 <strong>7-day meal planning</strong> is available on Family and Medical+ plans
        </div>

        {/* Free tier note */}
        <div style={styles.freeNote}>
          Continuing on <strong>Free</strong>: 5 recipes/day · 3-day meal plan · No calendar · No Busy Night flag
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px', overflowY: 'auto'
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '28px',
    width: '100%', maxWidth: '680px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxHeight: '90vh', overflowY: 'auto'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title: { margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#1a2344' },
  subtitle: { margin: 0, fontSize: '13px', color: '#666' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' },
  billingToggle: { display: 'flex', gap: '8px', marginBottom: '20px' },
  toggleBtn: {
    padding: '8px 18px', borderRadius: '20px', border: '2px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#666'
  },
  toggleActive: { borderColor: '#c8963e', background: '#fff8ee', color: '#c8963e' },
  saveBadge: { background: '#e8f5e9', color: '#2e7d52', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' },
  error: { background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#cc0000' },
  tiersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' },
  tierCard: {
    border: '2px solid', borderRadius: '12px', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', paddingTop: '36px'
  },
  tierBadge: {
    position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 12px',
    borderRadius: '0 0 8px 8px', whiteSpace: 'nowrap'
  },
  tierName: { fontSize: '18px', fontWeight: '700', color: '#1a2344' },
  tierPrice: { fontSize: '22px', fontWeight: '800', color: '#1a2344' },
  perMonth: { fontSize: '11px', color: '#888', marginTop: '-4px' },
  featureList: { margin: '8px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 },
  featureItem: { fontSize: '13px', color: '#444', display: 'flex', gap: '6px' },
  selectBtn: {
    padding: '12px', borderRadius: '8px', border: 'none',
    color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px'
  },
  featureCallout: {
    textAlign: 'center', fontSize: '13px', color: '#1a2344',
    padding: '10px', background: '#eef4fa', borderRadius: '8px', marginBottom: '10px'
  },
  freeNote: {
    textAlign: 'center', fontSize: '12px', color: '#888',
    padding: '12px', background: '#f8f8f8', borderRadius: '8px'
  }
}
