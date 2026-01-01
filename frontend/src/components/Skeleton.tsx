import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    lines = 1
}: SkeletonProps) {
    const baseClasses = "skeleton";

    const variantClasses = {
        text: "h-4 rounded-lg",
        circular: "rounded-full aspect-square",
        rectangular: "rounded-2xl",
        card: "rounded-3xl min-h-[120px]",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(baseClasses, variantClasses.text, className)}
                        style={{ ...style, width: i === lines - 1 ? '80%' : '100%' }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={style}
        />
    );
}

// Pre-built skeleton compositions
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={clsx("card-base p-6 space-y-4", className)}>
            <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
            <Skeleton variant="rectangular" height={60} />
        </div>
    );
}

export function SkeletonStat({ className }: { className?: string }) {
    return (
        <div className={clsx("card-base p-6 space-y-3", className)}>
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="rectangular" height={40} width="70%" />
        </div>
    );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
    return (
        <div className={clsx("space-y-3", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 card-base">
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="40%" />
                    </div>
                </div>
            ))}
        </div>
    );
}
