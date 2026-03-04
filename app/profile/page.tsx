'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useT } from '@/lib/i18n';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { useSBTs } from '@/hooks/useSBTs';
import { useVCP } from '@/hooks/useVCP';
import PioneerCard from '@/components/pioneer/PioneerCard';
import BadgeWall from '@/components/profile/BadgeWall';
import { WalletGatePage } from '@/components/ui/WalletGatePage';

export default function ProfilePage() {
    const t = useT();
    const { address } = useAccount();
    const { data: profile, isLoading } = useMyProfile();
    const { data: collabs } = useMyCollaborations();
    const { data: sbts } = useSBTs();
    const { vcp } = useVCP();
    const updateProfile = useUpdateMyProfile();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ username: '', contact_email: '', contact_telegram: '', bio: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const myCollabs = collabs ?? [];
    const mySBTs = sbts ?? [];

    const startEdit = () => {
        setForm({
            username: profile?.username || '',
            contact_email: profile?.contact_email || '',
            contact_telegram: profile?.contact_telegram || '',
            bio: profile?.bio || '',
        });
        setEditing(true);
    };

    const handleSave = () => {
        updateProfile.mutate(form);
        setEditing(false);
    };

    // SSR 和客户端首帧统一渲染 loading，避免 hydration mismatch
    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400">
                <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
            </div>
        );
    }

    const vcpNum = parseFloat(String(vcp)) || 0;
    const vcpPercent = Math.min((vcpNum / 1000) * 100, 100);

    return (
        <WalletGatePage>
            <div className="max-w-[960px] mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center text-sm text-slate-500 mb-6">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined !text-[16px] mx-2">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">{t.profile.title}</span>
                </nav>

                {/* Profile Header */}
                <section className="flex flex-col items-center text-center mb-12">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-purple-400 p-[3px] mb-4">
                        <div className="w-full h-full rounded-full bg-white dark:bg-bg-dark flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined !text-[48px] text-primary/60">person</span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {profile?.username || t.profile.anonymous}
                    </h2>
                    {profile?.bio && (
                        <p className="text-slate-500 mt-2 max-w-md">{profile.bio}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-slate-500 text-sm">
                        <span className="material-symbols-outlined !text-[16px] text-primary">location_on</span>
                        <span>Base Network</span>
                    </div>
                    <button
                        onClick={startEdit}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary transition-colors transition-transform"
                    >
                        {t.profile.editProfile}
                        <span className="material-symbols-outlined !text-[16px]">edit</span>
                    </button>
                </section>

                {/* Score + SBTs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Reputation Score */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col items-center">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t.profile.reputationScore}</p>
                        <div className="relative w-32 h-32 mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
                                <circle
                                    cx="60" cy="60" r="50"
                                    fill="none" stroke="#137fec" strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${vcpPercent * 3.14} ${(100 - vcpPercent) * 3.14}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{Math.round(vcpNum)}</span>
                                <span className="text-xs text-slate-400 uppercase">{t.profile.vcpPoints}</span>
                            </div>
                        </div>
                        <span className="text-primary text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined !text-[16px]">trending_up</span>
                            {t.profile.topContributor}
                        </span>
                    </div>

                    {/* SBTs */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-card">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t.profile.soulboundTokens}</p>
                        </div>
                        {mySBTs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                <span className="material-symbols-outlined !text-[36px] mb-2">military_tech</span>
                                <p className="text-sm">{t.common.noData}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {mySBTs.map((sbt: any, i: number) => (
                                    <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined !text-[28px]">{sbt.icon || 'military_tech'}</span>
                                        </div>
                                        <span className="text-xs text-slate-500 text-center line-clamp-1">{sbt.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3D Privilege Badges */}
                <BadgeWall />

                {/* Recent Contributions */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.profile.recentContributions}</h3>
                        <div className="flex gap-2">
                            {['All', 'Development', 'Design'].map(tab => (
                                <button key={tab} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors first:bg-primary first:text-white">
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {myCollabs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p className="text-sm">{t.common.noData}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {myCollabs.slice(0, 5).map((c: Collaboration) => (
                                    <Link
                                        key={c.id}
                                        href={`/collaborations/${c.id}`}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined !text-[16px] text-primary">code</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{c.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-1">{c.description || ''}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</span>
                                        <span className="text-xs font-mono text-primary whitespace-nowrap">+{c.total_budget || 0} VCP</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {myCollabs.length > 5 && (
                        <button className="w-full mt-3 py-3 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                            {t.profile.loadMore}
                        </button>
                    )}
                </section>

                {/* Pioneer Program */}
                <section className="mb-12">
                    <PioneerCard />
                </section>

                {/* Edit Modal */}
                {editing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditing(false)} />
                        <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t.profile.editProfile}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.profile.username}</label>
                                    <input
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.profile.email}</label>
                                    <input
                                        value={form.contact_email}
                                        onChange={e => setForm({ ...form, contact_email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.profile.telegram}</label>
                                    <input
                                        value={form.contact_telegram}
                                        onChange={e => setForm({ ...form, contact_telegram: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.profile.bio}</label>
                                    <textarea
                                        value={form.bio}
                                        onChange={e => setForm({ ...form, bio: e.target.value })}
                                        rows={3}
                                        placeholder={t.profile.bioPlaceholder}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEditing(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 transition-colors"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
                                >
                                    {t.common.save}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </WalletGatePage>
    );
}
