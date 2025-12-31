import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content - Mobile: Bottom Sheet, Desktop: Centered Card */}
      <div className={clsx(
        "relative w-full bg-[#0a0a0a] border-t md:border border-white/10 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] md:shadow-3xl overflow-hidden animate-fade-in-up md:animate-scale-in",
        "rounded-t-[2.5rem] md:rounded-[2.5rem]",
        "h-[85vh] md:h-auto md:max-h-[90vh]",
        "flex flex-col",
        maxWidth
      )}>
        {/* Mobile Handle */}
        <div className="md:hidden w-full flex justify-center pt-4">
            <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 md:py-5 border-b border-white/5">
            <h3 className="text-base font-black text-white uppercase tracking-[0.2em] italic">{title}</h3>
            <button 
                onClick={onClose} 
                className="p-2 bg-white/5 md:bg-transparent hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
            >
                <X size={20} strokeWidth={3} />
            </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8">
            {children}
        </div>
      </div>
    </div>
  );
}
