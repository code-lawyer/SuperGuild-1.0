"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "./MagneticButton";
import { ReactNode } from "react";

interface PerspectiveTransitionProps {
    children: ReactNode;
    // Use a unique key for the current content (e.g., active tab name)
    id: string;
    className?: string;
    // Direction of the flip (e.g. 1 for forward, -1 for backward, or static if not strictly sequential)
    direction?: number;
}

export function PerspectiveTransition({
    children,
    id,
    className,
    direction = 1,
}: PerspectiveTransitionProps) {
    const variants = {
        enter: (dir: number) => ({
            // Start from the side, slightly pushed back and rotated
            x: dir > 0 ? 40 : -40,
            opacity: 0,
            rotateY: dir > 0 ? -15 : 15,
            scale: 0.95,
            z: -100, // pushed back
        }),
        center: {
            x: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1,
            z: 0,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30,
                mass: 1,
            },
        },
        exit: (dir: number) => ({
            // Exit to the other side, pushing back and rotating
            x: dir > 0 ? -40 : 40,
            opacity: 0,
            rotateY: dir > 0 ? 15 : -15,
            scale: 0.95,
            z: -100,
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 30,
                mass: 1,
            },
        }),
    };

    return (
        // The container needs perspective to make rotateY look 3D
        <div className={cn("relative w-full overflow-hidden", className)} style={{ perspective: "1200px" }}>
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                <motion.div
                    key={id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    // Ensure origins are correct for page turning effect
                    style={{ transformOrigin: "center center -50px" }}
                    className="w-full h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
