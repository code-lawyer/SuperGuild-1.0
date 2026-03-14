'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useT } from '@/lib/i18n';
import { useMyProfile, useProfileByAddress, useUpdateMyProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useMyCollaborations, type Collaboration } from '@/hooks/useCollaborations';
import { useVCP } from '@/hooks/useVCP';
import PioneerCard from '@/components/pioneer/PioneerCard';
import BadgeWall from '@/components/profile/BadgeWall';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SquareLoader } from '@/components/ui/SquareLoader';

function ProfilePageInner() {
    const t = useT();
    const { address } = useAccount();
    const searchParams = useSearchParams();
    const targetAddress = searchParams.get('address') || null;

    // Are we viewing our own profile?
    const isOwnProfile = !targetAddress || targetAddress.toLowerCase() === address?.toLowerCase();

    // Own profile data
    const { data: myProfile, isLoading: myLoading } = useMyProfile();
    // Public profile data (for viewing others)
    const { data: pubProfile, isLoading: pubLoading } = useProfileByAddress(
        isOwnProfile ? null : targetAddress
    );

    const { data: collabs } = useMyCollaborations();
    const { vcp } = useVCP();
    const updateProfile = useUpdateMyProfile();
    const uploadAvatar = useUploadAvatar();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ username: '', contact_email: '', contact_telegram: '', bio: '', portfolio: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const profile = isOwnProfile ? myProfile : pubProfile;
    const isLoading = isOwnProfile ? myLoading : pubLoading;

    const startEdit = () => {
        if (!isOwnProfile || !myProfile) return;
        setForm({
            username: myProfile.username || '',
            contact_email: myProfile.contact_email || '',
            contact_telegram: myProfile.contact_telegram || '',
            bio: myProfile.bio || '',
            portfolio: myProfile.portfolio || '',
        });
        setEditing(true);
    };

    const handleSave = () => {
        updateProfile.mutate(form);
        setEditing(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadAvatar.mutate(file);
    };

    if (!mounted || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
                <SquareLoader />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary/60 animate-pulse">Loading</span>
            </div>
        );
    }

    const myCollabs = collabs ?? [];
    const displayVcp = isOwnProfile
        ? (parseFloat(String(vcp)) || (myProfile?.vcp_cache ?? 0))
        : (pubProfile?.vcp_cache ?? 0);
    const vcpNum = Number(displayVcp);
    const vcpPercent = Math.min((vcpNum / 1000) * 100, 100);
    const displayAddr = isOwnProfile ? address : targetAddress;

    return (
        <div className="max-w-[960px] mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-slate-500 mb-6">
                <Link href="/" className="hover:text-primary transition-colors">{t.common.home}</Link>
                <span className="material-symbols-outlined !text-[16px] mx-2">chevron_right</span>
                <span className="text-slate-900 dark:text-white font-medium">{t.profile.title}</span>
            </nav>

            {/* Profile Header */}
            <section className="flex flex-col items-center text-center mb-10 py-10 relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/40">
                {/* Avatar */}
                <div className="relative mb-5 z-10 group">
                    <div className="w-24 h-24 rounded-full ring-2 ring-primary/30 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined !text-[40px] text-primary/50">person</span>
                        )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow-sm" />
                    {/* Avatar upload overlay — own profile only */}
                    {isOwnProfile && (
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadAvatar.isPending}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                            {uploadAvatar.isPending ? (
                                <span className="material-symbols-outlined !text-[20px] text-white animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined !text-[20px] text-white">photo_camera</span>
                            )}
                        </button>
                    )}
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* Name & bio */}
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight z-10">
                    {profile?.username || t.profile.anonymous}
                </h2>
                {profile?.bio && (
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm leading-relaxed z-10">{profile.bio}</p>
                )}

                {/* Address pill */}
                {displayAddr && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tracking-wide">
                            {displayAddr.slice(0, 6)}…{displayAddr.slice(-4)}
                        </span>
                    </div>
                )}

                {/* Portfolio link (public profile only, if set) */}
                {!isOwnProfile && profile?.portfolio && (
                    <a
                        href={profile.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline z-10"
                    >
                        <span className="material-symbols-outlined !text-[14px]">open_in_new</span>
                        {t.profile.portfolio}
                    </a>
                )}

                {/* Edit button — own profile only */}
                {isOwnProfile && (
                    <button
                        onClick={startEdit}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:text-primary transition-all z-10"
                    >
                        <span className="material-symbols-outlined !text-[14px]">edit</span>
                        {t.profile.editProfile}
                    </button>
                )}
            </section>

            {/* Reputation Score */}
            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-10 overflow-hidden">
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.profile.vcpPoints}</span>
                        </div>
                    </div>

                    {/* Stats grid — own profile shows collab counts, public shows just VCP */}
                    {isOwnProfile ? (
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
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <span className="text-3xl font-black text-primary">{Math.round(vcpNum)}</span>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-wide mt-1">{t.profile.vcpPoints}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3D Privilege Badges — own profile only */}
            {isOwnProfile && (
                <ErrorBoundary>
                    <BadgeWall />
                </ErrorBoundary>
            )}

            {/* Recent Contributions — own profile only */}
            {isOwnProfile && (
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
            )}

            {/* Pioneer Program — own profile only */}
            {isOwnProfile && (
                <section className="mb-12">
                    <PioneerCard />
                </section>
            )}

            {/* Edit Modal — own profile only */}
            {editing && isOwnProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditing(false)} />
                    <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
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
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.profile.portfolio}</label>
                                <input
                                    value={form.portfolio}
                                    onChange={e => setForm({ ...form, portfolio: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                disabled={updateProfile.isPending}
                                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {updateProfile.isPending ? '...' : t.common.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const searchParams_raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasAddressParam = searchParams_raw?.has('address') ?? false;

    return (
        <WalletGatePage>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
                    <SquareLoader />
                </div>
            }>
                <ProfilePageInner />
            </Suspense>
        </WalletGatePage>
    );
}
