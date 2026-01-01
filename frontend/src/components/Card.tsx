import clsx from 'clsx';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}: CardProps) {
  const variants = {
    default: 'card-base card-hover',
    interactive: 'card-interactive card-glow-hover',
    glass: 'glass rounded-3xl card-glow-hover',
    gradient: 'card-base gradient-border card-glow-hover',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        variants[variant],
        paddings[padding],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Specialized card variants
export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <Card
      variant="interactive"
      className={clsx("group flex flex-col justify-between min-h-[140px]", className)}
    >
      <div className="flex justify-between items-start">
        <span className="stat-label group-hover:text-neutral-400 transition-colors">{label}</span>
        {icon && (
          <div className="text-neutral-700 group-hover:text-white transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5">
          <span className="stat-value stat-glow animate-number-in">{value}</span>
          {unit && <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">{unit}</span>}
        </div>

        {trend && (
          <div className={clsx(
            "mt-2 text-[10px] font-bold",
            trend.value > 0 ? "text-emerald-500" : trend.value < 0 ? "text-red-500" : "text-neutral-500"
          )}>
            {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→'} {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ActionCard({
  label,
  icon,
  onClick,
  className,
}: {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Card
      variant="interactive"
      className={clsx(
        "group flex items-center justify-between hover:bg-white transition-all duration-500 btn-lift",
        className
      )}
      onClick={onClick}
    >
      <span className="text-xl font-bold text-white group-hover:text-black transition-colors italic">
        {label}
      </span>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
          <div className="text-white group-hover:text-black transition-colors icon-glow-hover">
            {icon}
          </div>
        </div>
      )}
    </Card>
  );
}
