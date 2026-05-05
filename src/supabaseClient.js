import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// Get current user profile including tier and trial info
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

// Set trial start date on first login only
export async function setTrialStartDate(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_start_date, trial_ends_at')
    .eq('id', userId)
    .single()

  // Only set if not already set (first login only)
  if (profile && !profile.trial_start_date) {
    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + 30)

    await supabase
      .from('profiles')
      .update({
        trial_start_date: now.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
      })
      .eq('id', userId)
  }
}

// Calculate trial days remaining
export function trialDaysRemaining(trialEndsAt) {
  if (!trialEndsAt) return 0
  const end = new Date(trialEndsAt)
  const now = new Date()
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

// Check if user is in active trial
export function isInTrial(profile) {
  if (!profile) return false
  if (profile.subscription_status === 'active') return false
  return trialDaysRemaining(profile.trial_ends_at) > 0
}

// Get tier display name
export function getTierName(tier) {
  const names = { free: 'Free', solo: 'Solo', family: 'Family', medical: 'Medical+' }
  return names[tier] || 'Free'
}

// Mark a trial touchpoint as shown
export async function markTouchpoint(userId, key) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_touchpoints')
    .eq('id', userId)
    .single()

  const current = profile?.trial_touchpoints || {}
  current[key] = new Date().toISOString()

  await supabase
    .from('profiles')
    .update({ trial_touchpoints: current })
    .eq('id', userId)
}

// Check if a touchpoint has been shown
export async function hasTouchpoint(userId, key) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_touchpoints')
    .eq('id', userId)
    .single()

  return !!(profile?.trial_touchpoints?.[key])
}
