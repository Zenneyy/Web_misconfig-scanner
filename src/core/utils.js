// core/utils.js
import { URL } from 'url';
import ipaddr from 'ipaddr.js'; 
import { BLOCKED_PORTS } from './constants.js';

/**
 * 🛡️ HARDENED: Validates IPs using strict parsing logic.
 */
export const isPrivateNetwork = (hostname) => {
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true;

  try {
    const addr = ipaddr.parse(hostname);
    const range = addr.range();
    return ['loopback', 'private', 'linkLocal', 'uniqueLocal', 'reserved'].includes(range);
  } catch (e) {
    return false; // Valid domain name
  }
};

export const normalizeTarget = (inputUrl) => {
  if (!inputUrl) throw new Error('Target URL is required');
  
  inputUrl = inputUrl.trim().replace(/#.*$/, '');
  if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
    inputUrl = 'http://' + inputUrl;
  }

  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    throw new Error(`Invalid URL format: ${inputUrl}`);
  }

  if (isPrivateNetwork(parsed.hostname)) {
    throw new Error('Scanning private networks/localhost is prohibited');
  }

  if (parsed.port && BLOCKED_PORTS.includes(Number(parsed.port))) {
    throw new Error(`Port ${parsed.port} scanning is restricted.`);
  }

  let normalized = parsed.href;
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);

  return normalized;
};

export const generateScanId = () => `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const deduplicateFindings = (findings) => {
  const map = new Map();
  for (const f of findings) {
    const key = `${f.category}::${f.severity}::${f.cwe}::${f.title}::${f.cve.join(',')}`;
    if (!map.has(key)) {
      map.set(key, { ...f, affectedUrls: [...new Set(f.affectedUrls)] });
      continue;
    }
    const existing = map.get(key);
    existing.affectedUrls = [...new Set([...existing.affectedUrls, ...f.affectedUrls])];
    
    if (f.evidence) {
      const existingEv = Array.isArray(existing.evidence) ? existing.evidence : (existing.evidence ? [existing.evidence] : []);
      const newEv = Array.isArray(f.evidence) ? f.evidence : [f.evidence];
      if (existingEv.length < 5) existing.evidence = [...existingEv, ...newEv].slice(0, 5);
    }
  }
  return [...map.values()];
};

export const createFinding = (data) => ({
  id: `finding_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(data.severity) ? data.severity : 'INFO',
  category: data.category || 'A02:2025',
  cwe: data.cwe || 'CWE-Unknown',
  cve: data.cve || [],
  title: data.title || 'Unknown Issue',
  description: data.description || 'No description provided.',
  affectedUrls: data.affectedUrls || [],
  evidence: data.evidence || {},
  remediation: data.remediation || '',
  timestamp: Date.now(),
});

export const looksLikeSensitiveContent = (file, text) => {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase().trim();
  
  if (t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<body')) return false;

  if (file === '.env') return /(^|\n)\s*[A-Z0-9_]{2,}\s*=\s*['"]?.+['"]?/m.test(text);
  if (file === '.git/config') return t.includes('[core]') && t.includes('repositoryformatversion');
  
  if (file.endsWith('.json') || file === 'web.config') {
    return t.includes('connectionstring') || t.includes('api_key') || (t.includes('password') && !t.includes('invalid'));
  }
  return false;
};

export const redactSecrets = (text) => {
  let t = String(text || '');
  t = t.replace(/(^|\n)(\s*[A-Z0-9_]{2,}\s*=\s*)(.+)/g, '$1$2********');
  t = t.replace(/("?(password|secret|api[_-]?key|token|auth)"?\s*:\s*)"([^"]*)"/gi, '$1"********"');
  return t;
};