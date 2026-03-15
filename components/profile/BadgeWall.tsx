'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n';
import { usePrivilegeNFTs } from '@/hooks/usePrivilegeNFTs';
import { useBadgeLore } from '@/hooks/useBadgeLore';
import BadgeShowcaseModal from '@/components/3d/BadgeShowcaseModal';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveBadge {
    glbPath: string;
    glowColor: string;
    name: string;
    privilege: string;
}

export default function BadgeWall() {
    const t = useT();
    const { locale } = useI18n();
    const { balances, isLoading, isError, refetch } = usePrivilegeNFTs();
    const { data: loreData } = useBadgeLore();

    const [modalOpen, setModalOpen] = useState(false);
    const [activeBadge, setActiveBadge] = useState<ActiveBadge | null>(null);
    const [clickedKey, setClickedKey] = useState<string | null>(null);

    // Build badge list — only owned badges
    const tokenEntries = Object.entries(PRIVILEGE_NFT.tokens);
    const ownedBadges = tokenEntries
        .sort(([, a], [, b]) => Number(a.id) - Number(b.id))
        .map(([key, token], index) => ({
            key,
            token,
            owned: (balances[index] ?? 0) > 0,
            // lore from DB keyed by token_id
            lore: loreData?.find(l => l.token_id === Number(token.id)),
        }))
        .filter((b) => b.owned);

    const handleOpen = (badge: typeof ownedBadges[number]) => {
        setClickedKey(badge.key);
        setTimeout(() => {
            setActiveBadge({
                glbPath: badge.token.glbPath,
                glowColor: badge.token.glowColor,
                name: locale === 'zh' ? badge.token.zh : badge.token.name,
                privilege: locale === 'zh' ? badge.token.privilege : badge.token.privilegeEn,
            });
            setModalOpen(true);
            setClickedKey(null);
        }, 300);
    };

    // Get lore display text: origin + symbolism from DB, or fallback
    function getLoreText(badge: typeof ownedBadges[number]): string {
        const l = badge.lore;
        if (!l) return t.badges.lorePending;
        const origin = locale === 'zh' ? l.origin_zh : l.origin_en;
        const symbolism = locale === 'zh' ? l.symbolism_zh : l.symbolism_en;
        const parts = [origin, symbolism].filter(Boolean);
        return parts.length > 0 ? parts.join(' · ') : t.badges.lorePending;
    }

    return (
        <>
            <section className="mb-12 w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {t.badges.title}
                    </h3>
                    {isError && (
                        <button
                            onClick={() => refetch()}
                            className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined !text-[14px]">warning</span>
                            {t.badges.rpcError}
                            <span className="material-symbols-outlined !text-[14px]">refresh</span>
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900/30 animate-pulse" />
                        ))}
                    </div>
                ) : ownedBadges.length === 0 ? (
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
                        <span className="material-symbols-outlined !text-[32px] text-slate-300 dark:text-slate-600 mb-2">military_tech</span>
                        <p className="text-sm text-slate-400">{t.badges.noBadges}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {ownedBadges.map((badge) => {
                                const isClicked = clickedKey === badge.key;
                                const displayName = locale === 'zh' ? badge.token.zh : badge.token.name;
                                const loreText = getLoreText(badge);

                                return (
                                    <motion.div
                                        key={badge.key}
                                        onClick={() => handleOpen(badge)}
                                        className="group relative bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                                        animate={isClicked ? {
                                            scale: [1, 1.015, 1],
                                            boxShadow: [
                                                `0 0 0px ${badge.token.glowColor}00`,
                                                `0 0 28px ${badge.token.glowColor}60`,
                                                `0 0 0px ${badge.token.glowColor}00`,
                                            ],
                                        } : {}}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                    >
                                        {/* Glow overlay on click */}
                                        <AnimatePresence>
                                            {isClicked && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute inset-0 z-10 pointer-events-none"
                                                    style={{
                                                        background: `radial-gradient(ellipse at center, ${badge.token.glowColor}15 0%, transparent 70%)`,
                                                    }}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {/* Color accent strip left edge */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-[3px]"
                                            style={{ background: badge.token.glowColor }}
                                        />

                                        <div className="flex items-center gap-5 p-4 pl-5">
                                            {/* Badge thumbnail — static glow icon; 3D lives in the modal only */}
                                            <div
                                                className="w-16 h-16 flex-shrink-0 rounded-xl flex items-center justify-center border"
                                                style={{
                                                    background: `radial-gradient(ellipse at center, ${badge.token.glowColor}22 0%, transparent 80%)`,
                                                    borderColor: `${badge.token.glowColor}40`,
                                                    boxShadow: `0 0 16px ${badge.token.glowColor}30`,
                                                }}
                                            >
                                                <span
                                                    className="material-symbols-outlined !text-[28px]"
                                                    style={{ color: badge.token.glowColor }}
                                                >
                                                    military_tech
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                                                    {displayName}
                                                </h4>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2 italic">
                                                    {loreText}
                                                </p>
                                            </div>

                                            {/* View 3D button */}
                                            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors text-xs font-medium">
                                                <span className="material-symbols-outlined !text-[16px]">3d_rotation</span>
                                                {t.badges.viewIn3D}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            <BadgeShowcaseModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setActiveBadge(null); }}
                glbPath={activeBadge?.glbPath ?? null}
                glowColor={activeBadge?.glowColor ?? null}
                badgeName={activeBadge?.name ?? ''}
                privilege={activeBadge?.privilege}
            />
        </>
    );
}
