/**
 * 🛡️ Helper: Safe JSON replacer to handle Circular References.
 * Prevents "TypeError: Converting circular structure to JSON" crashes.
 */
const safeReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    // 1. Handle Circular References
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};

/**
 * Generates a crash-proof JSON report string.
 * Perfect for CI/CD pipelines or programmatic consumption.
 * * @param {import('../core/types').ScanResult} scanData 
 * @returns {string} Formatted JSON string
 */
export const generateJsonReport = (scanData) => {
  try {
    // 1. Safe Serialization (Circular Safety)
    return JSON.stringify(scanData, safeReplacer(), 2);
  } catch (error) {
    // 2. Fallback: If serialization fails (extremely rare with safeReplacer),
    // return a minimal error JSON instead of crashing the process.
    console.error('[Report] JSON serialization failed:', error);
    
    return JSON.stringify({
      error: 'JSON_SERIALIZATION_FAILED',
      message: error.message,
      partialData: {
        id: scanData?.id,
        targetUrl: scanData?.targetUrl,
        status: 'failed'
      }
    }, null, 2);
  }
};