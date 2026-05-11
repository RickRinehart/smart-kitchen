import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { setTrialStartDate } from './supabaseClient'

export default function AuthModal({ onClose, onSuccess, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignUp() {
    if (!email || !password) { setError('Email and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) { setLoading(false); setError(error.message); return }
    // Subscribe to Mailchimp — fire and forget, don't block signup
    try {
      await fetch('/api/mailchimp-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, tag: 'trial' }),
      });
    } catch(e) { console.warn('Mailchimp subscribe failed:', e); }
    setLoading(false)
    setMessage('Account created! Check your email to confirm, then sign in.')
    setMode('signin')
  }

  async function handleSignIn() {
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    // Set trial start date on first login — no-op if already set
    await setTrialStartDate(data.user.id)
    onSuccess(data.user)
  }

  async function handleReset() {
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage('Password reset email sent. Check your inbox.')
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.logo}>🍽️ Smart Kitchen</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <h2 style={styles.title}>
          {mode === 'signup' && 'Start Your Free 30-Day Trial'}
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'reset' && 'Reset Password'}
        </h2>
        {mode === 'signup' && (
          <p style={styles.subtitle}>No credit card required. Full access for 30 days.</p>
        )}

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <div style={styles.form}>
          {mode === 'signup' && (
            <input
              style={styles.input}
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : mode === 'signup' ? handleSignUp() : handleReset())}
          />
          {mode !== 'reset' && (
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: '44px' }}
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
              />
              <button
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '18px',
                  color: '#888', padding: '0'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          )}

          <button
            style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
            onClick={mode === 'signup' ? handleSignUp : mode === 'signin' ? handleSignIn : handleReset}
            disabled={loading}
          >
            {loading ? 'Please wait...' :
              mode === 'signup' ? 'Create Account — Free 30-Day Trial' :
              mode === 'signin' ? 'Sign In' : 'Send Reset Email'}
          </button>
        </div>

        <div style={styles.footer}>
          {mode === 'signup' && (
            <span>Already have an account?{' '}
              <button style={styles.linkBtn} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Sign in</button>
            </span>
          )}
          {mode === 'signin' && (
            <span>
              <button style={styles.linkBtn} onClick={() => { setMode('reset'); setError(''); setMessage('') }}>Forgot password?</button>
              {' · '}
              <button style={styles.linkBtn} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create account</button>
            </span>
          )}
          {mode === 'reset' && (
            <button style={styles.linkBtn} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Back to sign in</button>
          )}
        </div>

        {mode === 'signup' && (
          <div style={styles.trialBadge}>
            ✓ 30-day free trial · ✓ No credit card · ✓ Cancel anytime
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '16px'
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '32px',
    width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  logo: { fontSize: '18px', fontWeight: '700', color: '#1a2344' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888', padding: '4px' },
  title: { margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#1a2344' },
  subtitle: { margin: '0 0 20px', fontSize: '14px', color: '#666' },
  error: { background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#cc0000' },
  success: { background: '#f0fff4', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#155724' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box'
  },
  primaryBtn: {
    padding: '14px', borderRadius: '8px', border: 'none',
    background: '#c8963e', color: '#fff', fontSize: '15px',
    fontWeight: '700', cursor: 'pointer', marginTop: '4px'
  },
  footer: { marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#666' },
  linkBtn: { background: 'none', border: 'none', color: '#c8963e', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: 0 },
  trialBadge: {
    marginTop: '20px', padding: '10px', background: '#f8f4ee',
    borderRadius: '8px', textAlign: 'center', fontSize: '12px',
    color: '#8a6a30', fontWeight: '600'
  }
}
