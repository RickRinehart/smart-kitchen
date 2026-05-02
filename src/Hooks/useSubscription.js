import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useSubscription() {
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, trial_ends_at, subscription_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        const inTrial = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
        setTier(inTrial ? (profile.tier || 'family') : (profile.tier || 'free'));
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const can = {
    unlimitedRecipes:    ['solo', 'family', 'medical'].includes(tier),
    sevenDayPlan:        ['solo', 'family', 'medical'].includes(tier),
    busyNightFlag:       ['solo', 'family', 'medical'].includes(tier),
    calendarIntegration: ['solo', 'family', 'medical'].includes(tier),
    multipleProfiles:    ['family', 'medical'].includes(tier),
    medicalCompliance:   tier === 'medical',
    temporaryDiets:      tier === 'medical',
  };

  return { tier, loading, can };
}
