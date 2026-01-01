import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    height?: 'auto' | 'half' | 'full';
}

export function BottomSheet({ isOpen, onClose, title, children, height = 'auto' }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleTouchStart = (e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0 && sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${diff}px)`;
        }
    };

    const handleTouchEnd = () => {
        const diff = currentY.current - startY.current;

        if (diff > 100) {
            onClose();
        }

        if (sheetRef.current) {
            sheetRef.current.style.transform = '';
        }

        startY.current = 0;
        currentY.current = 0;
    };

    const heightClasses = {
        auto: 'max-h-[90vh]',
        half: 'h-[50vh]',
        full: 'h-[90vh]',
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={clsx(
                    "absolute bottom-0 left-0 right-0 bg-neutral-950 rounded-t-[2rem] animate-slide-up",
                    "border-t border-white/10 overflow-hidden",
                    heightClasses[height]
                )}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                    <div className="w-10 h-1 rounded-full bg-neutral-700" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <h3 className="text-lg font-bold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto overscroll-contain px-6 py-4 pb-safe" style={{ maxHeight: 'calc(100% - 60px)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
