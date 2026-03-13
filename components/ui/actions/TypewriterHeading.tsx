"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/MagneticButton";

interface TypewriterHeadingProps {
    text: string;
    className?: string;
    delay?: number;
    element?: React.ElementType;
}

export function TypewriterHeading({
    text,
    className,
    delay = 0,
    element: Wrapper = "h1",
}: TypewriterHeadingProps) {
    // Split text into words to wrap them properly, then into characters
    const words = text.split(" ");

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.03, delayChildren: delay },
        },
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 10,
        },
    };

    const Tag = Wrapper as React.FC<{ className?: string; children: React.ReactNode }>;
    return (
        <Tag className={cn("inline-flex flex-wrap items-center justify-center", className)}>
            <motion.span
                variants={container}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center overflow-hidden"
            >
                {words.map((word, index) => (
                    <span key={index} className="inline-flex overflow-hidden pb-1 mr-[0.3em] last:mr-0">
                        {word.split("").map((char, charIndex) => (
                            <motion.span variants={child} key={charIndex} className="inline-block relative">
                                {char}
                            </motion.span>
                        ))}
                    </span>
                ))}
            </motion.span>
        </Tag>
    );
}
