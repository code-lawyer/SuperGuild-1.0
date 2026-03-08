'use client';

import { useState, Suspense } from 'react';
import { useT } from '@/lib/i18n';
import { usePrivilegeNFTs } from '@/hooks/usePrivilegeNFTs';
import BadgeShowcaseModal from '@/components/3d/BadgeShowcaseModal';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import BadgeModel from '@/components/3d/BadgeModel';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeI18n {
    name: string;
    desc: string;
    how: string;
}

interface ActiveBadge {
    glbPath: string;
    glowColor: string;
    name: string;
    privilege: string;
}

// Map token config keys to i18n keys
function useBadgeI18n() {
    const t = useT();
    const map: Record<string, BadgeI18n> = {
        PIONEER_MEMORIAL: { name: t.badges.pioneerName, desc: t.badges.pioneerDesc, how: t.badges.pioneerHow },
        LANTERN_KEEPER: { name: t.badges.lanternName, desc: t.badges.lanternDesc, how: t.badges.lanternHow },
        FIRST_FLAME: { name: t.badges.flameName, desc: t.badges.flameDesc, how: t.badges.flameHow },
        HAND_OF_JUSTICE: { name: t.badges.justiceName, desc: t.badges.justiceDesc, how: t.badges.justiceHow },
        BEACON: { name: t.badges.beaconName, desc: t.badges.beaconDesc, how: t.badges.beaconHow },
    };
    return map;
}

export default function BadgeWall() {
    const t = useT();
    const { balances, isLoading, isError, refetch } = usePrivilegeNFTs();
    const badgeI18n = useBadgeI18n();

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
            i18n: badgeI18n[key],
        }))
        .filter((b) => b.owned);

    const handleOpen = (badge: typeof ownedBadges[number]) => {
        // Trigger glow pulse animation
        setClickedKey(badge.key);
        // Open modal after brief delay for the glow effect
        setTimeout(() => {
            setActiveBadge({
                glbPath: badge.token.glbPath,
                glowColor: badge.token.glowColor,
                name: badge.i18n.name,
                privilege: badge.i18n.desc,
            });
            setModalOpen(true);
            setClickedKey(null);
        }, 300);
    };

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

                                        <div className="flex items-center gap-5 p-4">
                                            {/* 3D Thumbnail */}
                                            <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/50">
                                                <Canvas
                                                    camera={{ position: [0, 0, 4], fov: 40 }}
                                                    gl={{ antialias: true, alpha: true }}
                                                    frameloop="demand"
                                                >
                                                    <Suspense fallback={null}>
                                                        <ambientLight intensity={1.2} />
                                                        <spotLight position={[5, 10, 5]} intensity={2.5} castShadow={false} />
                                                        <Environment preset="city" />
                                                        <Center>
                                                            <BadgeModel
                                                                glbPath={badge.token.glbPath}
                                                                glowColor={badge.token.glowColor}
                                                                isThumbnail={true}
                                                            />
                                                        </Center>
                                                        <OrbitControls
                                                            enablePan={false}
                                                            enableZoom={false}
                                                            autoRotate
                                                            autoRotateSpeed={2}
                                                            enableDamping={true}
                                                        />
                                                    </Suspense>
                                                </Canvas>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                                                    {badge.i18n.name}
                                                </h4>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">
                                                    {badge.i18n.desc}
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
