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

// ── DIRTY TRACKING ───────────────────────────────────────────────────────────
// Distinguishes "local data actually changed" from "the periodic timer fired." Without this,
// the background auto-save (every 5 min, and whenever the tab is hidden) unconditionally
// re-pushes whatever is currently in this device's memory -- even if nothing changed here since
// the last sync. That's how two devices fight: Device A saves a fresh edit, then Device B's own
// blind timer fires moments later and silently overwrites the cloud with Device B's stale copy,
// before Device B ever pulls A's version down. Wrapping localStorage.setItem once here catches
// every write to a synced key (current and future) without instrumenting each call site.
const DIRTY_KEY = 'sk_cloudDirty';
let _dirtyTrackingPatched = false;
function ensureDirtyTracking() {
  if (_dirtyTrackingPatched || typeof window === 'undefined' || !window.localStorage) return;
  _dirtyTrackingPatched = true;
  const syncedKeys = new Set(Object.values(SYNC_MAP));
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    if (syncedKeys.has(key)) {
      try {
        if (localStorage.getItem(key) !== value) originalSetItem(DIRTY_KEY, '1');
      } catch(e) {}
    }
    return originalSetItem(key, value);
  };
}
ensureDirtyTracking();

// True if a synced field has changed locally since the last successful save or load -- i.e.
// there's actually something worth pushing. Fails open (returns true) if the flag can't be
// read, so a storage error never silently blocks a save the user might be relying on.
export function isCloudDirty() {
  try { return localStorage.getItem(DIRTY_KEY) !== '0'; } catch(e) { return true; }
}

function clearCloudDirty() {
  try { localStorage.setItem(DIRTY_KEY, '0'); } catch(e) {}
}

