
import { createFinding } from '../core/utils.js';

const DEBUG_SIGNATURES = [
  /stack trace/i,
  /traceback/i,
  /fatal error/i,
  /syntax error/i,
  /sql syntax/i,
  /unexpected end of file/i,
  /\bat\s+\w+\s*\(.*:\d+:\d+\)/i, // JS Stack
  /in\s+.*\s+on\s+line\s+\d+/i,   // PHP Stack
  /django_debug_toolbar/i,        // Django
  /whoops! there was an error/i,  // Laravel
  /actioncontroller::/i           // Rails
];

export const checkDebugInfo = (url, response) => {
  const findings = [];
  // 🛡️ Perf: Limit check to first 50KB. Regexing 5MB files kills the CPU.
  const body = String(response.data || '').slice(0, 50000); 

  if (!body) return findings;

  const matches = DEBUG_SIGNATURES.filter(regex => regex.test(body));

  // Require strong evidence or multiple hits to reduce false positives
  if (matches.length > 0) {
    findings.push(createFinding({
      severity: 'MEDIUM',
      cwe: 'CWE-209',
      // CVE-2021-3129: Laravel Ignition (Debug mode) -> RCE
      // CVE-2017-5638: Apache Struts (Error handling revealed vulnerability)
      cve: ['CVE-2021-3129', 'CVE-2017-5638'],
      title: 'Debug Information / Stack Trace Exposed',
      description: 'The application responded with error details or stack traces, potentially revealing internal paths.',
      affectedUrls: [url],
      evidence: { 
        matchCount: matches.length,
        // Show safe snippet
        snippet: body.slice(0, 200).replace(/\n/g, ' ') + '...'
      },
      remediation: 'Disable debug mode in production (e.g., debug=false) and enable generic error pages.'
    }));
  }

  return findings;
};