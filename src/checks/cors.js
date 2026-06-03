import { createFinding } from '../core/utils.js';
import { fetchUrl } from '../core/httpClient.js';

export const checkCors = async (url, response, options = { reflectiveTest: false, timeout: 4000 }) => {
  const findings = [];
  const headers = response.headers || {};

  const aco = headers['access-control-allow-origin'];
  const acc = headers['access-control-allow-credentials'];

  // Check 1: Static "Trust Everyone + Cookies" check
  if (aco) {
    const allowOrigin = String(aco).trim();
    const allowCreds = String(acc || '').trim().toLowerCase();

    if (allowOrigin === '*' && allowCreds === 'true') {
      findings.push(createFinding({
        severity: 'HIGH',
        cwe: 'CWE-942',
        // CVE-2019-17556: Apache Olingo CORS check bypass
        // CVE-2018-14721: Jackson Databind CORS issue
        cve: ['CVE-2019-17556', 'CVE-2018-14721'],
        title: 'CORS Misconfiguration: Wildcard Origin with Credentials',
        description: 'Access-Control-Allow-Origin is "*" while credentials are allowed. This is a critical risk.',
        affectedUrls: [url],
        evidence: {
          'access-control-allow-origin': allowOrigin,
          'access-control-allow-credentials': allowCreds,
        },
        remediation: 'Do not use "*" with credentials. Whitelist specific trusted origins.'
      }));
    }
  }

  // Check 2: Reflective Origin Test (Active Probe)
  if (options.reflectiveTest) {
    try {
      const evilOrigin = 'https://attacker.com';
      const res2 = await fetchUrl(url, {
        timeout: options.timeout,
        headers: { Origin: evilOrigin }
      });

      const aco2 = res2.headers?.['access-control-allow-origin'];
      const acc2 = res2.headers?.['access-control-allow-credentials'];

      if (aco2 && String(aco2).trim() === evilOrigin && String(acc2).toLowerCase() === 'true') {
        findings.push(createFinding({
          severity: 'HIGH',
          cwe: 'CWE-942',
          // CVE-2020-2509: QNAP NAS CORS vulnerability (allowed arbitrary origins)
          // CVE-2022-25927: Ubiquiti UniFi Network CORS bypass
          cve: ['CVE-2020-2509', 'CVE-2022-25927'],
          title: 'CORS Misconfiguration: Reflective Origin',
          description: 'The server blindly reflects the Origin header and allows credentials.',
          affectedUrls: [url],
          evidence: { sentOrigin: evilOrigin, returnedAcaOrigin: aco2 },
          remediation: 'Validate the Origin header against a strict allowlist before reflecting it.'
        }));
      }
    } catch {
      // Ignore network errors on the probe
    }
  }

  return findings;
};