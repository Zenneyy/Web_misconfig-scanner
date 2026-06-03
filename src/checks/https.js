import { createFinding } from '../core/utils.js';
import { fetchUrl } from '../core/httpClient.js';

export const checkHttpsEnforcement = async (targetUrl, timeout = 8000) => {
  const findings = [];
  let origin;
  try {
    origin = new URL(targetUrl).origin;
  } catch { return findings; }

  // Force start at HTTP
  const httpOrigin = origin.replace(/^https:\/\//i, 'http://');
  
  let current = httpOrigin;
  let sawHttps = false;
  const chain = [];
  const maxHops = 5;

  for (let hop = 0; hop < maxHops; hop++) {
    const res = await fetchUrl(current, { timeout });
    if (res.status === 0) break; // Network error

    const final = res.finalUrl || current;
    if (final.startsWith('https://')) sawHttps = true;

    // Is it a redirect?
    if (res.status >= 300 && res.status < 400 && res.redirectLocation) {
      const nextUrl = new URL(res.redirectLocation, current).href;
      chain.push({ from: current, to: nextUrl, status: res.status });

      // Check for Downgrade (HTTPS -> HTTP)
      if (sawHttps && nextUrl.startsWith('http://')) {
        findings.push(createFinding({
          severity: 'HIGH',
          cwe: 'CWE-319',
          // CVE-2009-3555: The famous TLS Renegotiation MITM (Classic Downgrade example)
          // CVE-2020-13933: Apache Shiro authentication bypass via protocol confusion
          cve: ['CVE-2009-3555', 'CVE-2020-13933'],
          title: 'HTTPS Downgrade in Redirect Chain',
          description: 'The redirect chain switches from HTTPS back to HTTP, creating a man-in-the-middle opportunity.',
          affectedUrls: [httpOrigin],
          evidence: { chain },
          remediation: 'Ensure all redirects stay on HTTPS once established.'
        }));
        break;
      }

      current = nextUrl;
      continue;
    }

    // End of chain. Did we end up on HTTP?
    if ((res.finalUrl || current).startsWith('http://')) {
      findings.push(createFinding({
        severity: 'HIGH',
        cwe: 'CWE-319',
        // CVE-2017-5782: Oracle EBS cleartext transmission vulnerability
        // CVE-2023-32762: Weak enforcement leading to data exposure
        cve: ['CVE-2017-5782', 'CVE-2023-32762'],
        title: 'Missing HTTP → HTTPS Enforcement',
        description: 'The site is accessible over HTTP without enforcing a redirect to HTTPS.',
        affectedUrls: [httpOrigin],
        evidence: { finalUrl: res.finalUrl || current, status: res.status },
        remediation: 'Configure the web server to redirect all HTTP traffic to HTTPS.'
      }));
    }
    break;
  }

  return findings;
};