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

// ── CLOUD SYNC ──────────────────────────────────────────────────────────────

// Keys to sync to Supabase (photos stay local)
const SYNC_MAP = {
  inventory:            'sk_inventory',
  family_profiles:      'sk_familyProfiles',
  family_size:          'sk_familySize',
  meal_plan:            'sk_mealPlan',
  family_recipes:       'sk_familyRecipes',
  recipe_ratings:       'sk_recipeRatings',
  dessert_ratings:      'sk_dessertRatings',
  made_it_history:      'sk_madeItHistory',
  change_meal_history:  'sk_changeMealHistory',
  leftover_history:     'sk_leftoverHistory',
  shopping_list:        'sk_shoppingList',
  recipes:              'sk_recipes',
  desserts:             'sk_desserts',
  sports_nights:        'sk_sportsNights',
  restock_queue:        'sk_restockQueue',
  sale_items:           'sk_saleItems',
  yield_history:        'sk_yieldHistory',
  recipe_site:          'sk_recipeSite',
  shop_partner_name:    'sk_shopPartnerName',
  shop_partner_email:   'sk_shopPartnerEmail',
  senior_mode:          'sk_seniorMode',
  dark_mode:            'sk_darkMode',
  setup_done:           'sk_setupDone',
};

// Load all user data from Supabase into localStorage on app start
export async function loadCloudData(userId) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;

    // Write each field to localStorage — ONLY overwrite if cloud data is non-empty
    // This prevents a bad/empty cloud record from wiping good local data
    Object.entries(SYNC_MAP).forEach(([dbCol, lsKey]) => {
      if (data[dbCol] === null || data[dbCol] === undefined) return;
      try {
        // For arrays: only overwrite local if cloud has actual items
        if (Array.isArray(data[dbCol])) {
          const localRaw = localStorage.getItem(lsKey);
          const localArr = localRaw ? JSON.parse(localRaw) : [];
          // Use cloud data only if it has more items OR local is empty
          if (data[dbCol].length > 0 || localArr.length === 0) {
            localStorage.setItem(lsKey, JSON.stringify(data[dbCol]));
          }
          return;
        }
        // For objects: only overwrite if cloud object has keys
        if (typeof data[dbCol] === 'object' && !Array.isArray(data[dbCol])) {
          if (Object.keys(data[dbCol]).length > 0) {
            localStorage.setItem(lsKey, JSON.stringify(data[dbCol]));
          }
          return;
        }
        // Primitives: always overwrite
        localStorage.setItem(lsKey, String(data[dbCol]));
      } catch(e) {}
    });

    return true;
  } catch(e) {
    console.warn('Cloud load failed:', e.message);
    return false;
  }
}

// Save all user data from localStorage to Supabase
export async function saveCloudData(userId) {
  try {
    const row = { user_id: userId, updated_at: new Date().toISOString() };

    Object.entries(SYNC_MAP).forEach(([dbCol, lsKey]) => {
      try {
        const raw = localStorage.getItem(lsKey);
        if (raw === null) return;
        // Try to parse JSON, fall back to raw string/boolean
        try {
          let parsed = JSON.parse(raw);
          // Strip photo/image data before saving to cloud (photos stay local)
          if (dbCol === 'inventory' && Array.isArray(parsed)) {
            parsed = parsed.map(item => {
              const { photo, image, imageData, ...rest } = item;
              return rest;
            });
          }
          if (dbCol === 'family_recipes' && Array.isArray(parsed)) {
            parsed = parsed.map(r => {
              const { photo, ...rest } = r;
              return rest;
            });
          }
          if (dbCol === 'meal_plan' && Array.isArray(parsed)) {
            parsed = parsed.map(day => {
              if (!day) return day;
              const { photo, ...rest } = day;
              return rest;
            });
          }
          row[dbCol] = parsed;
        } catch {
          // Booleans stored as "1"/"0" or "true"/"false"
          if (raw === '1' || raw === 'true') row[dbCol] = true;
          else if (raw === '0' || raw === 'false') row[dbCol] = false;
          else row[dbCol] = raw;
        }
      } catch(e) {}
    });

    const { error } = await supabase
      .from('user_data')
      .upsert(row, { onConflict: 'user_id' });

    if (error) console.warn('Cloud save failed:', error.message);
    return !error;
  } catch(e) {
    console.warn('Cloud save error:', e.message);
    return false;
  }
}

// Save a single field to Supabase (for real-time saves)
export async function saveCloudField(userId, dbCol, value) {
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert(
        { user_id: userId, [dbCol]: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) console.warn('Cloud field save failed:', error.message);
    return !error;
  } catch(e) {
    return false;
  }
}
