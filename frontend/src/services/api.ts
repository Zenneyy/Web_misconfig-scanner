// API Service for Cybersecurity Scanner
// Connects to backend at http://localhost:3000

import { Key } from "readline";

const API_BASE_URL = 'http://localhost:3000';

// Types
export interface ScanConfig {
  targetUrl: string;
  depth: 0 | 1 | 2;
  maxUrls: number;
  timeout: number;
  skipSensitive: boolean;
  confirmedOwnership: boolean;
}

export interface ScanResponse {
  scanId: string;
  status: string;
  message?: string;
}

export interface Finding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  cwe?: string;
  cve?: string[];
  affectedUrls: string[];
  remediation: string;
  evidence?: string;
  references?: string[];
}

export interface ScanResult {
  overallRisk: any;
  scanId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  targetUrl: string;
  startTime: string;
  endTime?: string;
  progress?: number;
  riskLevel?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  summary?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  findings?: Finding[];
  error?: string;
}
export interface ScanListResponse {
  count: number;
  scans: ScanListItem[];
}

export interface ScanListItem {
  id: Key;
  overallRisk: string;
  scanId: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  riskLevel?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  findingsCount?: number;
}

export interface HealthStatus {
  status: string;
  version?: string;
  uptime?: number;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fetch wrapper with CORS handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors for error response
      }
      throw new ApiError(errorMessage, response.status);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the scanner backend. Ensure the server is running on port 3000.',
        0,
        'NETWORK_ERROR'
      );
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

// API Functions

/**
 * Start a new security scan
 */
export async function startScan(config: ScanConfig): Promise<ScanResponse> {
  if (!config.confirmedOwnership) {
    throw new ApiError('You must confirm ownership of the target before scanning.');
  }

  return apiFetch<ScanResponse>('/api/scan', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

/**
 * Get scan status and results
 */
export async function getScanStatus(scanId: string): Promise<ScanResult> {
  return apiFetch<ScanResult>(`/api/scan/${scanId}`);
}

/**
 * Get list of recent scans
 */
export async function getRecentScans(): Promise<ScanListResponse> {
  return apiFetch<ScanListResponse>('/api/scans');
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/health');
}

/**
 * Get report download URL
 */
export function getReportUrl(scanId: string, format: 'html' = 'html'): string {
  return `${API_BASE_URL}/api/scan/${scanId}/report?format=${format}`;
}

/**
 * Download scan report
 */
export async function downloadReport(scanId: string): Promise<void> {
  const url = getReportUrl(scanId, 'html');
  
  // Open report in new tab (Burp Suite style)
  window.open(url, '_blank');
}

// Utility functions

/**
 * Get severity color class
 */
export function getSeverityClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'severity-critical';
    case 'high':
      return 'severity-high';
    case 'medium':
      return 'severity-medium';
    case 'low':
      return 'severity-low';
    case 'info':
    default:
      return 'severity-info';
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'running':
      return 'text-status-running';
    case 'completed':
      return 'text-status-completed';
    case 'failed':
      return 'text-status-failed';
    case 'pending':
    default:
      return 'text-status-pending';
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate scan duration
 */
export function calculateDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;
  
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
