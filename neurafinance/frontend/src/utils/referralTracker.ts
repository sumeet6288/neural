'use client';

/**
 * Referral Tracking Utility
 * Handles URL parameter reading, localStorage persistence, and referral registration
 */

const REFERRAL_STORAGE_KEY = 'neurafinance_referrer';
const REFERRAL_REGISTERED_KEY = 'neurafinance_referral_registered';

/**
 * Extract referral address from URL query params
 */
export function extractReferralFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  
  if (ref && isValidAddress(ref)) {
    return ref;
  }
  return null;
}

/**
 * Store referral address in localStorage
 */
export function storeReferral(referrerAddress: string): void {
  if (typeof window === 'undefined') return;
  if (!isValidAddress(referrerAddress)) return;
  
  // Don't overwrite existing referral
  const existing = getStoredReferral();
  if (existing) return;
  
  localStorage.setItem(REFERRAL_STORAGE_KEY, referrerAddress.toLowerCase());
}

/**
 * Get stored referral address from localStorage
 */
export function getStoredReferral(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRAL_STORAGE_KEY);
}

/**
 * Check if referral has been registered on-chain
 */
export function isReferralRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REFERRAL_REGISTERED_KEY) === 'true';
}

/**
 * Mark referral as registered on-chain
 */
export function markReferralRegistered(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRAL_REGISTERED_KEY, 'true');
}

/**
 * Clear referral data (for testing/disconnect)
 */
export function clearReferralData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_REGISTERED_KEY);
}

/**
 * Generate referral link for a given wallet address
 */
export function generateReferralLink(walletAddress: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}`
    : 'https://dao.neurafinance.io';
  return `${baseUrl}/?ref=${walletAddress}`;
}

/**
 * Prevent self-referral
 */
export function isSelfReferral(userAddress: string, referrerAddress: string): boolean {
  if (!userAddress || !referrerAddress) return false;
  return userAddress.toLowerCase() === referrerAddress.toLowerCase();
}

/**
 * Basic Ethereum address validation
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Initialize referral tracking on app load
 * Should be called once on app mount
 */
export function initReferralTracking(): void {
  const refFromURL = extractReferralFromURL();
  if (refFromURL) {
    storeReferral(refFromURL);
    // Clean URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }
}
