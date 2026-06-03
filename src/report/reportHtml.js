// src/report/reportHtml.js

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatTime = (ts) => {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
};

export const generateHtmlReport = (scanData) => {
  const { 
    id, 
    targetUrl, 
    startTime, 
    endTime, 
    findings = [], 
    summary, 
    overallRisk, 
    errors = [],
    meta = {} 
  } = scanData;

  const severityColors = {
    CRITICAL: '#dc3545',
    HIGH: '#fd7e14',
    MEDIUM: '#ffc107',
    LOW: '#28a745',
    INFO: '#17a2b8'
  };

  const riskColor = severityColors[overallRisk] || '#6c757d';
  const duration = ((endTime || Date.now()) - startTime) / 1000;

  // 🛠️ SELF-HEALING FIX: Recalculate stats on the fly
  // This ensures the badges ALWAYS match the findings list.
  const stats = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0
  };

  findings.forEach(f => {
    // Normalize to uppercase just in case
    const sev = (f.severity || 'INFO').toUpperCase();
    if (stats[sev] !== undefined) {
      stats[sev]++;
    }
  });

  // --- 1. Findings Section Generator ---
  let findingsHtml = '';
  if (findings.length === 0) {
    findingsHtml = `
      <div class="alert alert-success">
        <strong>✅ Clean Scan:</strong> No security misconfigurations were detected based on the active policy.
      </div>`;
  } else {
    findingsHtml = findings.map((f) => {
      const color = severityColors[f.severity] || '#6c757d';
      
      let evidenceBlock = '';
      if (f.evidence && Object.keys(f.evidence).length > 0) {
        const json = JSON.stringify(f.evidence, null, 2);
        evidenceBlock = `<pre class="evidence"><code>${escapeHtml(json)}</code></pre>`;
      }

      const urlsList = (f.affectedUrls || [])
        .map(u => `<li><a href="${escapeHtml(u)}" target="_blank" rel="noopener">${escapeHtml(u)}</a></li>`)
        .join('');

      const cveHtml = (f.cve || [])
        .map(cveId => `<span class="cve-badge" title="Common Vulnerabilities and Exposures">${escapeHtml(cveId)}</span>`)
        .join(' ');  

      return `
        <details class="finding-card" ${['CRITICAL', 'HIGH'].includes(f.severity) ? 'open' : ''}>
          <summary style="border-left-color: ${color}">
            <span class="severity-badge" style="background: ${color}">${escapeHtml(f.severity)}</span>
            <span class="finding-title">${escapeHtml(f.title)}</span>
            <span class="cwe-id">${escapeHtml(f.cwe || 'CWE-???')}</span>
            <div class="classification-badges">
                <span class="cwe-id">${escapeHtml(f.cwe || 'CWE-???')}</span>
                ${cveHtml} </div>
          </summary>
          <div class="finding-body">
            <div class="meta-row">
              <strong>Category:</strong> ${escapeHtml(f.category)} &nbsp;|&nbsp; 
              <strong>Detection ID:</strong> ${escapeHtml(f.id)}
            </div>
            
            <p class="description">${escapeHtml(f.description)}</p>
            
            <div class="section-title">Affected Resources</div>
            <ul class="url-list">${urlsList}</ul>

            <div class="section-title">Evidence</div>
            ${evidenceBlock}

            <div class="section-title">Remediation</div>
            <div class="remediation-box">${escapeHtml(f.remediation)}</div>
          </div>
        </details>
      `;
    }).join('');
  }

  // --- 2. Errors Section ---
  let errorsHtml = '';
  if (errors.length > 0) {
    const errorList = errors.map(e => 
      `<li><strong>${escapeHtml(e.stage)}:</strong> ${escapeHtml(e.url)} - <em>${escapeHtml(e.message)}</em></li>`
    ).join('');
    
    errorsHtml = `
      <div class="error-section">
        <h3>⚠️ Scan Errors & Warnings</h3>
        <p>The following issues occurred during the scan.</p>
        <ul>${errorList}</ul>
      </div>
    `;
  }

  // --- 3. HTML Template ---
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Report: ${escapeHtml(targetUrl)}</title>
  <style>
    :root { --bg-color: #f4f6f9; --card-bg: #ffffff; --text-main: #212529; --text-muted: #6c757d; --border-color: #dee2e6; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: var(--text-main); background: var(--bg-color); margin: 0; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    header { background: var(--card-bg); padding: 20px 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 5px solid ${riskColor}; }
    h1 { margin: 0; font-size: 24px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; font-size: 14px; }
    .meta-item strong { display: block; color: var(--text-muted); font-size: 12px; text-transform: uppercase; }
    .summary-box { background: var(--card-bg); padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stats-grid { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
    .stat-badge { padding: 5px 12px; border-radius: 4px; color: white; font-weight: bold; font-size: 13px; min-width: 80px; text-align: center; }
    .finding-card { background: var(--card-bg); margin-bottom: 15px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); overflow: hidden; }
    .finding-card summary { padding: 15px; cursor: pointer; list-style: none; display: flex; align-items: center; gap: 15px; border-left: 5px solid #ccc; background: #fff; transition: background 0.2s; }
    .finding-card summary:hover { background: #f8f9fa; }
    .finding-card summary::-webkit-details-marker { display: none; }
    .severity-badge { color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; min-width: 70px; text-align: center; }
    .finding-title { font-weight: 600; flex-grow: 1; }
    .classification-badges { display: flex; gap: 8px; align-items: center; }
    .cwe-id { color: var(--text-muted); font-family: monospace; font-size: 13px; }
    .cve-badge { background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; }
    .finding-body { padding: 20px; border-top: 1px solid var(--border-color); }
    .section-title { font-weight: bold; margin: 20px 0 10px 0; font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; }
    .evidence { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 13px; }
    .remediation-box { background: #e8f5e9; color: #1b5e20; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; }
    .url-list { margin: 0; padding-left: 20px; }
    .error-section { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 20px; border-radius: 8px; margin-top: 30px; }
    footer { text-align: center; margin-top: 50px; color: var(--text-muted); font-size: 12px; border-top: 1px solid var(--border-color); padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1>Security Assessment Report</h1>
        <div style="text-align: right;">
          <span style="display: block; font-size: 12px; color: #6c757d;">SCAN ID</span>
          <code style="font-size: 14px;">${escapeHtml(id)}</code>
        </div>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><strong>Target</strong> <a href="${escapeHtml(targetUrl)}" target="_blank">${escapeHtml(targetUrl)}</a></div>
        <div class="meta-item"><strong>Date</strong> ${escapeHtml(formatTime(startTime))}</div>
        <div class="meta-item"><strong>Duration</strong> ${duration.toFixed(2)}s</div>
        <div class="meta-item"><strong>Scanner Ver</strong> ${escapeHtml(meta.scannerVersion || '1.0.0')}</div>
      </div>
    </header>

    <div class="summary-box">
      <h3 style="margin-top: 0;">Executive Summary</h3>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div>
          <p style="margin: 0;"><strong>Overall Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold;">${escapeHtml(overallRisk)}</span></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Scanned <strong>${escapeHtml(summary?.urlsScanned || 0)}</strong> unique URLs.</p>
        </div>
        <div class="stats-grid">
          <div class="stat-badge" style="background: ${severityColors.CRITICAL}">CRITICAL: ${stats.CRITICAL}</div>
          <div class="stat-badge" style="background: ${severityColors.HIGH}">HIGH: ${stats.HIGH}</div>
          <div class="stat-badge" style="background: ${severityColors.MEDIUM}">MEDIUM: ${stats.MEDIUM}</div>
          <div class="stat-badge" style="background: ${severityColors.LOW}">LOW: ${stats.LOW}</div>
          <div class="stat-badge" style="background: ${severityColors.INFO}">INFO: ${stats.INFO}</div>
        </div>
      </div>
    </div>

    <h2 style="border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Technical Findings</h2>
    ${findingsHtml}
    ${errorsHtml}

    <footer>
      <p>Generated by <strong>WebMisconfigScanner v${escapeHtml(meta.scannerVersion || '1.0')}</strong></p>
      <p><em>This report contains confidential security information.</em></p>
    </footer>
  </div>
</body>
</html>`;
};