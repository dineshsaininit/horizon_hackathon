// src/utils/privacy.js

// A lightweight obfuscation utility for deterministic search queries.
// It converts strings to a safe base64 representation.
// Note: This provides basic privacy layer (obfuscation) rather than
// cryptographically secure encryption (like AES), ensuring determinism
// for querying databases cleanly.

const SHIFT_VAL = 3;

/**
 * Encodes a string (e.g. Aadhar, Mobile) securely for database storage.
 */
export const encodeData = (str) => {
  if (!str) return str;
  const chars = str.split('').map(c => String.fromCharCode(c.charCodeAt(0) + SHIFT_VAL)).join('');
  return btoa(chars);
};

/**
 * Decodes obfuscated string back to regular usable data.
 */
export const decodeData = (encodedStr) => {
  if (!encodedStr) return encodedStr;
  try {
    const chars = atob(encodedStr);
    return chars.split('').map(c => String.fromCharCode(c.charCodeAt(0) - SHIFT_VAL)).join('');
  } catch (err) {
    // Return original if it fails to decode (legacy data fail-safe)
    return encodedStr;
  }
};

/**
 * Masks an Aadhar number. (123456789012 -> 1234xxxx9012)
 */
export const maskAadhar = (aadhar) => {
  if (!aadhar) return '';
  const str = String(aadhar).trim();
  // If it's shorter than 8 digits, don't mask blindly
  if (str.length < 8) return str;
  
  const first4 = str.substring(0, 4);
  const last4 = str.substring(str.length - 4);
  const middleMask = 'x'.repeat(str.length - 8);
  
  return `${first4}${middleMask}${last4}`;
};
