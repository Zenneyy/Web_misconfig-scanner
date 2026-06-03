// core/constants.js

/**
 * Severity levels for filtering and badge rendering
 */
export const SEVERITY_LEVELS = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Default limits to prevent abuse
 */
export const DEFAULT_LIMITS = {
  MAX_DEPTH: 2,           // How deep to crawl
  MAX_URLS: 50,           // Hard stop after 50 URLs
  MAX_TIMEOUT: 15000,     // 15s timeout per request
  MAX_RESPONSE_SIZE: 1024 * 1024 * 2, // 2MB max response
  CONCURRENCY: 3          // Max parallel requests
};

/**
 * Ports that are strictly forbidden to scan
 */
export const BLOCKED_PORTS = [
  21, 22, 23, 25, 53, 69, 135, 137, 139, 445, // System / Admin
  1433, 3306, 5432, 6379, 27017, 9200, 11211, // Databases
  3389, 5900                                  // RDP / VNC
];

/**
 * The "Must Have" Security Headers
 */
// export const REQUIRED_SECURITY_HEADERS = [
//   'strict-transport-security',
//   'content-security-policy',
//   'x-frame-options',
//   'x-content-type-options',
//   'referrer-policy',
//   'permissions-policy'
// ];

/**
 * High-Impact Sensitive Files to Probe
 */
export const SENSITIVE_FILES = [
  // 1. Configs & Secrets
  '.env', '.env.local', '.env.production',
  'config.json', 'appsettings.json', 'web.config', 'wp-config.php',
  
  // 2. Git / Version Control
  '.git/config', '.git/HEAD', '.gitignore',
  
  // 3. Infrastructure
  'docker-compose.yml', 'Dockerfile', '.aws/credentials',
  
  // 4. Backups
  'backup.zip', 'backup.sql', 'dump.sql', 'wwwroot.zip',
  
  // 5. Admin Leftovers
  'phpinfo.php', 'info.php', 'test.php', 'admin.php', '.vscode/sftp.json'
];