import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

// --- Setup Constants ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '../../reports');

/**
 * 🛡️ Security: Validate scanId to prevent Path Traversal attacks.
 * Allows only: alphanumeric, underscores, hyphens.
 */
const isValidScanId = (id) => /^[a-zA-Z0-9_-]+$/.test(id);

const ensureDirectory = async () => {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  }
};

/**
 * ⚡ Atomic Write: Writes to a temp file first, then renames it.
 * This prevents data corruption if the process crashes mid-write.
 */
const writeJsonAtomic = async (filePath, data) => {
  const tempPath = `${filePath}.tmp`;
  const content = JSON.stringify(data, null, 2);
  
  try {
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath); // Atomic operation
  } catch (error) {
    // Cleanup temp file if rename fails
    try { await fs.unlink(tempPath); } catch {} 
    throw error;
  }
};

/**
 * Save or Overwrite a scan result
 * @param {string} scanId 
 * @param {import('../core/types').ScanResult} data 
 */
export const saveScan = async (scanId, data) => {
  if (!isValidScanId(scanId)) throw new Error('Invalid Scan ID');
  
  await ensureDirectory();
  const scanFile = join(REPORTS_DIR, `${scanId}.json`);
  
  // Deep clone to ensure we store clean JSON data
  const cleanData = JSON.parse(JSON.stringify(data));
  
  await writeJsonAtomic(scanFile, cleanData);
  return scanId;
};

/**
 * Retrieve a full scan by ID
 * @param {string} scanId 
 * @returns {Promise<import('../core/types').ScanResult|null>}
 */
export const getScan = async (scanId) => {
  if (!isValidScanId(scanId)) return null;

  try {
    const scanFile = join(REPORTS_DIR, `${scanId}.json`);
    const content = await fs.readFile(scanFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(`Error reading scan ${scanId}:`, error.message);
    return null;
  }
};

/**
 * Partial update for a scan (e.g., updating status)
 */
export const updateScan = async (scanId, updates) => {
  const existing = await getScan(scanId);
  if (!existing) return null;

  const updated = { 
    ...existing, 
    ...updates, 
    // If status changes to completed/failed, ensure endTime is set
    endTime: (updates.status === 'completed' || updates.status === 'failed') ? Date.now() : existing.endTime 
  };
  
  await saveScan(scanId, updated);
  return scanId;
};

/**
 * ⚡ Optimized List: Sorts filenames FIRST, then reads only requested N files.
 * @param {number} limit 
 */
export const listScans = async (limit = 10) => {
  try {
    await ensureDirectory();
    const files = await fs.readdir(REPORTS_DIR);

    // Filter valid scan files
    const scanFiles = files.filter(f => f.startsWith('scan_') && f.endsWith('.json'));

    // Sort by timestamp (in filename) DESCENDING (Newest first)
    // Filename format: scan_{timestamp}_{random}.json
    scanFiles.sort().reverse();

    // Slice BEFORE reading (Huge performance fix)
    const recentFiles = scanFiles.slice(0, limit);

    // Read only the necessary files in parallel
    const readTasks = recentFiles.map(async (file) => {
      try {
        const content = await fs.readFile(join(REPORTS_DIR, file), 'utf8');
        const scan = JSON.parse(content);
        
        // Return lightweight summary
        return {
          id: scan.id,
          targetUrl: scan.targetUrl,
          status: scan.status || 'unknown',
          startTime: scan.startTime,
          endTime: scan.endTime,
          findingsCount: scan.findings ? scan.findings.length : 0,
          overallRisk: scan.overallRisk || 'INFO',
        };
      } catch (err) {
        console.warn(`Skipping corrupted scan file: ${file}`);
        return null;
      }
    });

    const results = await Promise.all(readTasks);
    
    // Filter out nulls from read errors
    return results.filter(Boolean);

  } catch (error) {
    console.error('Failed to list scans:', error.message);
    return [];
  }
};