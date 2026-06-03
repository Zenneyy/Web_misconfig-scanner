import { createFinding } from '../core/utils.js';


// Helper: Safely extracts a header value
const getHeader = (headers, key) => {
  const val = headers[key.toLowerCase()];
  if (!val) return null;
  return Array.isArray(val) ? val.join(', ') : String(val);
};

// Robust check for weak CSP
const isWeakCsp = (cspValue) => {
  const csp = cspValue.toLowerCase();
  return csp.includes("'unsafe-inline'") && 
        !csp.includes("'nonce-") && 
        !csp.includes("'sha256-") && 
        !csp.includes("'sha384-");
};

export const checkSecurityHeaders = (url, response) => {
  const findings = [];
  const headers = response.headers || {};
  const isHttps = url.startsWith('https://');

  // 1. HSTS (Strict-Transport-Security)
  const hsts = getHeader(headers, 'strict-transport-security');
  if (isHttps && !hsts) {
    findings.push(createFinding({
      severity: 'HIGH',
      cwe: 'CWE-319',
      // Examples of SSL Stripping / Downgrade Attacks
      cve : ['CVE-2023-32762', 'CVE-2017-5782'],
      title: 'Missing HSTS Header',
      description: 'The site is served over HTTPS but does not enforce it via Strict-Transport-Security.',
      affectedUrls: [url],
      evidence: { header: 'strict-transport-security', present: false },
      remediation: 'Set Strict-Transport-Security: max-age=31536000; includeSubDomains.'
    }));
  }

  // 2. CSP (Content-Security-Policy)
  const csp = getHeader(headers, 'content-security-policy');
  if (!csp) {
    findings.push(createFinding({
      severity: 'MEDIUM',
      cwe: 'CWE-693',
      //Famous XSS vulnerabilities that CSP would have stopped
      cve: ['CVE-2021-25036', 'CVE-2020-11022'],
      title: 'Missing Content-Security-Policy',
      description: 'No CSP header is present, increasing vulnerability to Cross-Site Scripting (XSS).',
      affectedUrls: [url],
      evidence: { header: 'content-security-policy', present: false },
      remediation: 'Implement a strict CSP to restrict resource loading.'
    }));
  } else if (isWeakCsp(csp)) {
    findings.push(createFinding({
      severity: 'LOW',
      cwe: 'CWE-693',
      //XSS enabled by unsafe-inline
      cve: ['CVE-2016-1000028'],
      title: 'Weak Content-Security-Policy',
      description: "CSP allows 'unsafe-inline' without nonces or hashes.",
      affectedUrls: [url],
      evidence: { cspSnippet: csp.length > 100 ? csp.slice(0, 100) + '...' : csp },
      remediation: 'Remove unsafe-inline. Use nonces or hashes for inline scripts.'
    }));
  }

  // 3. Clickjacking (X-Frame-Options OR CSP frame-ancestors)
  const xfo = getHeader(headers, 'x-frame-options');
  const hasFrameAncestors = csp && csp.toLowerCase().includes('frame-ancestors');
  
  if (!xfo && !hasFrameAncestors) {
    findings.push(createFinding({
      severity: 'MEDIUM',
      cwe: 'CWE-1021',
      // Famous Clickjacking vulnerabilities
      cve: ['CVE-2022-3260', 'CVE-2018-17192'],
      title: 'Missing Clickjacking Protection',
      description: 'Neither X-Frame-Options nor CSP frame-ancestors is set.',
      affectedUrls: [url],
      evidence: { xFrameOptions: 'missing', cspFrameAncestors: 'missing' },
      remediation: 'Set X-Frame-Options: DENY or configure CSP frame-ancestors.'
    }));
  }

  // 4. X-Content-Type-Options
  const xcto = getHeader(headers, 'x-content-type-options');
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    findings.push(createFinding({
      severity: 'LOW',
      cwe: 'CWE-693',
      //MIME Sniffing XSS examples
      cve: ['CVE-2024-43445', 'CVE-2020-11023'],
      title: 'Missing or Weak X-Content-Type-Options',
      description: 'Header is missing or not set to "nosniff", risking MIME confusion attacks.',
      affectedUrls: [url],
      evidence: { header: 'x-content-type-options', value: xcto || 'missing' },
      remediation: 'Set X-Content-Type-Options: nosniff'
    }));
  }

  // 5. Referrer-Policy (ADDED - Was missing)
  const refPol = getHeader(headers, 'referrer-policy');
  if (!refPol) {
    findings.push(createFinding({
      severity: 'LOW',
      cwe: 'CWE-693',
      // Info leaks via headers
      cve: ['CVE-2018-1000861'],
      title: 'Missing Referrer-Policy',
      description: 'Controls how much referrer information is included with requests.',
      affectedUrls: [url],
      evidence: { header: 'referrer-policy', present: false },
      remediation: 'Set Referrer-Policy: strict-origin-when-cross-origin'
    }));
  }

  // 6. Permissions-Policy (ADDED - Was missing)
  const permPol = getHeader(headers, 'permissions-policy');
  if (!permPol) {
    findings.push(createFinding({
      severity: 'INFO',
      cwe: 'CWE-693',
      // Keeping empty for now as no specific CVEs found
      cve: [],
      title: 'Missing Permissions-Policy',
      description: 'Allows site to restrict browser features (camera, mic, geolocation).',
      affectedUrls: [url],
      evidence: { header: 'permissions-policy', present: false },
      remediation: 'Set Permissions-Policy header to disable unused features.'
    }));
  }

  // 7. Info Disclosure (Server, X-Powered-By)
  const server = getHeader(headers, 'server');
  const poweredBy = getHeader(headers, 'x-powered-by');
  if (server || poweredBy) {
    findings.push(createFinding({
      severity: 'INFO',
      cwe: 'CWE-200',
      //Reconnaissance leading to exploit
      cve: ['CVE-2017-5638'],
      title: 'Server Information Disclosure',
      description: 'Response headers disclose backend technology details.',
      affectedUrls: [url],
      evidence: { server: server || null, xPoweredBy: poweredBy || null },
      remediation: 'Configure the server/framework to suppress these headers.'
    }));
  }

  return findings;
};