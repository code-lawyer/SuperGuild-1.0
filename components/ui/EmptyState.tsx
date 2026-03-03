import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    iconColor?: string;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    iconColor = "text-slate-300 dark:text-slate-700",
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "mt-12 flex flex-col items-center justify-center py-40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/10",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center max-w-sm"
            >
                <span className={cn(
                    "material-symbols-outlined !text-[64px] mb-6 animate-pulse drop-shadow-sm",
                    iconColor
                )}>
                    {icon}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 font-semibold tracking-wide uppercase leading-relaxed">
                    {description}
                </p>
            </motion.div>
        </div>
    );
}
