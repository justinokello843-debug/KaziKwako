'use client';

import { useEffect } from 'react';

export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        // 30 days is generous enough to cover "saw the link, applied later"
        localStorage.setItem('kazi_ref', ref.toUpperCase());
        localStorage.setItem('kazi_ref_saved_at', Date.now().toString());
      }
    } catch (e) {
      // localStorage can fail in some privacy modes — referral tracking just
      // silently won't apply for that visit, nothing else breaks
    }
  }, []);

  return null;
}

/** Reads back a still-valid stored referral code (or null), used by forms on submit. */
export function getStoredReferralCode() {
  try {
    const ref = localStorage.getItem('kazi_ref');
    const savedAt = parseInt(localStorage.getItem('kazi_ref_saved_at') || '0', 10);
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (ref && Date.now() - savedAt < THIRTY_DAYS) return ref;
  } catch (e) {}
  return null;
}
