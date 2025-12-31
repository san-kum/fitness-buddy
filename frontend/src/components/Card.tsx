import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div 
        className={clsx(
            "bg-neutral-900/40 border border-white/[0.05] p-6 rounded-[2rem] transition-all duration-300", 
            onClick && "cursor-pointer hover:border-white/10 hover:bg-neutral-900/60 active:scale-[0.99]",
            className
        )} 
        onClick={onClick}
    >
      {children}
    </div>
  );
}
