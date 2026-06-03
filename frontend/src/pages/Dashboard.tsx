import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Activity,
  Target,
  Plus,
  Zap,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/scanner/StatCard';
import { RecentScansTable } from '@/components/scanner/RecentScansTable';
import { Button } from '@/components/ui/button';

import { getRecentScans, ScanListItem } from '@/services/api';
import { useHealthCheck } from '@/hooks/useHealthCheck';

/* ==============================
   Dashboard
============================== */

export default function Dashboard() {
  const navigate = useNavigate();
  const { isConnected } = useHealthCheck();

  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------- Fetch Recent Scans ---------- */
  useEffect(() => {
    async function fetchScans() {
      try {
        const data = await getRecentScans();
        // Backend returns { total, scans }
        setScans(data.scans ?? []);
      } catch (error) {
        console.error('Failed to fetch scans:', error);
        setScans([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (isConnected) {
      fetchScans();
    }
  }, [isConnected]);

  /* ---------- Dashboard Stats ---------- */
  const stats = {
    totalScans: scans.length,

    activeScans: scans.filter(
      (s) => s.status === 'running'
    ).length,

    criticalScans: scans.filter(
      (s) => s.overallRisk === 'CRITICAL'
    ).length,

    highRiskScans: scans.filter(
      (s) => s.overallRisk === 'HIGH'
    ).length,

    completedToday: scans.filter((s) => {
      if (!s.startTime) return false;

      const today = new Date().toDateString();

      return (
        s.status === 'completed' &&
        new Date(s.startTime).toDateString() === today
      );
    }).length,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage scans and review web application security findings
            </p>
          </div>

          <Button
            onClick={() => navigate('/new-scan')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Scan
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            subtitle="All time"
            icon={<Target className="w-5 h-5" />}
            variant="primary"
          />

          <StatCard
            title="Active Scans"
            value={stats.activeScans}
            subtitle="Currently running"
            icon={<Activity className="w-5 h-5" />}
            variant={
              stats.activeScans > 0 ? 'info' : 'default'
            }
          />

          <StatCard
            title="Critical Scans"
            value={stats.criticalScans}
            subtitle="Immediate attention"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={
              stats.criticalScans > 0
                ? 'critical'
                : 'default'
            }
          />

          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            subtitle="Scans finished"
            icon={<Zap className="w-5 h-5" />}
            variant="low"
          />
        </div>

        {/* Backend Connection Warning */}
        {!isConnected && (
          <div className="rounded-lg border border-status-failed/30 bg-status-failed/5 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-status-failed/20 p-3">
                <AlertTriangle className="w-6 h-6 text-status-failed" />
              </div>

              <div>
                <h3 className="font-semibold text-status-failed">
                  Backend Not Connected
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Unable to connect to the scanner backend at
                  localhost:3000. Please ensure the backend
                  server is running.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Card */}
        {isConnected && scans.length === 0 && !isLoading && (
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Shield className="w-12 h-12 text-primary" />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  Welcome to MiscScan
                </h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Start securing your web applications by
                  running your first vulnerability scan. The
                  scanner analyzes security misconfigurations
                  and provides remediation guidance.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => navigate('/new-scan')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Your First Scan
              </Button>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        <RecentScansTable
          scans={scans}
          isLoading={isLoading}
          limit={3}
        />
      </div>
    </AppLayout>
  );
}
