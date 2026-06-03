import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock, Target } from 'lucide-react';

import {
  ScanListItem,
  formatDate,
  calculateDuration,
} from '@/services/api';

import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ==============================
   Types
============================== */

interface RecentScansTableProps {
  scans: ScanListItem[];
  isLoading?: boolean;
  className?: string;
  limit?: number;
}

/* ==============================
   Component
============================== */

export function RecentScansTable({
  scans,
  isLoading,
  className,
  limit,
}: RecentScansTableProps) {
  const navigate = useNavigate();
  const displayedScans = limit ? scans.slice(0, limit) : scans;

  /* ---------- Loading State ---------- */
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Scans</h3>
        </div>

        <div className="p-8 text-center text-muted-foreground">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Empty State ---------- */
  if (scans.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Recent Scans</h3>
        </div>

        <div className="p-8 text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No scans yet</p>
          <p className="text-sm">
            Start your first security scan to see results here
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Table ---------- */
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Scans</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Target
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Risk
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Findings
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Duration
              </th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                Started
              </th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedScans.map((scan) => (
              <tr
                key={scan.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/scan/${scan.id}`)}
              >
                <td className="p-3">
                  <span className="font-mono text-sm truncate max-w-[200px] block">
                    {scan.targetUrl}
                  </span>
                </td>

                <td className="p-3">
                  <StatusBadge status={scan.status} />
                </td>

                <td className="p-3">
                  {scan.overallRisk ? (
                    <SeverityBadge
                      severity={scan.overallRisk}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </td>

                <td className="p-3">
                  <span className="font-mono text-sm">
                    {scan.findingsCount ?? '—'}
                  </span>
                </td>

                <td className="p-3">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {calculateDuration(scan.startTime, scan.endTime) || '1s'}
                  </span>
                </td>

                <td className="p-3">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(scan.startTime)}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/scan/${scan.id}`);
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
