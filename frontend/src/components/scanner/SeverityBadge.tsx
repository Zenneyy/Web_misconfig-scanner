import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/* ==============================
   SEVERITY BADGE
============================== */

type Severity =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INFO'
  | string;

const SEVERITY_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  CRITICAL: {
    label: 'Critical',
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'bg-red-500/10 text-red-500 border-red-500/30',
  },
  HIGH: {
    label: 'High',
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  },
  MEDIUM: {
    label: 'Medium',
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  },
  LOW: {
    label: 'Low',
    icon: <CheckCircle className="h-4 w-4" />,
    className: 'bg-green-500/10 text-green-500 border-green-500/30',
  },
  INFO: {
    label: 'Info',
    icon: <Info className="h-4 w-4" />,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps) {
  const key = String(severity).toUpperCase();
  const config = SEVERITY_CONFIG[key] ?? SEVERITY_CONFIG.INFO;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/* ==============================
   STATUS BADGE
============================== */

type ScanStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | string;

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  queued: {
    label: 'Queued',
    icon: <Clock className="h-4 w-4" />,
    className: 'bg-muted text-muted-foreground border-muted',
  },
  running: {
    label: 'Running',
    icon: <Clock className="h-4 w-4 animate-spin" />,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle className="h-4 w-4" />,
    className: 'bg-green-500/10 text-green-500 border-green-500/30',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle className="h-4 w-4" />,
    className: 'bg-red-500/10 text-red-500 border-red-500/30',
  },
};

interface StatusBadgeProps {
  status: ScanStatus;
  className?: string;
}

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const key = String(status).toLowerCase();
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.queued;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
