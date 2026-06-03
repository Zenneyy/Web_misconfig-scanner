import { useParams, useNavigate } from 'react-router-dom';

import {

  ArrowLeft,

  Download,

  RefreshCw,

  Clock,

  Globe,

  AlertTriangle,

  Shield,

  Target,

  Loader2,

} from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';

import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';

import { StatCard } from '@/components/scanner/StatCard';

import { SeverityBadge, StatusBadge } from '@/components/scanner/SeverityBadge';

import { FindingsTable } from '@/components/scanner/FindingsTable';

import { useScanPolling } from '@/hooks/useScanPolling';

import { downloadReport, formatDate, calculateDuration } from '@/services/api';

import { cn } from '@/lib/utils';

export default function ScanResults() {

  const { scanId } = useParams<{ scanId: string }>();

  const navigate = useNavigate();

  const { data: scan, isLoading, error, refetch } = useScanPolling({

    scanId: scanId || null,

    interval: 2000,

  });

  const handleDownloadReport = () => {

    if (scanId) downloadReport(scanId);

  };

  if (!scanId) {

    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invalid scan ID</p>
          <Button variant="link" onClick={() => navigate('/')}>

            Return to Dashboard
          </Button>
        </div>
      </AppLayout>

    );

  }

  if (error) {

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Scan</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />

              Back
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />

              Retry
            </Button>
          </div>
        </div>
      </AppLayout>

    );

  }

  const isRunning = scan?.status === 'running';

  const isCompleted = scan?.status === 'completed';

  /* ✅ COMPUTE SUMMARY FROM FINDINGS (SOURCE OF TRUTH) */

  const summary = scan?.findings

    ? scan.findings.reduce(

      (acc, f) => {

        acc.total += 1;

        switch (f.severity?.toUpperCase()) {

          case 'CRITICAL':

            acc.critical += 1;

            break;

          case 'HIGH':

            acc.high += 1;

            break;

          case 'MEDIUM':

            acc.medium += 1;

            break;

          case 'LOW':

            acc.low += 1;

            break;

          default:

            acc.info += 1;

        }

        return acc;

      },

      {

        total: 0,

        critical: 0,

        high: 0,

        medium: 0,

        low: 0,

        info: 0,

      }

    )

    : null;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <Button

              variant="ghost"

              size="sm"

              onClick={() => navigate('/')}

              className="-ml-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />

              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Scan Results</h1>

            {scan && (
              <div className="flex gap-3 mt-2">
                <StatusBadge status={scan.status} />

                {scan.overallRisk && (
                  <SeverityBadge severity={scan.overallRisk} />

                )}
              </div>

            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />

              Refresh
            </Button>

            {isCompleted && (
              <Button onClick={handleDownloadReport}>
                <Download className="w-4 h-4 mr-2" />

                Download Report
              </Button>

            )}
          </div>
        </div>

        {/* Loading */}

        {isLoading && !scan && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>

        )}

        {scan && (
          <>

            {/* Scan Info */}
            <div className="rounded-lg border p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Target URL</p>
                    <p className="font-mono text-sm">{scan.targetUrl}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-mono text-sm">

                      {calculateDuration(scan.startTime, scan.endTime) || '1s'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Started</p>
                    <p className="text-sm">{formatDate(scan.startTime)}</p>
                  </div>
                </div>
              </div>

              {isRunning && (
                <div className="mt-6">
                  <Progress value={scan.progress ?? 0} />
                </div>

              )}
            </div>

            {/* Summary Cards */}

            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Total" value={summary.total} icon={''} />
                <StatCard title="Critical" value={summary.critical} variant="critical" icon={''} />
                <StatCard title="High" value={summary.high} variant="high" icon={''} />
                <StatCard title="Medium" value={summary.medium} variant="medium" icon={''} />
                <StatCard title="Low" value={summary.low} variant="low" icon={''} />
                <StatCard title="Info" value={summary.info} variant="info" icon={''} />
              </div>

            )}

            {/* Findings */}

            {scan.findings && scan.findings.length > 0 && (
              <FindingsTable findings={scan.findings} />

            )}

            {isCompleted && (!scan.findings || scan.findings.length === 0) && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold">No Vulnerabilities Found</h3>
              </div>

            )}
          </>

        )}
      </div>
    </AppLayout>

  );

}

