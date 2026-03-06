'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { usePrivilegeNFTs } from '@/hooks/usePrivilegeNFTs';
import BadgeShowcaseModal from '@/components/3d/BadgeShowcaseModal';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import BadgeModel from '@/components/3d/BadgeModel';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

interface ActiveBadge {
    glbPath: string;
    glowColor: string;
    name: string;
    privilege: string;
}

export default function BadgeWall() {
    const t = useT();
    const { balances, isLoading } = usePrivilegeNFTs();

    const [modalOpen, setModalOpen] = useState(false);
    const [activeBadge, setActiveBadge] = useState<ActiveBadge | null>(null);

    // 从配置生成徽章列表，过滤出已持有的（balance > 0）
    const ownedBadges = Object.values(PRIVILEGE_NFT.tokens)
        .map((token, index) => ({ token, balance: balances[index] ?? 0 }))
        .filter(({ balance }) => balance > 0)
        .map(({ token }) => token);

    if (isLoading || ownedBadges.length === 0) return null;

    const handleOpen = (token: typeof ownedBadges[number]) => {
        setActiveBadge({
            glbPath: token.glbPath,
            glowColor: token.glowColor,
            name: token.zh,
            privilege: token.privilege,
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ownedBadges.map((token) => (
                        <div
                            key={String(token.id)}
                            onClick={() => handleOpen(token)}
                            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-[#1f2229] p-6 flex flex-col items-center justify-center cursor-pointer transition-colors transition-transform duration-500 ease-out hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl"
                        >
                            <div className="w-32 h-32 mb-6 relative rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-black/20 overflow-hidden flex items-center justify-center">
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
                                                glbPath={token.glbPath}
                                                glowColor={token.glowColor}
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

                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                {token.zh}
                            </h4>

                            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide text-center">
                                {token.privilege}
                            </div>

                            <div className="absolute inset-0 bg-white/90 dark:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-slate-800 dark:text-white font-medium flex items-center gap-2 tracking-wide">
                                    <span className="material-symbols-outlined !text-xl">3d_rotation</span>
                                    {t.badges.clickToView}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
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
