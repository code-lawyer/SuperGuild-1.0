'use client';

import Image from 'next/image';

interface LogoMarkProps {
    /** Rendered height in px (width auto-scales). Default 30. */
    size?: number;
    className?: string;
}

/**
 * SuperGuild LogoMark — renders the official brand emblem PNG.
 *
 * The PNG is navy (#1e3a5f) on transparent.
 *   Light mode : original navy, perfect on white/light header.
 *   Dark mode  : CSS filter converts to white so it reads on dark header.
 *
 * The parent Link wrapper handles hover scale + glow via group utilities.
 */
export default function LogoMark({ size = 30, className = '' }: LogoMarkProps) {
    return (
        <Image
            src="/logo-mark.png"
            alt="SuperGuild emblem"
            width={size}
            height={size}
            priority
            className={[
                // dark mode: invert navy → white
                'dark:brightness-0 dark:invert',
                className,
            ].filter(Boolean).join(' ')}
        />
    );
}
