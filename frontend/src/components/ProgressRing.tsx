import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    className?: string;
    color?: 'white' | 'green' | 'blue' | 'orange' | 'red';
    showPercentage?: boolean;
    label?: string;
    value?: string | number;
    unit?: string;
    animated?: boolean;
}

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    className,
    color = 'white',
    showPercentage = false,
    label,
    value,
    unit,
    animated = true,
}: ProgressRingProps) {
    const [animatedProgress, setAnimatedProgress] = useState(animated ? 0 : progress);

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => setAnimatedProgress(progress), 100);
            return () => clearTimeout(timer);
        } else {
            setAnimatedProgress(progress);
        }
    }, [progress, animated]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(animatedProgress, 100) / 100) * circumference;

    const colors = {
        white: { stroke: '#ffffff', glow: 'rgba(255,255,255,0.3)' },
        green: { stroke: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
        blue: { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
        orange: { stroke: '#f97316', glow: 'rgba(249,115,22,0.3)' },
        red: { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    };

    const gradientId = `gradient-${Math.random().toString(36).substring(7)}`;

    return (
        <div className={clsx("relative inline-flex items-center justify-center", className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors[color].stroke} />
                        <stop offset="100%" stopColor={colors[color].stroke} stopOpacity="0.5" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                />

                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        filter: progress > 0 ? 'url(#glow)' : 'none',
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {showPercentage && (
                    <span className="text-2xl font-black tabular-nums">{Math.round(animatedProgress)}%</span>
                )}
                {value !== undefined && (
                    <>
                        <span className="text-3xl md:text-4xl font-black tabular-nums tracking-tight">{value}</span>
                        {unit && <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{unit}</span>}
                    </>
                )}
                {label && !showPercentage && !value && (
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
                )}
            </div>
        </div>
    );
}

// Mini progress ring for inline use
export function MiniProgressRing({
    progress,
    size = 32,
    strokeWidth = 3,
    color = 'white',
    className,
}: Omit<ProgressRingProps, 'showPercentage' | 'label' | 'value' | 'unit'>) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    const colors = {
        white: '#ffffff',
        green: '#22c55e',
        blue: '#3b82f6',
        orange: '#f97316',
        red: '#ef4444',
    };

    return (
        <svg width={size} height={size} className={clsx("transform -rotate-90", className)}>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors[color]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
        </svg>
    );
}
