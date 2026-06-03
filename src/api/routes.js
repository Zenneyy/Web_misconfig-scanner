import express from 'express';
import rateLimit from 'express-rate-limit';

// Core Imports (Connecting to your robust logic)
import { normalizeTarget, generateScanId } from '../core/utils.js';
import { runScan } from '../core/scanRunner.js';
import { DEFAULT_LIMITS } from '../core/constants.js';

// Storage & Reporting
import { saveScan, getScan, updateScan, listScans } from '../storage/scanStore.js';
import { generateHtmlReport } from '../report/reportHtml.js';
import { generateJsonReport } from '../report/reportJson.js';
import { fetchSitemapUrls } from '../crawler/sitemap.js'; // NEW IMPORT

const router = express.Router();

// Rate Limiter: 15 scans per 15 mins
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scan requests. Please try again later.' },
});

/**
 * POST /api/scan
 * Initiates a scan using the new robust Core
 */
router.post('/scan', scanLimiter, async (req, res) => {
  try {
    const { 
      targetUrl, 
      depth = 0, 
      maxUrls = 10, 
      timeout = 10000, 
      skipSensitive = false, 
      confirmedOwnership,
      corsReflectiveTest = false
    } = req.body;

    // 1. Legal & Input Check
    if (!targetUrl || confirmedOwnership !== true) {
      return res.status(400).json({
        error: 'Missing Requirements',
        message: 'You must have permission to scan the targetUrl.',
      });
    }

    // 2. Normalize (Throws error if private IP or invalid URL)
    const normalizedUrl = normalizeTarget(String(targetUrl));

    // 3. Prepare Config (Enforce limits from constants)
    const scanId = generateScanId();
    const config = {
      scanId,
      targetUrl: normalizedUrl,
      // Clamp values using the central DEFAULT_LIMITS
      // Allow depth 0, 1, or 2 (capped by defaults)
      depth: Math.min(Math.max(0, Number(depth) || 0), DEFAULT_LIMITS.MAX_DEPTH), 
      maxUrls: Math.min(Number(maxUrls) || 10, DEFAULT_LIMITS.MAX_URLS), 
      timeout: Math.min(Number(timeout) || 10000, DEFAULT_LIMITS.MAX_TIMEOUT),
      skipSensitive: Boolean(skipSensitive),
      corsReflectiveTest: Boolean(corsReflectiveTest)
    };

    // 4. Create Initial Record
    await saveScan(scanId, {
      id: scanId,
      targetUrl: normalizedUrl,
      status: 'queued',
      startTime: Date.now(),
      config,
      findings: [],
      message: 'Scan queued...',
    });

    // 5. Send Immediate Response
    res.json({
      scanId,
      status: 'queued',
      message: 'Scan queued successfully.',
      links: {
        status: `/api/scan/${scanId}`,
        reportHtml: `/api/scan/${scanId}/report?format=html`,
        reportJson: `/api/scan/${scanId}/report?format=json`
      }
    });

    // 6. Start Background Scan
    // We remove the manual Promise.race timeout here because 
    // runScan() now handles its own timeouts per request.
    setImmediate(async () => {
      try {
        await updateScan(scanId, { status: 'running', message: 'Crawling target...' });

        // Run the robust scan logic
        const results = await runScan(config);

        await updateScan(scanId, {
          ...results, 
          status: 'completed',
          message: 'Scan finished successfully.'
        });

      } catch (error) {
        console.error(`[Scan Error] ${scanId}:`, error);
        await updateScan(scanId, {
          status: 'failed',
          error: error.message,
          message: 'Scan failed unexpectedly.',
          endTime: Date.now()
        });
      }
    });

  } catch (error) {
    res.status(400).json({ error: 'Validation Error', message: error.message });
  }
});

/**
 * GET /api/scan/:id
 * Retrieve scan status
 */
router.get('/scan/:id', async (req, res) => {
  const scan = await getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  
  // Use safe JSON generator (prevents circular reference crashes)
  const jsonStr = generateJsonReport(scan);
  res.setHeader('Content-Type', 'application/json');
  res.send(jsonStr);
});

/**
 * GET /api/scan/:id/report
 * Download report
 */
router.get('/scan/:id/report', async (req, res) => {
  const scan = await getScan(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });

  const format = (req.query.format || 'json').toLowerCase();

  if (format === 'html') {
    const html = generateHtmlReport(scan);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  // Default to JSON file download
  const jsonStr = generateJsonReport(scan);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="scan_${scan.id}.json"`);
  res.send(jsonStr);
});

/**
 * GET /api/scans
 * List recent scans
 */
router.get('/scans', async (req, res) => {
  const scans = await listScans(20); // Limit to 20 recent scans
  res.json({ count: scans.length, scans });
});

/**
 * GET /api/health
 * Service health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage().rss
  });
});

/**
 * GET /api (Root)
 * API Manifest
 */
router.get('/', (req, res) => {
  res.json({
    name: 'Web Misconfig Scanner API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      scan: { method: 'POST', url: '/api/scan' },
      status: { method: 'GET', url: '/api/scan/:id' },
      report: { method: 'GET', url: '/api/scan/:id/report?format=html' },
      list: { method: 'GET', url: '/api/scans' }
    }
  });
});

/**
 * POST /api/tools/sitemap
 * Helper: Extract sitemap URLs without running a full scan.
 * Useful for the "Advanced Options" UI in your frontend.
 */
router.post('/tools/sitemap', scanLimiter, async (req, res) => {
  try {
    const { targetUrl } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'targetUrl is required' });
    }

    const normalizedUrl = normalizeTarget(String(targetUrl));
    
    // Use your existing robust sitemap parser
    const urls = await fetchSitemapUrls(normalizedUrl);

    res.json({
      targetUrl: normalizedUrl,
      found: urls.length,
      urls: urls.slice(0, 100) // Limit preview to 100 URLs
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;