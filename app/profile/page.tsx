'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useT } from '@/lib/i18n';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { useVCP } from '@/hooks/useVCP';
import PioneerCard from '@/components/pioneer/PioneerCard';
import BadgeWall from '@/components/profile/BadgeWall';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ProfilePage() {
    const t = useT();
    const { address } = useAccount();
    const { data: profile, isLoading } = useMyProfile();
    const { data: collabs } = useMyCollaborations();
    const { vcp } = useVCP();
    const updateProfile = useUpdateMyProfile();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ username: '', contact_email: '', contact_telegram: '', bio: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const myCollabs = collabs ?? [];

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
                    <Link href="/" className="hover:text-primary transition-colors">{t.common.home}</Link>
                    <span className="material-symbols-outlined !text-[16px] mx-2">chevron_right</span>
                    <span className="text-slate-900 dark:text-white font-medium">{t.profile.title}</span>
                </nav>

                {/* Profile Header */}
                <section className="flex flex-col items-center text-center mb-10 py-10 relative overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent border border-slate-100 dark:border-slate-800/60">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                    {/* Avatar */}
                    <div className="relative mb-5 z-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-blue-400 to-purple-400 p-[2.5px] shadow-lg shadow-primary/20">
                            <div className="w-full h-full rounded-full bg-white dark:bg-[#101922] flex items-center justify-center overflow-hidden">
                                <span className="material-symbols-outlined !text-[40px] text-primary/50">person</span>
                            </div>
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-[#101922] shadow-sm" />
                    </div>

                    {/* Name & bio */}
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight z-10">
                        {profile?.username || t.profile.anonymous}
                    </h2>
                    {profile?.bio && (
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm leading-relaxed z-10">{profile.bio}</p>
                    )}

                    {/* Address pill */}
                    {address && (
                        <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tracking-wide">
                                {address.slice(0, 6)}…{address.slice(-4)}
                            </span>
                        </div>
                    )}

                    {/* Edit button */}
                    <button
                        onClick={startEdit}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary transition-all z-10"
                    >
                        <span className="material-symbols-outlined !text-[14px]">edit</span>
                        {t.profile.editProfile}
                    </button>
                </section>

                {/* Reputation Score */}
                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-10 overflow-hidden">
                    {/* Top label bar */}
                    <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[14px] text-primary">verified</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t.profile.reputationScore}</span>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row items-center gap-8">
                        {/* Circular VCP gauge */}
                        <div className="relative w-28 h-28 flex-shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-700" />
                                <circle
                                    cx="60" cy="60" r="50"
                                    fill="none" stroke="#137fec" strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${vcpPercent * 3.14} ${(100 - vcpPercent) * 3.14}`}
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(19,127,236,0.4))' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(vcpNum)}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.profile.vcpPoints}</span>
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="flex-1 grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{myCollabs.length}</span>
                                <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wide">{t.dashboard.activeQuests}</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40">
                                <span className="text-2xl font-black text-emerald-500">
                                    {myCollabs.filter((c: Collaboration) => c.status === 'SETTLED').length}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wide">{t.common.completed}</span>
                            </div>
                            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <span className="material-symbols-outlined !text-[22px] text-primary mb-1">trending_up</span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wide">{t.profile.topContributor}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D Privilege Badges */}
                <ErrorBoundary>
                    <BadgeWall />
                </ErrorBoundary>

                {/* Recent Contributions */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.profile.recentContributions}</h3>
                        <div className="flex gap-2">
                            {[t.profile.tabAll, t.profile.tabDevelopment, t.profile.tabDesign].map(tab => (
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
