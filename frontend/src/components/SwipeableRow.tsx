import { useRef, useState, type ReactNode } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface SwipeableRowProps {
    children: ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    className?: string;
    threshold?: number;
}

export function SwipeableRow({
    children,
    onDelete,
    onEdit,
    className,
    threshold = 80,
}: SwipeableRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const [swiped, setSwiped] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        currentX.current = startX.current;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        currentX.current = e.touches[0].clientX;
        const diff = currentX.current - startX.current;

        if (rowRef.current && Math.abs(diff) > 10) {
            const clampedDiff = Math.max(-150, Math.min(150, diff));
            rowRef.current.style.transform = `translateX(${clampedDiff}px)`;
            rowRef.current.style.transition = 'none';

            if (diff < -threshold) {
                setSwipeDirection('left');
            } else if (diff > threshold) {
                setSwipeDirection('right');
            } else {
                setSwipeDirection(null);
            }
        }
    };

    const handleTouchEnd = () => {
        const diff = currentX.current - startX.current;

        if (rowRef.current) {
            rowRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            if (Math.abs(diff) > threshold) {
                if (diff < 0 && onDelete) {
                    // Swiped left - show delete
                    rowRef.current.style.transform = `translateX(-80px)`;
                    setSwiped(true);
                } else if (diff > 0 && onEdit) {
                    // Swiped right - show edit
                    rowRef.current.style.transform = `translateX(80px)`;
                    setSwiped(true);
                } else {
                    rowRef.current.style.transform = '';
                    setSwiped(false);
                }
            } else {
                rowRef.current.style.transform = '';
                setSwiped(false);
            }
        }

        setSwipeDirection(null);
        startX.current = 0;
        currentX.current = 0;
    };

    const resetSwipe = () => {
        if (rowRef.current) {
            rowRef.current.style.transform = '';
            setSwiped(false);
        }
    };

    return (
        <div className={clsx("relative overflow-hidden rounded-2xl", className)}>
            {/* Background actions */}
            <div className="absolute inset-0 flex">
                {/* Edit action (left side) */}
                {onEdit && (
                    <button
                        onClick={() => {
                            onEdit();
                            resetSwipe();
                        }}
                        className={clsx(
                            "flex items-center justify-center w-20 bg-blue-500 transition-colors",
                            swipeDirection === 'right' && "bg-blue-400"
                        )}
                    >
                        <Edit2 size={20} className="text-white" />
                    </button>
                )}

                <div className="flex-1" />

                {/* Delete action (right side) */}
                {onDelete && (
                    <button
                        onClick={() => {
                            onDelete();
                            resetSwipe();
                        }}
                        className={clsx(
                            "flex items-center justify-center w-20 bg-red-500 transition-colors",
                            swipeDirection === 'left' && "bg-red-400"
                        )}
                    >
                        <Trash2 size={20} className="text-white" />
                    </button>
                )}
            </div>

            {/* Main content */}
            <div
                ref={rowRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={swiped ? resetSwipe : undefined}
                className="relative bg-neutral-900 transition-transform touch-pan-y"
            >
                {children}
            </div>
        </div>
    );
}
