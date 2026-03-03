import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "w-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm",
                hoverEffect && "hover:border-slate-300 dark:hover:border-slate-700 transition-colors",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
