'use client';

import { useState, Suspense } from 'react';
import { useT } from '@/lib/i18n';
import { usePrivilegeNFTs } from '@/hooks/usePrivilegeNFTs';
import BadgeShowcaseModal from '@/components/3d/BadgeShowcaseModal';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import BadgeModel from '@/components/3d/BadgeModel';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

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

    // Build full badge list with ownership status
    const tokenEntries = Object.entries(PRIVILEGE_NFT.tokens);
    const allBadges = tokenEntries
        .sort(([, a], [, b]) => Number(a.id) - Number(b.id))
        .map(([key, token], index) => ({
            key,
            token,
            owned: (balances[index] ?? 0) > 0,
            i18n: badgeI18n[key],
        }));

    const handleOpen = (badge: typeof allBadges[number]) => {
        if (!badge.owned) return;
        setActiveBadge({
            glbPath: badge.token.glbPath,
            glowColor: badge.token.glowColor,
            name: badge.i18n.name,
            privilege: badge.i18n.desc,
        });
        setModalOpen(true);
    };

    return (
        <>
            <div className="mb-16 w-full">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 p-6 h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {allBadges.map((badge) => (
                            <div
                                key={badge.key}
                                onClick={() => handleOpen(badge)}
                                className={`group relative overflow-hidden rounded-2xl border p-5 flex flex-col items-center justify-center transition-all duration-300 ${
                                    badge.owned
                                        ? 'bg-white dark:bg-[#0f1115] border-slate-100 dark:border-[#1f2229] cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl'
                                        : 'bg-slate-50/50 dark:bg-slate-900/20 border-dashed border-slate-200 dark:border-slate-800 cursor-default'
                                }`}
                            >
                                {/* 3D Preview or Locked Icon */}
                                <div className={`w-24 h-24 mb-4 relative rounded-xl overflow-hidden flex items-center justify-center ${
                                    badge.owned
                                        ? 'border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-black/20'
                                        : ''
                                }`}>
                                    {badge.owned ? (
                                        <Canvas
                                            camera={{ position: [0, 0, 4], fov: 40 }}
                                            gl={{ antialias: true, alpha: true }}
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
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="material-symbols-outlined !text-[36px] text-slate-300 dark:text-slate-600">lock</span>
                                        </div>
                                    )}
                                </div>

                                {/* Badge Name */}
                                <h4 className={`text-sm font-semibold text-center mb-1 ${
                                    badge.owned
                                        ? 'text-slate-800 dark:text-slate-200'
                                        : 'text-slate-400 dark:text-slate-600'
                                }`}>
                                    {badge.i18n.name}
                                </h4>

                                {/* Privilege / Description */}
                                <div className={`text-[11px] text-center leading-snug ${
                                    badge.owned
                                        ? 'text-slate-400 dark:text-slate-500'
                                        : 'text-slate-300 dark:text-slate-700'
                                }`}>
                                    {badge.i18n.desc}
                                </div>

                                {/* How to obtain (not-owned only) */}
                                {!badge.owned && (
                                    <div className="mt-2 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50">
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 tracking-wide">
                                            {badge.i18n.how}
                                        </span>
                                    </div>
                                )}

                                {/* Not owned badge */}
                                {!badge.owned && (
                                    <span className="absolute top-3 right-3 text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                                        {t.badges.notOwned}
                                    </span>
                                )}

                                {/* Hover overlay (owned only) */}
                                {badge.owned && (
                                    <div className="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-slate-800 dark:text-white font-medium flex items-center gap-2 tracking-wide text-sm">
                                            <span className="material-symbols-outlined !text-xl">3d_rotation</span>
                                            {t.badges.clickToView}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