// Load all user data from Supabase into localStorage on app start.
// force=true is for the explicit "Load from Cloud" button: the user has (per the app's own
// documented workflow) already manually pushed from the source device first, so this should be
// an authoritative pull -- no length-based staleness guard. force=false (default) is for
// automatic/passive loads (e.g. on sign-in) where a background pull might otherwise race a
// debounced local save and clobber fresher local edits with a stale cloud snapshot.
export async function loadCloudData(userId, force = false) {
  try {
    // SAFETY: save current local state to backup keys before loading cloud
    // This means we can always recover local data if cloud load goes wrong
    const BACKUP_KEYS = ['sk_inventory','sk_mealPlan','sk_familyProfiles',
      'sk_familySize','sk_familyRecipes','sk_recipeRatings','sk_dessertRatings',
      'sk_recipes','sk_desserts','sk_madeItHistory','sk_changeMealHistory'];
    BACKUP_KEYS.forEach(key => {
      try {
        const val = localStorage.getItem(key);
        if (val) localStorage.setItem(key + '_backup', val);
      } catch(e) {}
    });

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
          // Use cloud data if forced (explicit manual pull), or if cloud actually has MORE
          // items than local, or local is empty. The length check alone is a poor staleness
          // signal once both sides are fully populated -- e.g. meal_plan is always exactly
          // 7 entries on every device, so cloud.length > local.length (7 > 7) is never true
          // and an unforced load silently does nothing for it. That's fine for passive
          // background loads (where under-triggering is the safer failure mode), but it
          // defeated the whole point of the manual "Load from Cloud" button.
          if (force || data[dbCol].length > localArr.length || localArr.length === 0) {
            // For family_profiles: preserve Medical+ fields from local if cloud record lacks them
            if (dbCol === 'family_profiles' && localArr.length > 0) {
              const MEDICAL_FIELDS = ['medications','supplements','medicalPlan','medicalAllergies',
                'medicalAllergiesCustom','customPlanNote','enforcement'];
              const merged = data[dbCol].map(cloudProfile => {
                const localMatch = localArr.find(lp => lp.id === cloudProfile.id);
                if (!localMatch) return cloudProfile;
                const mergedProfile = { ...cloudProfile };
                MEDICAL_FIELDS.forEach(field => {
                  // Keep local value if cloud is empty/missing and local has data
                  const cloudVal = cloudProfile[field];
                  const localVal = localMatch[field];
                  const cloudEmpty = cloudVal === null || cloudVal === undefined ||
                    (Array.isArray(cloudVal) && cloudVal.length === 0);
                  const localHasData = localVal !== null && localVal !== undefined &&
                    !(Array.isArray(localVal) && localVal.length === 0);
                  if (cloudEmpty && localHasData) {
                    mergedProfile[field] = localVal;
                  }
                });
                return mergedProfile;
              });
              localStorage.setItem(lsKey, JSON.stringify(merged));
            } else {
              localStorage.setItem(lsKey, JSON.stringify(data[dbCol]));
            }
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

    clearCloudDirty();
    return true;
  } catch(e) {
    console.warn('Cloud load failed:', e.message);
    return false;
  }
}

// Restore from backup if cloud load caused data loss
export function restoreFromBackup() {
  const BACKUP_KEYS = ['sk_inventory','sk_mealPlan','sk_familyProfiles',
    'sk_familySize','sk_familyRecipes','sk_recipeRatings','sk_dessertRatings',
    'sk_recipes','sk_desserts','sk_madeItHistory','sk_changeMealHistory'];
  let restored = 0;
  BACKUP_KEYS.forEach(key => {
    try {
      const backup = localStorage.getItem(key + '_backup');
      if (backup) {
        localStorage.setItem(key, backup);
        restored++;
      }
    } catch(e) {}
  });
  return restored;
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
            // Preserve local photos — cloud copy never has photos (stripped on save)
            // Merge local photos back into cloud data before writing to localStorage
            try {
              const localRaw = localStorage.getItem('sk_familyRecipes');
              const localRecipes = localRaw ? JSON.parse(localRaw) : [];
              parsed = parsed.map(r => {
                const localMatch = localRecipes.find(lr => lr.id === r.id);
                const localPhoto = localMatch?.photo || null;
                const { photo, ...rest } = r;
                return localPhoto ? { ...rest, photo: localPhoto } : rest;
              });
            } catch(e) {
              parsed = parsed.map(r => { const { photo, ...rest } = r; return rest; });
            }
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
    else clearCloudDirty();
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

// ── USER ROLES ──────────────────────────────────────────────────────────────

// Create or update a viewer code for the owner
export async function setViewerCode(ownerId, code, label = 'Family Viewer') {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 4 || clean.length > 12) {
    return { error: 'Code must be 4-12 letters and numbers' };
  }
  try {
    // Check if code is already taken by someone else
    const { data: existing } = await supabase
      .from('viewer_codes')
      .select('owner_user_id')
      .eq('code', clean)
      .single();
    if (existing && existing.owner_user_id !== ownerId) {
      return { error: 'That code is already taken. Try a different one.' };
    }
    // Upsert
    const { error } = await supabase
      .from('viewer_codes')
      .upsert({ owner_user_id: ownerId, code: clean, label, active: true },
        { onConflict: 'owner_user_id' });
    if (error) return { error: error.message };
    return { success: true, code: clean };
  } catch(e) {
    return { error: e.message };
  }
}

// Get owner's current viewer code
export async function getViewerCode(ownerId) {
  try {
    const { data } = await supabase
      .from('viewer_codes')
      .select('*')
      .eq('owner_user_id', ownerId)
      .single();
    return data || null;
  } catch(e) { return null; }
}

// Join as viewer using a code — returns the owner's user_id if valid
export async function joinAsViewer(viewerUserId, code) {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  try {
    // Look up the code
    const { data: codeData } = await supabase
      .from('viewer_codes')
      .select('*')
      .eq('code', clean)
      .eq('active', true)
      .single();
    if (!codeData) return { error: 'Code not found or inactive. Check with the account owner.' };
    if (codeData.owner_user_id === viewerUserId) {
      return { error: 'You cannot join your own account as a viewer.' };
    }
    // Create role record
    const { error } = await supabase
      .from('account_roles')
      .upsert({
        owner_user_id: codeData.owner_user_id,
        viewer_user_id: viewerUserId,
        role: 'viewer',
        label: codeData.label,
        code_used: clean,
        active: true,
        last_seen: new Date().toISOString()
      }, { onConflict: 'viewer_user_id' });
    if (error) return { error: error.message };
    return { success: true, ownerUserId: codeData.owner_user_id };
  } catch(e) {
    return { error: e.message };
  }
}

// Check if current user is a viewer of someone else's account
export async function getViewerRole(userId) {
  try {
    const { data, error } = await supabase
      .from('account_roles')
      .select('*')
      .eq('viewer_user_id', userId)
      .eq('active', true)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch(e) { return null; }
}

// Get all active viewers for an owner
export async function getActiveViewers(ownerId) {
  try {
    const { data } = await supabase
      .from('account_roles')
      .select('*')
      .eq('owner_user_id', ownerId)
      .eq('active', true)
      .order('joined_at', { ascending: false });
    return data || [];
  } catch(e) { return []; }
}

// Revoke a viewer's access
export async function revokeViewer(ownerId, roleId) {
  try {
    const { error } = await supabase
      .from('account_roles')
      .update({ active: false })
      .eq('id', roleId)
      .eq('owner_user_id', ownerId);
    return !error;
  } catch(e) { return false; }
}

// Revoke all viewers (e.g. when changing the code)
export async function revokeAllViewers(ownerId) {
  try {
    await supabase
      .from('account_roles')
      .update({ active: false })
      .eq('owner_user_id', ownerId);
    return true;
  } catch(e) { return false; }
}
