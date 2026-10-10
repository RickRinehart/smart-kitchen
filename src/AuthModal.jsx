import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { setTrialStartDate } from './supabaseClient'

export default function AuthModal({ onClose, onSuccess, initialMode = 'signup', onShowGuestViewer }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [largeText, setLargeText] = useState(()=>{try{return localStorage.getItem('sk_seniorMode')==='1';}catch{return false;}})
  const [lightMode, setLightMode] = useState(()=>{try{return localStorage.getItem('sk_darkMode')==='0';}catch{return false;}})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  // "Check your email" step: the address we're waiting on, a short cooldown on re-sending, and feedback for the buttons
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendLeft, setResendLeft] = useState(0)
  const [resending, setResending] = useState(false)
  const [confirmNote, setConfirmNote] = useState(null)   // { text, bad }

  useEffect(() => {
    if (resendLeft <= 0) return
    const id = setTimeout(() => setResendLeft(n => n - 1), 1000)
    return () => clearTimeout(id)
  }, [resendLeft])

  const toggleLargeText = () => { const next=!largeText; setLargeText(next); try{localStorage.setItem('sk_seniorMode',next?'1':'0');}catch{} }
  const toggleLightMode = () => {
    const next=!lightMode;
    setLightMode(next);
    try{localStorage.setItem('sk_darkMode',next?'0':'1');}catch{}
    document.body.classList.toggle('sk-light',next);
    document.body.classList.toggle('sk-dark',!next);
  }
  const sz = (base) => largeText ? Math.round(base * 1.35) : base

  // Supabase's "this person hasn't tapped the link in their email yet" login error
  const isNotConfirmed = (err) => !!err && (err.code === 'email_not_confirmed' || /email not confirmed/i.test(err.message || ''))

  async function handleSignUp() {
    if (!email || !password) { setError('Email and password are required.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) { setLoading(false); setError(error.message); return }
    // Supabase answers "success" with no identities when this email already has an account (it hides that on purpose).
    // Without this check the person is told to wait for an email that is never sent.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setLoading(false)
      setError('An account with this email already exists. Tap "Sign in" below, or use "Forgot password" if you don\u2019t remember it.')
      return
    }
    // Subscribe to Mailchimp — fire and forget, don't block signup
    try {
      await fetch('/api/mailchimp-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, tag: 'trial' }),
      });
    } catch(e) { console.warn('Mailchimp subscribe failed:', e); }
    setLoading(false)
    // If email confirmation is ever switched off in Supabase, sign-up returns a live session: just sign them in.
    if (data?.session) {
      await setTrialStartDate(data.user.id)
      onSuccess(data.user)
      return
    }
    // Otherwise: a dedicated "check your email" step. (It used to flip to the Sign In form, which invited people to
    // press Sign In before they had tapped the link, and then showed them a bare "Email not confirmed".)
    setPendingEmail(email.trim())
    setResendLeft(30)
    setConfirmNote(null); setError(''); setMessage('')
    setMode('confirm')
  }

  async function handleSignIn() {
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (isNotConfirmed(error)) {
        setPendingEmail(email.trim())
        setConfirmNote({ text: 'Your email isn\u2019t confirmed yet. Open the email we sent and tap the button in it first, then come back here.', bad: true })
        setError(''); setMessage('')
        setMode('confirm')
        return
      }
      setError(error.message); return
    }
    // Set trial start date on first login — no-op if already set
    await setTrialStartDate(data.user.id)
    onSuccess(data.user)
  }

  // "I've tapped the link — sign me in": uses the email and password they already typed
  async function handleConfirmedContinue() {
    if (!email || !password) { setMode('signin'); setError('Enter your email and password to sign in.'); return }
    setLoading(true); setConfirmNote(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (isNotConfirmed(error)) {
        setConfirmNote({ text: 'We can\u2019t see a confirmation yet. Tap the button in the email first (check Spam or Junk too), then try again. If you asked for more than one email, use the newest one.', bad: true })
      } else {
        setConfirmNote({ text: error.message, bad: true })
      }
      return
    }
    await setTrialStartDate(data.user.id)
    onSuccess(data.user)
  }

  async function handleResend() {
    if (!pendingEmail || resending || resendLeft > 0) return
    setResending(true); setConfirmNote(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: pendingEmail,
      options: { emailRedirectTo: window.location.origin }
    })
    setResending(false)
    setResendLeft(60)
    if (error) {
      const limited = error.status === 429 || /rate|too many|seconds|wait/i.test(error.message || '')
      setConfirmNote({ text: limited ? 'Please wait a minute before asking for another email.' : 'We couldn\u2019t send that just now. Please try again in a minute.', bad: true })
      return
    }
    setConfirmNote({ text: 'Sent! Look for the newest email (check Spam or Junk too). Only the newest link works.', bad: false })
  }

  async function handleReset() {
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) { setError(error.message); return }
    setMessage('Password reset email sent. Check your inbox \u2014 and your Spam or Junk folder if you don\u2019t see it.')
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{...styles.modal, position:'relative'}} onClick={e => e.stopPropagation()}>
        {/* Accessibility toggles */}
        <div style={{position:'absolute',top:12,right:44,display:'flex',gap:6}}>
          <button onClick={toggleLightMode} title={lightMode?"Dark Mode":"Light Mode"} style={{background:'none',border:'1px solid #ddd',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:sz(14),color:'#6b728e'}}>{lightMode?'🌙':'☀️'}</button>
          <button onClick={toggleLargeText} title={largeText?"Normal Text":"Large Text"} style={{background:largeText?'#1B3D2F':'none',border:'1px solid '+(largeText?'#1B3D2F':'#ddd'),borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:sz(14),color:largeText?'#fff':'#6b728e'}}>{largeText?'Aa✓':'Aa'}</button>
        </div>
        <div style={styles.header}>
          <div style={{...styles.logo,fontSize:sz(18)}}>🍽️ Smart Kitchen</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <h2 style={{...styles.title,fontSize:sz(22)}}>
          {mode === 'signup' && 'Start Your Free 30-Day Trial'}
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'reset' && 'Reset Password'}
          {mode === 'confirm' && 'Check Your Email'}
        </h2>
        {mode === 'signup' && (
          <p style={{...styles.subtitle,fontSize:sz(14)}}>No credit card required. Full access for 30 days.</p>
        )}

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={{...styles.success, fontSize: sz(14), lineHeight: 1.6}}>{message}</div>}

        {mode === 'confirm' && (
          <div data-testid="confirm-panel">
            <p style={{ ...styles.subtitle, fontSize: sz(15), color: '#333', lineHeight: 1.5, margin: '0 0 12px' }}>
              We sent a confirmation link to <strong style={{ wordBreak: 'break-all' }}>{pendingEmail}</strong>.
            </p>
            <ol style={{ margin: '0 0 12px', paddingLeft: 22, fontSize: sz(14), color: '#333', lineHeight: 1.6 }}>
              <li>Open that email. It can take a minute or two.</li>
              <li>Tap the button in it.</li>
              <li>Come back here and tap the button below.</li>
            </ol>
            <p style={{ margin: '0 0 14px', fontSize: sz(13), color: '#666', lineHeight: 1.5 }}>
              Can{'\u2019'}t find it? Check your <strong>Spam</strong>, <strong>Junk</strong> or <strong>Promotions</strong> folder.
            </p>
            {confirmNote && (
              <div style={confirmNote.bad ? styles.error : styles.success} role="status">{confirmNote.text}</div>
            )}
            <div style={styles.form}>
              <button style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleConfirmedContinue} disabled={loading}>
                {loading ? 'Please wait...' : 'I\u2019ve confirmed \u2014 sign me in'}
              </button>
              <button
                style={{ ...styles.primaryBtn, background: 'none', color: '#1B3D2F', border: '2px solid #1B3D2F', opacity: (resending || resendLeft > 0) ? 0.55 : 1 }}
                onClick={handleResend}
                disabled={resending || resendLeft > 0}
              >
                {resending ? 'Sending...' : resendLeft > 0 ? `Send another email (${resendLeft}s)` : 'Send another email'}
              </button>
            </div>
            <div style={styles.footer}>
              <button style={styles.linkBtn} onClick={() => { setMode('signup'); setConfirmNote(null); setError(''); setMessage('') }}>Use a different email</button>
            </div>
          </div>
        )}
        {mode !== 'confirm' && (<>
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
              {onShowGuestViewer && <><br/><button style={{...styles.linkBtn,color:'#4a1d96',marginTop:8}} onClick={onShowGuestViewer}>👁 Have a family code?</button></>}
            </span>
          )}
          {mode === 'reset' && (
            <button style={styles.linkBtn} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Back to sign in</button>
          )}
        </div>

        {mode === 'signup' && onShowGuestViewer && (
          <div style={{textAlign:'center', marginTop: 12}}>
            <button onClick={onShowGuestViewer} style={{background:'none',border:'none',color:'#4a1d96',cursor:'pointer',fontSize:13,fontWeight:600,textDecoration:'underline'}}>👁 Have a family code? Enter it here</button>
          </div>
        )}
        {mode === 'signup' && (
          <div style={styles.trialBadge}>
            ✓ 30-day free trial · ✓ No credit card · ✓ Cancel anytime
          </div>
        )}
        </>)}
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
  logo: { fontSize: '18px', fontWeight: '700', color: '#1B3D2F' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888', padding: '4px' },
  title: { margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#1B3D2F' },
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
    background: '#c8963e', color: '#12291F', fontSize: '15px',
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
