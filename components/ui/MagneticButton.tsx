"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for class merging
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface MagneticButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
    children: React.ReactNode;
    className?: string;
    magneticIntensity?: number; // How strong the pull is
}

export function MagneticButton({
    children,
    className,
    magneticIntensity = 0.3, // Reduced intensity to make it subtle
    ...props
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);

    // Custom springs for a smooth but responsive feel
    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const x = useSpring(0, springConfig);
    const y = useSpring(0, springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();

        // Calculate center of button
        const middleX = left + width / 2;
        const middleY = top + height / 2;

        // Calculate distance from center
        const offsetX = (clientX - middleX) * magneticIntensity;
        const offsetY = (clientY - middleY) * magneticIntensity;

        x.set(offsetX);
        y.set(offsetY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ x: 0, y: 0 }}
            style={{ x, y }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className={cn(
                "relative inline-flex items-center justify-center isolation-auto z-10",
                "transition-colors duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                className
            )}
            {...props}
        >
            {/* Content wrapper to slightly offset content opposite to button move for parallax effect */}
            <motion.span
                style={{
                    x: useTransform(x, (val) => val * 0.2),
                    y: useTransform(y, (val) => val * 0.2)
                }}
                className="relative z-10 flex items-center justify-center w-full h-full"
            >
                {children}
            </motion.span>
        </motion.button>
    );
}
