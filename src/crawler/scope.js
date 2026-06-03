import { URL } from 'url';

/**
 * Scope management utilities
 */
export const isInScope = (url, baseUrl) => {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    return urlObj.origin === baseObj.origin;
  } catch {
    return false;
  }
};

export const normalizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    return url;
  }
};