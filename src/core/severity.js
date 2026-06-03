// core/severity.js
import { randomUUID } from 'crypto';

const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export class Finding {
  constructor(data) {
    this.id = data.id || randomUUID();
    this.title = data.title;
    // Auto-fix invalid severity
    this.severity = VALID_SEVERITIES.includes(data.severity) ? data.severity : 'INFO';
    this.category = data.category || 'A02:2025';
    this.cwe = data.cwe || 'Unknown';
    this.cve = Array.isArray(data.cve) ? data.cve : [];
    this.description = data.description || 'No description.';
    this.affectedUrls = Array.isArray(data.affectedUrls) ? data.affectedUrls : [];
    this.evidence = data.evidence || {};
    this.remediation = data.remediation || 'No remediation provided.';
    this.timestamp = Date.now();
  }
  
  static create(data) { return new Finding(data); }
}

export const calculateRiskScore = (findings = []) => {
  if (!findings.length) return 'INFO';
  const severities = new Set(findings.map(f => f.severity));
  if (severities.has('CRITICAL')) return 'CRITICAL';
  if (severities.has('HIGH')) return 'HIGH';
  if (severities.has('MEDIUM')) return 'MEDIUM';
  if (severities.has('LOW')) return 'LOW';
  return 'INFO';
};