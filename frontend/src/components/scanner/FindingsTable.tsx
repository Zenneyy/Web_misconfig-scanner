import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

import { Finding } from '@/services/api';
import { SeverityBadge } from './SeverityBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ==============================
   Types
============================== */

interface FindingsTableProps {
  findings: Finding[];
  className?: string;
}

interface FindingRowProps {
  finding: Finding;
  isExpanded: boolean;
  onToggle: () => void;
}

/* ==============================
   Findings Table
============================== */

export function FindingsTable({
  findings,
  className,
}: FindingsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortedFindings = [...findings].sort((a, b) => {
    const order = {
      critical: 0,
      high: 100,
      medium: 2,
      low: 3,
      info: 4,
    };

    return order[a.severity] - order[b.severity];
  });

  if (findings.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-card p-8 text-center',
          className
        )}
      >
        <p className="text-muted-foreground">
          No findings to display
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-8 p-3" />
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                Severity
              </th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                Title
              </th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                CWE
              </th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                CVEs
              </th>
              <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                Affected URLs
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedFindings.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                isExpanded={expandedRows.has(finding.id)}
                onToggle={() => toggleRow(finding.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==============================
   Finding Row
============================== */

function FindingRow({
  finding,
  isExpanded,
  onToggle,
}: FindingRowProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <>
      {/* MAIN ROW */}
      <tr
        className={cn(
          'border-b border-border/50 hover:bg-muted/20 transition-colors',
          isExpanded && 'bg-muted/10'
        )}
      >
        <td className="p-3">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>

        <td className="p-3">
          <SeverityBadge severity={finding.severity} />
        </td>

        <td className="p-3">
          <span className="font-medium">{finding.title}</span>
        </td>

        <td className="p-3">
          {finding.cwe ? (
            <a
              href={`https://cwe.mitre.org/data/definitions/${finding.cwe.replace(
                'CWE-',
                ''
              )}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono text-sm"
            >
              {finding.cwe}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>


        <td className="p-3">
          <div className="flex flex-wrap gap-1">
            {finding.cve && finding.cve.length > 0 ? (
              finding.cve.map((cve, idx) => (
                <a
                  key={idx}
                  href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded font-mono"
                >
                  {cve}
                </a>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        </td>

        <td className="p-3">
          <span className="text-sm text-muted-foreground">
            {finding.affectedUrls.length} URL
            {finding.affectedUrls.length !== 1 ? 's' : ''}
          </span>
        </td>
      </tr>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <tr className="bg-muted/5">
          <td colSpan={5} className="p-0">
            <div className="p-6 space-y-6 border-l-2 border-primary/30 ml-3">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                  Description
                </h4>
                <p className="text-sm">
                  {finding.description}
                </p>
              </div>

              {/* Affected URLs */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                  Affected URLs
                </h4>

                <div className="space-y-2">
                  {finding.affectedUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-muted/50 rounded p-2 font-mono text-sm group"
                    >
                      <span className="flex-1 truncate">
                        {url}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(url);
                        }}
                      >
                        {copiedUrl === url ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remediation */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                  Remediation
                </h4>
                <p className="text-sm">
                  {finding.remediation}
                </p>
              </div>

              {/* References */}
              {finding.references?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                    References
                  </h4>

                  <ul className="space-y-1">
                    {finding.references.map((ref, idx) => (
                      <li key={idx}>
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
