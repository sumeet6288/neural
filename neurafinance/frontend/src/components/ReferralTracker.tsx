'use client';

import { useEffect } from 'react';
import { initReferralTracking } from '@/utils/referralTracker';

/**
 * Initialize referral tracking on app mount
 * Reads ?ref= URL param and stores in localStorage
 */
export default function ReferralTracker() {
  useEffect(() => {
    initReferralTracking();
  }, []);

  return null; // Invisible component
}
