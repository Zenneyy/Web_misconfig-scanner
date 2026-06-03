import { createFinding } from '../core/utils.js';

export const checkCookies = (url, response) => {
  const findings = [];
  const headers = response.headers || {};
  
  // Safely handle "Set-Cookie" which can be a string OR an array of strings
  let cookies = headers['set-cookie'];
  if (!cookies) return findings;
  if (!Array.isArray(cookies)) cookies = [cookies];

  cookies.forEach((cookieStr) => {
    const raw = String(cookieStr);
    const lower = raw.toLowerCase();
    
    // 🛡️ Robust Attribute Detection
    // Regex matches "; secure" or ";secure" at the end, avoiding false positives on cookie values
    const hasSecure = /(^|;)\s*secure($|;)/i.test(lower);
    const hasHttpOnly = /(^|;)\s*httponly($|;)/i.test(lower);
    
    const sameSiteMatch = lower.match(/samesite\s*=\s*(lax|strict|none)/i);
    const sameSite = sameSiteMatch ? sameSiteMatch[1].toUpperCase() : null;

    const isHttps = url.startsWith('https://');
    // Truncate cookie for evidence display
    const cookieName = raw.split('=')[0]; 
    const evidenceSnippet = raw.length > 50 ? raw.slice(0, 50) + '...' : raw;

    // 1. Missing Secure Flag (Critical on HTTPS)
    if (isHttps && !hasSecure) {
      findings.push(createFinding({
        severity: 'HIGH',
        cwe: 'CWE-614',
        // Real-world Session Hijacking via cleartext
        cve:['CVE-2017-5782', 'CVE-2020-13933'],
        title: 'Cookie Missing Secure Flag',
        description: `The cookie "${cookieName}" was set over HTTPS without the Secure flag.`,
        affectedUrls: [url],
        evidence: { setCookie: evidenceSnippet },
        remediation: 'Add the Secure flag to all cookies sent over HTTPS.'
      }));
    }

    // 2. Missing HttpOnly
    if (!hasHttpOnly) {
      findings.push(createFinding({
        severity: 'MEDIUM',
        cwe: 'CWE-1004',
        // Real-world XSS Cookie Theft
        cve:['CVE-2021-25036', 'CVE-2020-11022'],
        title: 'Cookie Missing HttpOnly Flag',
        description: `The cookie "${cookieName}" is accessible via JavaScript (XSS risk).`,
        affectedUrls: [url],
        evidence: { setCookie: evidenceSnippet },
        remediation: 'Add the HttpOnly flag to session cookies to prevent theft via XSS.'
      }));
    }

    // 3. Unsafe SameSite Configuration
    if (sameSite === 'NONE' && !hasSecure) {
      findings.push(createFinding({
        severity: 'HIGH',
        cwe: 'CWE-1275',
        // Real-world CSRF via SameSite=None without Secure
        cve:['CVE-2020-8022', 'CVE-2020-15647'],
        title: 'SameSite=None without Secure',
        description: 'Cookies with SameSite=None must also set the Secure flag to be accepted by modern browsers.',
        affectedUrls: [url],
        evidence: { setCookie: evidenceSnippet },
        remediation: 'Update cookie attributes to "SameSite=None; Secure".'
      }));
    }
  });

  return findings;
};