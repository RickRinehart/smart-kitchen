import React, { useState, useEffect } from 'react'
import { setViewerCode, getViewerCode, getActiveViewers, revokeViewer, revokeAllViewers, joinAsViewer, loadCloudData } from './supabaseClient'

const PURPLE = '#4a1d96'
const LIGHT_PURPLE = '#f5f3ff'
const NAVY = '#1A2344'

export function ViewerCodeManager({ user, isViewer, viewerRole }) {
  const [code, setCode] = useState('')
  const [savedCode, setSavedCode] = useState(null)
  const [viewers, setViewers] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || isViewer) return
    getViewerCode(user.id).then(data => {
      if (data) {
        setSavedCode(data)
        setCode(data.code)
      }
    })
    getActiveViewers(user.id).then(setViewers)
  }, [user, isViewer])

  if (isViewer) {
    return (
      <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
        You are viewing {viewerRole?.label || 'a family'} account in read-only mode.
        To manage viewer codes, sign in with your own account.
      </div>
    )
  }

  async function handleSave() {
    if (!user) return
    setLoading(true)
    setMsg('')
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const result = await setViewerCode(user.id, clean)
    if (result.error) {
      setMsg('❌ ' + result.error)
    } else {
      setSavedCode({ code: result.code })
      setMsg('✓ Code saved! Share "' + result.code + '" with family members.')
    }
    setLoading(false)
  }

  async function handleRevoke(roleId) {
    if (!user) return
    const ok = await revokeViewer(user.id, roleId)
    if (ok) {
      setViewers(prev => prev.filter(v => v.id !== roleId))
      setMsg('✓ Viewer access revoked.')
    }
  }

  async function handleRevokeAll() {
    if (!user || !window.confirm('Revoke access for all viewers? They will need the code to rejoin.')) return
    await revokeAllViewers(user.id)
    setViewers([])
    setMsg('✓ All viewer access revoked.')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="e.g. RINEHART or FAMILY47"
          maxLength={12}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #c4b5fd', fontSize: 14, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase',
            background: '#fff', color: PURPLE,
            fontFamily: 'Arial, sans-serif'
          }}
        />
        <button
          onClick={handleSave}
          disabled={loading || code.length < 4}
          style={{
            background: PURPLE, color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
            opacity: loading || code.length < 4 ? 0.5 : 1
          }}
        >{loading ? '...' : 'Save Code'}</button>
      </div>

      {savedCode && (
        <div style={{ background: '#ede9fe', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: PURPLE }}>
          Current code: <strong style={{ letterSpacing: 2, fontSize: 15 }}>{savedCode.code}</strong>
          {' '} — share this with family members to give them read-only access
        </div>
      )}

      {msg && <div style={{ fontSize: 12, color: msg.startsWith('❌') ? '#dc2626' : '#16a34a', marginBottom: 8 }}>{msg}</div>}

      {viewers.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
            Active Viewers ({viewers.length}):
          </div>
          {viewers.map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dotted #e5e7eb' }}>
              <div>
                <span style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>{v.label}</span>
                <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>
                  joined {new Date(v.joined_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => handleRevoke(v.id)}
                style={{ background: 'transparent', border: '1px solid #dc2626', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}
              >Revoke</button>
            </div>
          ))}
          <button
            onClick={handleRevokeAll}
            style={{ marginTop: 8, background: 'transparent', border: '1px solid #888', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#666', cursor: 'pointer' }}
          >Revoke All Access</button>
        </div>
      )}
    </div>
  )
}

export function JoinAsViewerModal({ user, onJoined, onClose }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (!user || code.length < 4) return
    setLoading(true)
    setError('')
    const result = await joinAsViewer(user.id, code)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    // Load the owner's data
    const loaded = await loadCloudData(result.ownerUserId)
    if (loaded) window.dispatchEvent(new Event('sk_cloud_loaded'))
    onJoined(result)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: PURPLE, marginBottom: 8 }}>👁 Join as Viewer</div>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
          Enter the viewer code shared by your family member to see their meal plan and inventory in read-only mode.
        </div>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Enter code e.g. RINEHART"
          maxLength={12}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: '2px solid #c4b5fd', fontSize: 18, fontWeight: 700,
            letterSpacing: 3, textTransform: 'uppercase',
            color: PURPLE, marginBottom: 12, boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif', textAlign: 'center'
          }}
        />
        {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button
          onClick={handleJoin}
          disabled={loading || code.length < 4}
          style={{
            width: '100%', background: PURPLE, color: '#fff', border: 'none',
            borderRadius: 10, padding: 14, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', marginBottom: 10,
            opacity: loading || code.length < 4 ? 0.5 : 1
          }}
        >{loading ? 'Joining...' : 'Join as Viewer'}</button>
        <button
          onClick={onClose}
          style={{ width: '100%', background: 'transparent', border: '1px solid #ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#888', cursor: 'pointer' }}
        >Cancel</button>
      </div>
    </div>
  )
}
