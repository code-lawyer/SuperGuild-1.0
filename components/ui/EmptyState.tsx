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
            "mt-8 flex flex-col items-center justify-center py-32 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center text-center max-w-sm"
            >
                {/* Icon container with glow */}
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center mb-5 shadow-sm">
                    <span className={cn("material-symbols-outlined !text-[32px]", iconColor)}>
                        {icon}
                    </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                    {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {description}
                </p>
            </motion.div>
        </div>
    );
}
