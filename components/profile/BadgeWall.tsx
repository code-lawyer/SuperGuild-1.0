'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { usePrivilegeNFTs } from '@/hooks/usePrivilegeNFTs';
import BadgeShowcaseModal from '@/components/3d/BadgeShowcaseModal';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import BadgeModel from '@/components/3d/BadgeModel';

export default function BadgeWall() {
    const t = useT();
    const { hasPioneer, hasFlame, hasLantern, isLoading } = usePrivilegeNFTs();

    const [modalOpen, setModalOpen] = useState(false);
    const [activeBadgeType, setActiveBadgeType] = useState<'pioneer' | 'flame' | 'lantern' | null>(null);
    const [activeBadgeName, setActiveBadgeName] = useState('');

    const badges = [
        {
            type: 'pioneer' as const,
            name: t.badges.pioneerName,
            desc: t.badges.pioneerDesc,
            owned: hasPioneer,
        },
        {
            type: 'flame' as const,
            name: t.badges.flameName,
            desc: t.badges.flameDesc,
            owned: hasFlame,
        },
        {
            type: 'lantern' as const,
            name: t.badges.lanternName,
            desc: t.badges.lanternDesc,
            owned: hasLantern,
        }
    ];

    // 只展示已拥有的徽章 (不显示 0/3)
    const ownedBadges = badges.filter(b => b.owned);

    if (isLoading || ownedBadges.length === 0) {
        return null; // 用户要求未解锁时不展示，加载中也不展示避免跳动
    }

    const handleOpenShowcase = (type: 'pioneer' | 'flame' | 'lantern', name: string) => {
        setActiveBadgeType(type);
        setActiveBadgeName(name);
        setModalOpen(true);
    };

    return (
        <>
            {/* 增加与下方组件的间距 mb-16 (之前嫌太近) */}
            <div className="mb-16 w-full">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-medium tracking-tight text-slate-900 dark:text-white">
                        {t.badges.title}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ownedBadges.map((badge) => (
                        <div
                            key={badge.type}
                            onClick={() => handleOpenShowcase(badge.type, badge.name)}
                            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-[#1f2229] p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl"
                        >
                            {/* 标准大小的外框包裹 3D 图标 */}
                            <div className="w-32 h-32 mb-6 relative rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-black/20 overflow-hidden flex items-center justify-center">
                                {/* 使用 3D Canvas 渲染真实 GLB 的自动旋转缩略图 */}
                                <Canvas
                                    camera={{ position: [0, 0, 4], fov: 40 }}
                                    gl={{ antialias: true, alpha: true }}
                                >
                                    <Suspense fallback={null}>
                                        <ambientLight intensity={1.2} />
                                        <spotLight position={[5, 10, 5]} intensity={2.5} castShadow={false} />
                                        <Environment preset="city" />
                                        <Center>
                                            <BadgeModel type={badge.type} isThumbnail={true} />
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
                                {badge.name}
                            </h4>

                            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                                {badge.desc}
                            </div>

                            {/* Hover 黑幕提示 */}
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
                onClose={() => setModalOpen(false)}
                badgeType={activeBadgeType}
                badgeName={activeBadgeName}
            />
        </>
    );
}
