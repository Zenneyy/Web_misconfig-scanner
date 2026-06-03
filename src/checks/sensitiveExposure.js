import { createFinding, looksLikeSensitiveContent, redactSecrets } from '../core/utils.js';
import { fetchUrl } from '../core/httpClient.js';
import { SENSITIVE_FILES } from '../core/constants.js';

export const checkSensitiveFiles = async (targetUrl, timeout = 3000) => {
  const findings = [];
  let origin;
  try {
    origin = new URL(targetUrl).origin;
  } catch { return findings; }

  // Map files to promises for concurrent checking
  const tasks = SENSITIVE_FILES.map(async (file) => {
    const fileUrl = `${origin}/${file}`;
    
    // Fast fail fetch (don't download 100MB files, just check status)
    const res = await fetchUrl(fileUrl, { timeout });

    if (res.status === 200) {
      const body = String(res.data || '');
      
      // 🛡️ Guard: Only report if it actually looks like the file type
      // (Prevents reporting Custom 404 pages as leaks)
      if (looksLikeSensitiveContent(file, body)) {
        return createFinding({
          severity: 'CRITICAL',
          cwe: 'CWE-530',
          // CVE-2019-5418: Rails Arbitrary File Read (Reading sensitive configs)
          // CVE-2020-3452: Cisco ASA Read-Only Path Traversal (Reading webvpn.conf)
          cve: ['CVE-2019-5418', 'CVE-2020-3452'],
          title: `Sensitive File Exposed: ${file}`,
          description: `The file ${file} is publicly accessible and contains sensitive configuration data.`,
          affectedUrls: [fileUrl],
          evidence: {
            // Redact secrets before putting them in the report!
            snippet: redactSecrets(body.slice(0, 300)) 
          },
          remediation: `Immediately remove ${file} from the web root or block access via server configuration.`
        });
      }
    }
    return null;
  });

  // execute all checks
  const results = await Promise.all(tasks);
  
  // filter out nulls
  return results.filter(r => r !== null);
};