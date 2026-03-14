'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useBulletins, type Bulletin } from '@/hooks/useBulletins';
import { SquareLoader } from '@/components/ui/SquareLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { usePioneerGate } from '@/hooks/usePioneerGate';
import PioneerPostModal from '@/components/bulletin/PioneerPostModal';
import Markdown from '@/components/ui/Markdown';

function shortenAddress(addr: string) {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function PioneerBeaconPage() {
    const t = useT();
    const { bulletins, isLoading } = useBulletins('pioneer');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { isPioneer, isConnected, isLoading: nftLoading, isError: nftError, address, refetch } = usePioneerGate();

    const [cooldown, setCooldown] = useState<{ canPost: boolean; daysRemaining: number } | null>(null);

    useEffect(() => {
        if (!address || !isPioneer) return;
        fetch(`/api/bulletin/pioneer/status?address=${address}`)
            .then(res => res.json())
            .then(data => setCooldown(data))
            .catch(() => setCooldown(null));
    }, [address, isPioneer]);

    const getPostButtonState = () => {
        if (!isConnected) return { disabled: true, label: t.bulletin.connectWalletToPost, icon: 'wallet' };
        if (nftLoading) return { disabled: true, label: t.bulletin.nftChecking, icon: 'progress_activity', spin: true };
        if (nftError) return { disabled: true, label: t.bulletin.nftCheckFailed, icon: 'error', retry: true };
        if (!isPioneer) return { disabled: true, label: t.bulletin.nftRequired, icon: 'lock' };
        if (cooldown && !cooldown.canPost) return {
            disabled: true,
            label: t.bulletin.cooldownRemaining.replace('{days}', String(cooldown.daysRemaining)),
            icon: 'schedule'
        };
        return { disabled: false, label: t.bulletin.postBeacon, icon: 'crisis_alert' };
    };

    const btnState = getPostButtonState();

    return (
        <div className="relative min-h-screen selection:bg-amber-500/20">
            {/* Radial amber glow background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col relative z-10">
                {/* Page Header — beacon style */}
                <div className="mb-10">
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined !text-[26px] text-amber-500">crisis_alert</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                        {t.bulletin.pioneerTitle}
                                    </h1>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-widest">
                                        NFT #5
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">{t.bulletin.pioneerSubtitle}</p>
                            </div>
                        </div>

                        {/* Post Button */}
                        <button
                            onClick={() => {
                                if ('retry' in btnState && btnState.retry) {
                                    refetch();
                                } else if (!btnState.disabled) {
                                    setIsModalOpen(true);
                                }
                            }}
                            disabled={btnState.disabled && !('retry' in btnState && btnState.retry)}
                            title={btnState.label}
                            className={`sg-take-btn sg-take-btn-amber gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-colors shrink-0 ${
                                btnState.disabled
                                    ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                                    : 'text-amber-600 dark:text-amber-400'
                            }`}
                        >
                            <span className={`material-symbols-outlined !text-[16px] ${'spin' in btnState && btnState.spin ? 'animate-spin' : ''}`}>
                                {btnState.icon}
                            </span>
                            {btnState.label}
                        </button>
                    </div>

                    {/* Cooldown status bar for pioneer holders */}
                    {isPioneer && cooldown && (
                        <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 w-fit">
                            <span className={`w-1.5 h-1.5 rounded-full ${cooldown.canPost ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[11px] font-mono text-slate-500">
                                {cooldown.canPost ? t.bulletin.cooldownReady : t.bulletin.cooldownRemaining.replace('{days}', String(cooldown.daysRemaining))}
                            </span>
                        </div>
                    )}
                </div>

                <PioneerPostModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        if (address && isPioneer) {
                            fetch(`/api/bulletin/pioneer/status?address=${address}`)
                                .then(res => res.json())
                                .then(data => setCooldown(data))
                                .catch(() => {});
                        }
                    }}
                    authorAddress={address || ''}
                />

                {/* Beacon Feed */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <SquareLoader />
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/60 animate-pulse">{t.common.loading}</span>
                    </div>
                ) : bulletins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/20 text-center">
                        <span className="material-symbols-outlined !text-[48px] text-amber-400/40 mb-4">crisis_alert</span>
                        <p className="text-sm font-semibold text-slate-500">{t.bulletin.noPioneerBeacons}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-32">
                        {bulletins.map((b: Bulletin) => {
                            const isExpanded = expandedId === b.id;
                            const hasAttachments = b.bulletin_attachments && b.bulletin_attachments.length > 0;
                            return (
                                <motion.div
                                    layout
                                    key={b.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`group flex flex-col border rounded-xl overflow-hidden transition-all duration-300 ${
                                        isExpanded
                                            ? 'border-amber-500/40 bg-white dark:bg-bg-dark shadow-[0_8px_32px_-8px_rgba(245,158,11,0.2)] md:col-span-2 xl:col-span-3'
                                            : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.15)]'
                                    }`}
                                >
                                    {/* Amber top accent line */}
                                    <div className={`h-[2px] w-full transition-opacity ${isExpanded ? 'bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60 opacity-100' : 'bg-amber-500/20 opacity-60 group-hover:opacity-100'}`} />

                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                                        className="flex-1 text-left p-5 flex flex-col gap-3"
                                    >
                                        {/* Author identity */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined !text-[14px] text-amber-500">person</span>
                                                </div>
                                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                    {shortenAddress(b.author)}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                                                    {t.bulletin.pioneerBadge}
                                                </span>
                                            </div>
                                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all shrink-0 ${isExpanded ? 'bg-amber-500 text-white border-amber-500 rotate-180' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                            {b.title}
                                        </h3>

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-auto">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[12px]">schedule</span>
                                                {new Date(b.created_at).toLocaleDateString()}
                                            </span>
                                            {hasAttachments && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined !text-[12px]">attach_file</span>
                                                    {b.bulletin_attachments!.length}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 ml-auto text-slate-300 dark:text-slate-600">
                                                {`#${b.id.split('-')[0]}`}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-6 border-t border-amber-500/10 pt-5">
                                                    <div className="mb-6">
                                                        <Markdown content={b.content} />
                                                    </div>

                                                    {hasAttachments && (
                                                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-1 h-3 bg-amber-500" />
                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                                    {t.bulletin.attachments}
                                                                </h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {b.bulletin_attachments!.map(att => (
                                                                    <a
                                                                        key={att.id}
                                                                        href={att.file_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors group/att"
                                                                    >
                                                                        <span className="material-symbols-outlined !text-[18px] text-amber-500 opacity-70">description</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover/att:text-amber-600">{att.file_name}</div>
                                                                            {att.file_size && (
                                                                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                                                    {(att.file_size / 1024 / 1024).toFixed(2)} MB
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="material-symbols-outlined !text-[16px] text-slate-400 group-hover/att:text-amber-500 transition-colors">download</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
