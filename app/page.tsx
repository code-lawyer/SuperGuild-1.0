'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TypewriterHeading } from '@/components/ui/actions/TypewriterHeading';
import { FadeInUp } from '@/components/ui/actions/FadeInUp';
import { MouseGlowBackground } from '@/components/3d/MouseGlowBackground';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return <LandingPage />;
}

// The core values are now dynamically fetched from `t.landing.coreValues` inside the component.

/* ════════════════════════════════════════════════════
   Scroll-triggered Blur Typewriter
   ════════════════════════════════════════════════════ */
function ScrollTypewriter({ text, className }: { text: string; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });

  const characters = Array.from(text);

  return (
    <span ref={ref} className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(6px)" }}
          transition={{
            duration: 0.3,
            delay: index * 0.02,
            ease: "easeOut"
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════════════
   Main Landing Page Component
   ════════════════════════════════════════════════════ */
function LandingPage() {
  const t = useT();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background with glowing interactions */}
      <MouseGlowBackground />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-6 space-y-8 pt-32 pb-24 relative z-10 min-h-[85vh]">
        <FadeInUp delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-primary/5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            {t.landing.initSequence}
          </div>
        </FadeInUp>

        <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter flex flex-col items-center gap-2 drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          <TypewriterHeading
            text={t.landing.heroTitle}
            element="span"
            delay={0.2}
          />
          <TypewriterHeading
            text={t.landing.heroHighlight}
            element="span"
            className="text-primary pb-2 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.4)]"
            delay={0.8}
          />
        </h2>

        <FadeInUp delay={1.8} yOffset={30}>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl font-medium tracking-wide drop-shadow-sm dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {t.landing.heroDescription}
          </p>
        </FadeInUp>

        <FadeInUp delay={2.0} yOffset={20} className="flex gap-4 pt-4">
          <MagneticButton
            onClick={() => router.push('/dashboard')}
            className="px-10 py-4 bg-primary text-white font-bold text-base rounded-2xl transition-all flex items-center gap-3 shadow-xl hover:shadow-primary/30 hover:-translate-y-1 active:scale-95"
          >
            <span>{t.landing.connectTerminal || 'Enter Dashboard'}</span>
            <span className="material-symbols-outlined !text-[20px]">arrow_forward</span>
          </MagneticButton>
        </FadeInUp>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <span className="text-[10px] uppercase font-mono tracking-widest">{t.landing.scrollToLoad || 'Scroll to Load'}</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-slate-400 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* Core Values Scroll Section */}
      <section className="max-w-[1280px] mx-auto px-6 py-32 relative z-10 w-full border-t border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-900/10">
        <div className="flex flex-col gap-32 lg:gap-48 pb-16">
          {t.landing.coreValues.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col md:flex-row items-start gap-8 md:gap-16 lg:gap-24 relative"
            >
              {/* Decorative ID Marker */}
              <div className="absolute -left-4 md:-left-12 -top-6 text-[80px] md:text-[120px] font-black leading-none text-slate-100 dark:text-slate-800/30 select-none pointer-events-none z-0">
                {feature.id}
              </div>

              {/* Left Column: Titles */}
              <div className="md:w-1/3 xl:w-1/4 pt-4 md:sticky md:top-32 z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-primary font-bold text-sm uppercase tracking-wider pl-1">
                  {feature.subtitle}
                </p>
              </div>

              {/* Right Column: Detailed Animated Text */}
              <div className="md:w-2/3 xl:w-3/4 relative z-10 pt-4 md:pt-4">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-primary/10 to-transparent hidden md:block opacity-50" />
                <p className="md:pl-10 text-lg md:text-xl lg:text-2xl leading-[1.8] md:leading-[1.9] text-slate-600 dark:text-slate-300 font-medium tracking-wide">
                  <ScrollTypewriter text={feature.description} />
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Footer Component
   ════════════════════════════════════════════════════ */
function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 py-12 bg-white dark:bg-[#0a0f18] mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 font-mono text-sm tracking-widest uppercase">
          <span className="material-symbols-outlined !text-[18px]">gavel</span>
          <span>{t.footer.copyright || 'SUPER GUILD © 2026. CODE IS LAW.'}</span>
        </div>
        <div className="flex flex-wrap gap-8">
          <a className="text-sm font-mono uppercase tracking-wider text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.privacy || 'Privacy'}</a>
          <a className="text-sm font-mono uppercase tracking-wider text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.terms || 'Terms'}</a>
          <a className="text-sm font-mono uppercase tracking-wider text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.documentation || 'Docs'}</a>
        </div>
      </div>
    </footer>
  );
}
