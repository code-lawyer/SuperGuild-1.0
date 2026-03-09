'use client';

import { useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

export function ServiceModal({
    onClose,
    maxWidth = 'max-w-lg',
    children,
}: {
    onClose: () => void;
    maxWidth?: string;
    children: ReactNode;
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                className={`w-full ${maxWidth} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[85vh] overflow-y-auto`}
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

export function ServiceModalHeader({
    title,
    icon,
    avatar,
    onClose,
}: {
    title: string;
    icon?: string;
    avatar?: string | null;
    onClose: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
                {avatar ? (
                    <img src={avatar} alt={title} className="w-10 h-10 rounded-full object-cover" />
                ) : avatar === null ? (
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[20px] text-purple-400">person</span>
                    </div>
                ) : icon ? (
                    <div className="w-8 h-8 bg-blue-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[18px] text-blue-500">{icon}</span>
                    </div>
                ) : null}
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined !text-[20px]">close</span>
            </button>
        </div>
    );
}
