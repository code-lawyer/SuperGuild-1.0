'use client';

import Image from 'next/image';

/**
 * LogoWatermark — full-viewport ghost brand mark.
 *
 * Sits between the noise texture (z-[-10]) and all page content (z-10),
 * anchored to the bottom-right corner of the viewport.
 *
 * Light mode : navy logo at 3.5% opacity — barely perceptible on white.
 * Dark  mode : same filter as LogoMark (brightness-0 + invert → white),
 *              at 5% opacity — ghost presence on #101922 background.
 *
 * Never interferes with interaction (pointer-events: none).
 * Respects prefers-reduced-motion (static, no animation).
 */
export const LogoWatermark = () => (
    <div
        aria-hidden="true"
        className="fixed bottom-8 right-8 z-[-9] pointer-events-none select-none"
        style={{
            width:  'min(38vw, 420px)',
            height: 'min(38vw, 420px)',
        }}
    >
        <Image
            src="/logo-mark.png"
            alt=""
            fill
            sizes="420px"
            className="object-contain opacity-[0.035] dark:opacity-[0.055] dark:brightness-0 dark:invert"
            draggable={false}
        />
    </div>
);
