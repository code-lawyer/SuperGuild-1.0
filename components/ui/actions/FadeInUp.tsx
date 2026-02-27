"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/components/ui/MagneticButton";

interface FadeInUpProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    yOffset?: number;
    className?: string;
}

export function FadeInUp({
    children,
    delay = 0,
    duration = 0.8,
    yOffset = 20,
    className,
}: FadeInUpProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98], // Snappy but smooth custom ease
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
