import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

interface StepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    unit?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Stepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    label,
    unit,
    size = 'md',
    className,
}: StepperProps) {
    const increment = () => {
        const newValue = Math.min(value + step, max);
        onChange(Number(newValue.toFixed(2)));
    };

    const decrement = () => {
        const newValue = Math.max(value - step, min);
        onChange(Number(newValue.toFixed(2)));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value) || 0;
        onChange(Math.min(Math.max(newValue, min), max));
    };

    const sizes = {
        sm: {
            button: 'w-10 h-10',
            input: 'text-xl w-16',
            icon: 16,
        },
        md: {
            button: 'w-12 h-12',
            input: 'text-2xl w-20',
            icon: 18,
        },
        lg: {
            button: 'w-14 h-14',
            input: 'text-3xl w-24',
            icon: 20,
        },
    };

    const currentSize = sizes[size];

    return (
        <div className={clsx("flex flex-col items-center gap-2", className)}>
            {label && (
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={decrement}
                    disabled={value <= min}
                    className={clsx(
                        "flex items-center justify-center rounded-2xl bg-neutral-900 border border-white/10",
                        "hover:bg-neutral-800 hover:border-white/20 active:scale-95 transition-all",
                        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-neutral-900",
                        currentSize.button
                    )}
                >
                    <Minus size={currentSize.icon} strokeWidth={3} />
                </button>

                <div className="relative flex items-center justify-center">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={value}
                        onChange={handleInputChange}
                        min={min}
                        max={max}
                        step={step}
                        className={clsx(
                            "bg-transparent text-center font-black tabular-nums focus:outline-none",
                            currentSize.input
                        )}
                    />
                    {unit && (
                        <span className="absolute -bottom-5 text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
                            {unit}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={increment}
                    disabled={value >= max}
                    className={clsx(
                        "flex items-center justify-center rounded-2xl bg-neutral-900 border border-white/10",
                        "hover:bg-neutral-800 hover:border-white/20 active:scale-95 transition-all",
                        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-neutral-900",
                        currentSize.button
                    )}
                >
                    <Plus size={currentSize.icon} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

// Inline stepper for compact use
export function InlineStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    className,
}: Omit<StepperProps, 'label' | 'unit' | 'size'>) {
    return (
        <div className={clsx("flex items-center", className)}>
            <button
                type="button"
                onClick={() => onChange(Math.max(value - step, min))}
                disabled={value <= min}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30"
            >
                <Minus size={14} strokeWidth={3} />
            </button>

            <input
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    onChange(Math.min(Math.max(newValue, min), max));
                }}
                className="w-14 bg-transparent text-center font-bold text-lg focus:outline-none tabular-nums"
            />

            <button
                type="button"
                onClick={() => onChange(Math.min(value + step, max))}
                disabled={value >= max}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30"
            >
                <Plus size={14} strokeWidth={3} />
            </button>
        </div>
    );
}
