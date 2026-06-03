// core/scanRunner.js
import { crawl } from '../crawler/crawler.js';
import { fetchSitemapUrls } from '../crawler/sitemap.js';
import { fetchUrl } from './httpClient.js';
import { deduplicateFindings, normalizeTarget } from './utils.js';
import { calculateRiskScore } from './severity.js';
import { DEFAULT_LIMITS } from './constants.js';

import { checkSecurityHeaders } from '../checks/headers.js';
import { checkCookies } from '../checks/cookies.js';
import { checkCors } from '../checks/cors.js';
import { checkDebugInfo } from '../checks/debug.js';
import { checkSensitiveFiles } from '../checks/sensitiveExposure.js';
import { checkHttpsEnforcement } from '../checks/https.js';


export const runScan = async (config) => {
  console.log(`[SCANNER] Starting scan ${config.scanId}: ${config.targetUrl}`);
  const startTime = Date.now();
  const allFindings = [];
  const errors = [];

  // 1. Validate & Normalize
  let cleanTargetUrl;
  try {
    cleanTargetUrl = normalizeTarget(config.targetUrl);
  } catch (e) {
    throw new Error(e.message);
  }

  const origin = new URL(cleanTargetUrl).origin;

  // 2. Apply Limits
  const maxUrls = config.maxUrls || DEFAULT_LIMITS.MAX_URLS;
  const timeout = config.timeout || DEFAULT_LIMITS.MAX_TIMEOUT;
  const depth = config.depth ?? 1;

  // 3. Discovery Phase (Crawl + Sitemap)
  let urlsToScan = [cleanTargetUrl];
  
  if (depth > 0) {
    try {
      // A. Sitemap (The "Cheat Code")
      const sitemapBudget = Math.floor(maxUrls * 0.4); // 40% budget for sitemap
      const sitemapUrls = await fetchSitemapUrls(cleanTargetUrl);
      
      // B. Crawl
      const crawledUrls = await crawl(cleanTargetUrl, depth, maxUrls - sitemapUrls.length, timeout);
      
      // Merge unique URLs
      const merged = new Set([...urlsToScan, ...sitemapUrls.slice(0, sitemapBudget), ...crawledUrls]);
      urlsToScan = Array.from(merged).slice(0, maxUrls);
    } catch (e) {
      errors.push({ stage: 'discovery', message: e.message });
    }
  }

  console.log(`[SCANNER] Scanning ${urlsToScan.length} unique URLs...`);

  // 4. Global Checks (Run once per domain)
  try {
    allFindings.push(...await checkHttpsEnforcement(cleanTargetUrl, timeout));
    if (!config.skipSensitive) {
      allFindings.push(...await checkSensitiveFiles(origin, timeout));
    }
  } catch (e) {
    errors.push({ stage: 'global-checks', message: e.message });
  }

  // 5. Per-URL Checks
  for (const url of urlsToScan) {
    try {
      const res = await fetchUrl(url, { timeout });
      if (res.status === 0) continue; // Skip failed requests

      allFindings.push(...checkSecurityHeaders(url, res));
      allFindings.push(...checkCookies(url, res));
      allFindings.push(...checkDebugInfo(url, res));
      
      // CORS check (async)
      allFindings.push(...await checkCors(url, res, { 
        reflectiveTest: config.corsReflectiveTest, 
        timeout: 4000 
      }));
    } catch (e) {
      errors.push({ url, stage: 'scan', message: e.message });
    }
  }

  // 6. Finalize
  const uniqueFindings = deduplicateFindings(allFindings);
  const overallRisk = calculateRiskScore(uniqueFindings);

  return {
    id: config.scanId,
    targetUrl: cleanTargetUrl,
    status: 'completed',
    startTime,
    endTime: Date.now(),
    findings: uniqueFindings,
    overallRisk,
    summary: {
      totalFindings: uniqueFindings.length,
      urlsScanned: urlsToScan.length,
      duration: Date.now() - startTime
    },
    config: { ...config, targetUrl: cleanTargetUrl }, // Echo safe config
    errors
  };
};