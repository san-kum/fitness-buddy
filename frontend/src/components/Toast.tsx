import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-[200] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast, index) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                        index={index}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose, index }: { toast: Toast; onClose: () => void; index: number }) {
    const icons = {
        success: <Check size={18} strokeWidth={3} />,
        error: <X size={18} strokeWidth={3} />,
        warning: <AlertCircle size={18} strokeWidth={3} />,
        info: <Info size={18} strokeWidth={3} />,
    };

    const colors = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    };

    const iconColors = {
        success: 'bg-emerald-500 text-black',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white',
    };

    return (
        <div
            className={clsx(
                "pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl",
                "animate-slide-up md:animate-fade-in-up md:w-80",
                colors[toast.type]
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", iconColors[toast.type])}>
                {icons[toast.type]}
            </div>
            <p className="flex-1 text-sm font-semibold text-white">{toast.message}</p>
            <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-neutral-500 hover:text-white"
            >
                <X size={16} />
            </button>
            {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full overflow-hidden">
                    <div
                        className={clsx("h-full", iconColors[toast.type].split(' ')[0])}
                        style={{ animation: `shrink ${toast.duration}ms linear forwards` }}
                    />
                </div>
            )}
        </div>
    );
}
