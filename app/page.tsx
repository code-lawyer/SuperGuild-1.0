'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useVCP } from '@/hooks/useVCP';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import PioneerCard from '@/components/pioneer/PioneerCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TypewriterHeading } from '@/components/ui/actions/TypewriterHeading';
import { FadeInUp } from '@/components/ui/actions/FadeInUp';
import { MouseGlowBackground } from '@/components/3d/MouseGlowBackground';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return isConnected ? <DashboardPage /> : <LandingPage />;
}

/* ════════════════════════════════════════════════════
   Landing Page (not connected)
   ════════════════════════════════════════════════════ */
function LandingPage() {
  const t = useT();
  const router = useRouter();

  const features = [
    { icon: 'hub', title: t.landing.featureServices, desc: t.landing.featureServicesDesc },
    { icon: 'group', title: t.landing.featureCollabs, desc: t.landing.featureCollabsDesc },
    { icon: 'verified', title: t.landing.featureVCP, desc: t.landing.featureVCPDesc },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Interactive Canvas Background */}
      <MouseGlowBackground />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 space-y-6 pt-24 pb-16 relative z-10">

        <FadeInUp delay={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined !text-[14px]">bolt</span>
            {t.landing.badge}
          </div>
        </FadeInUp>

        <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight flex flex-col items-center gap-1 md:gap-3 drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          <TypewriterHeading
            text={t.landing.heroTitle}
            element="span"
            delay={0.2}
          />
          <TypewriterHeading
            text={t.landing.heroHighlight}
            element="span"
            className="text-primary pb-2 drop-shadow-md"
            delay={0.8}
          />
        </h2>

        <FadeInUp delay={1.8} yOffset={30}>
          <p className="text-lg text-slate-600 dark:text-slate-200 max-w-2xl font-medium drop-shadow-sm dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {t.landing.heroDescription}
          </p>
        </FadeInUp>

        <FadeInUp delay={2.0} yOffset={20} className="flex gap-4">
          <MagneticButton
            onClick={() => router.push('#')}
            className="px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            {t.common.getStarted}
            <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
          </MagneticButton>
          <MagneticButton
            onClick={() => router.push('#')}
            magneticIntensity={0.15}
            className="px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-semibold hover:border-primary/50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined !text-[18px]">menu_book</span>
            {t.common.viewDocs}
          </MagneticButton>
        </FadeInUp>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeInUp key={f.icon} delay={2.2 + i * 0.1}>
              <div
                className="group h-full relative bg-white/80 backdrop-blur-md dark:bg-surface-dark/80 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-antigravity-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined !text-[28px] font-light">{f.icon}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div >
  );
}

/* ════════════════════════════════════════════════════
   Dashboard (connected)
   ════════════════════════════════════════════════════ */
function DashboardPage() {
  const t = useT();
  const { vcp } = useVCP();
  const { data: collabs, isLoading } = useMyCollaborations();

  const myCollabs = collabs ?? [];
  const activeCount = myCollabs.filter((c: Collaboration) => ['ACTIVE', 'LOCKED'].includes(c.status)).length;

  const statusLabels: Record<string, { color: string; label: string }> = {
    OPEN: { color: 'bg-blue-50 text-blue-600 border-blue-100', label: t.common.pending },
    PENDING_APPROVAL: { color: 'bg-orange-50 text-orange-600 border-orange-100', label: t.common.pending },
    LOCKED: { color: 'bg-cyan-50 text-cyan-600 border-cyan-100', label: t.common.locked },
    ACTIVE: { color: 'bg-cyan-50 text-cyan-600 border-cyan-100', label: t.common.inProgress },
    SETTLED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: t.common.completed },
    CANCELLED: { color: 'bg-red-50 text-red-600 border-red-100', label: t.common.cancelled },
    DISPUTED: { color: 'bg-yellow-50 text-yellow-600 border-yellow-100', label: t.common.disputed },
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">{t.dashboard.title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-card">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.dashboard.vcpScore}</p>
          <p className="text-4xl font-black text-primary">{vcp}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-card">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.dashboard.activeQuests}</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-card">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{t.dashboard.quickActions}</p>
          <div className="flex gap-3">
            <Link
              href="/collaborations/create"
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              {t.dashboard.newQuest}
            </Link>
            <Link
              href="/services"
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:border-primary/50 transition-colors"
            >
              {t.dashboard.browseServices}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Quests Table */}
      <div className="mb-4 flex items-center gap-3">
        <span className="w-1 h-6 bg-primary rounded-full" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.dashboard.recentQuests}</h3>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          </div>
        ) : myCollabs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <span className="material-symbols-outlined !text-[48px] mb-2">task_alt</span>
            <p className="text-sm">{t.common.noData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4">{t.dashboard.questTitle}</th>
                  <th className="px-6 py-4">{t.dashboard.status}</th>
                  <th className="px-6 py-4 text-right">{t.dashboard.budget}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm">
                {myCollabs.slice(0, 5).map((c: Collaboration) => {
                  const st = statusLabels[c.status] || { color: 'bg-slate-100 text-slate-600', label: c.status };
                  return (
                    <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        <Link href={`/collaborations/${c.id}`} className="hover:text-primary transition-colors">
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-mono">
                        {c.total_budget ? `${c.total_budget} VCP` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Footer
   ════════════════════════════════════════════════════ */
function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 py-12 bg-white dark:bg-surface-dark mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined !text-[20px]">token</span>
          <span className="text-sm font-medium">{t.footer.copyright}</span>
        </div>
        <div className="flex gap-8">
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.privacy}</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.terms}</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.documentation}</a>
          <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">{t.footer.support}</a>
        </div>
      </div>
    </footer>
  );
}
