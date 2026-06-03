import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'primary';
  className?: string;
}

const variantStyles = {
  default: {
    container: 'border-border bg-card',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    value: 'text-foreground',
  },
  critical: {
    container: 'border-severity-critical/30 bg-severity-critical/5',
    iconBg: 'bg-severity-critical/20',
    iconColor: 'text-severity-critical',
    value: 'text-severity-critical',
  },
  high: {
    container: 'border-severity-high/30 bg-severity-high/5',
    iconBg: 'bg-severity-high/20',
    iconColor: 'text-severity-high',
    value: 'text-severity-high',
  },
  medium: {
    container: 'border-severity-medium/30 bg-severity-medium/5',
    iconBg: 'bg-severity-medium/20',
    iconColor: 'text-severity-medium',
    value: 'text-severity-medium',
  },
  low: {
    container: 'border-severity-low/30 bg-severity-low/5',
    iconBg: 'bg-severity-low/20',
    iconColor: 'text-severity-low',
    value: 'text-severity-low',
  },
  info: {
    container: 'border-severity-info/30 bg-severity-info/5',
    iconBg: 'bg-severity-info/20',
    iconColor: 'text-severity-info',
    value: 'text-severity-info',
  },
  primary: {
    container: 'border-primary/30 bg-primary/5 glow-primary',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    value: 'text-primary',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200 card-hover-glow',
        styles.container,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn('text-3xl font-bold tabular-nums', styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-severity-low' : 'text-severity-critical'
              )}
            >
              {trend.isPositive ? '↓' : '↑'} {Math.abs(trend.value)}% from last scan
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', styles.iconBg)}>
          <div className={styles.iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
