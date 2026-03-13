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
                "w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col shadow-sm",
                hoverEffect && "hover:border-primary/30 dark:hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
