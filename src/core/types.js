
/**
 * @typedef {'queued' | 'running' | 'completed' | 'failed'} ScanStatus
 */

/**
 * @typedef {'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'} Severity
 */

/**
 * @typedef {Object} ScanConfig
 * @property {string} targetUrl - The normalized URL to scan.
 * @property {boolean} confirmedOwnership - Legal confirmation.
 * @property {number} depth - Crawl depth (0 = single page).
 * @property {number} maxUrls - Budget for crawl.
 * @property {number} timeout - Request timeout in ms.
 * @property {boolean} skipSensitive - If true, skips aggressive fuzzing.
 * @property {boolean} [corsReflectiveTest] - If true, attempts CORS origin reflection.
 * @property {string} scanId - Unique identifier.
 * @property {string} [userAgent] - Optional custom User-Agent.
 */

/**
 * @typedef {Object} Finding
 * @property {string} id - Unique ID per finding.
 * @property {Severity} severity - Risk level.
 * @property {string} category - OWASP category (e.g., 'A02:2025').
 * @property {string} cwe - CWE ID (e.g., 'CWE-319').
 * @property {string[]} cve - List of associated CVE identifiers.
 * @property {string} title - Short headline.
 * @property {string} description - Detailed explanation.
 * @property {string[]} affectedUrls - List of URLs where this was found.
 * @property {Record<string, any>} evidence - JSON object with proof (headers, snippets, etc.).
 * @property {string} remediation - How to fix it.
 * @property {number} timestamp - Detection time.
 */

/**
 * @typedef {Object} ScanSummary
 * @property {number} totalFindings
 * @property {Record<Severity, number>} bySeverity - Count of findings by severity.
 * @property {number} urlsScanned
 * @property {number} duration - Time taken in ms.
 */

/**
 * @typedef {Object} ScanResult
 * @property {string} id
 * @property {string} targetUrl
 * @property {ScanStatus} status - The current lifecycle state.
 * @property {number} startTime
 * @property {number} [endTime]
 * @property {Finding[]} findings
 * @property {ScanSummary} [summary]
 * @property {string} [overallRisk] - Calculated highest risk (e.g. 'HIGH').
 * @property {ScanConfig} config
 * @property {string} [error] - Error message if failed.
 * @property {string} [message] - Human readable status update.
 */

/**
 * @typedef {Object} HTTPResponse
 * @property {string} url - The final URL after redirects.
 * @property {number} status - HTTP Status Code (e.g., 200, 404).
 * @property {Record<string, string|string[]|undefined>} headers - Response headers (normalized lowercase).
 * @property {string} data - The response body (HTML/JSON).
 * @property {string} [finalUrl] - Explicit final URL if distinct.
 * @property {string} [redirectLocation] - If status is 3xx, where it points.
 * @property {string} [error] - Network error message if request failed.
 */

// Export empty object to make this a valid module for JSDoc
export {};