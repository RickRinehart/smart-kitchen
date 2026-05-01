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
