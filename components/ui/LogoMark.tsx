'use client';

/**
 * SuperGuild LogoMark — SVG reproduction of the brand emblem.
 *
 * Structure (matching the original logo):
 *   Outer frame : large upward-pointing chevron, feet turning inward
 *   Inner frame : smaller nested chevron, feet turning outward — geometrically
 *                 crossing the outer legs to create the guild-knot motif
 *
 * All strokes use square linecap + miter linejoin for industrial precision.
 * Rendered in currentColor so it inherits the parent's text color.
 */

interface LogoMarkProps {
    /** Rendered width in px (height auto-scales 8:9 ratio). Default 28. */
    size?: number;
    className?: string;
}

export default function LogoMark({ size = 28, className = '' }: LogoMarkProps) {
    const h = Math.round(size * (36 / 32));

    return (
        <svg
            width={size}
            height={h}
            viewBox="0 0 32 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            {/*
             * Outer frame
             *   Left  leg: apex (16,2) → bottom-left (2,34) → inward foot (9,34)
             *   Right leg: apex (16,2) → bottom-right (30,34) → inward foot (23,34)
             */}
            <path
                d="M16 2L2 34H9"
                stroke="currentColor"
                strokeWidth="2.7"
                strokeLinecap="square"
                strokeLinejoin="miter"
            />
            <path
                d="M16 2L30 34H23"
                stroke="currentColor"
                strokeWidth="2.7"
                strokeLinecap="square"
                strokeLinejoin="miter"
            />

            {/*
             * Inner frame  — drawn on top; the outward feet cross the outer legs,
             * creating the visual guild-knot at each bottom corner.
             *
             *   Outer left leg is at x ≈ 4.1 when y = 28.
             *   Inner left foot goes from x=9 → x=3.5 (passes through x=4.1 ✓)
             *   Outer right leg is at x ≈ 27.9 when y = 28.
             *   Inner right foot goes from x=23 → x=28.5 (passes through x=27.9 ✓)
             */}
            <path
                d="M16 8.5L9 28H3.5"
                stroke="currentColor"
                strokeWidth="2.7"
                strokeLinecap="square"
                strokeLinejoin="miter"
            />
            <path
                d="M16 8.5L23 28H28.5"
                stroke="currentColor"
                strokeWidth="2.7"
                strokeLinecap="square"
                strokeLinejoin="miter"
            />
        </svg>
    );
}
