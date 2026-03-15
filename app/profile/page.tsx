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

    const isOwnProfile = !targetAddress || targetAddress.toLowerCase() === address?.toLowerCase();

    const { data: myProfile, isLoading: myLoading } = useMyProfile();
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
    const [addrCopied, setAddrCopied] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const profile = isOwnProfile ? myProfile : pubProfile;
    const isLoading = isOwnProfile ? myLoading : pubLoading;

    const startEdit = () => {
        if (!isOwnProfile || !myProfile) return;
        setForm({
            username: myProfile.username || '',
            // contact fields are AES-encrypted in DB — never pre-fill client-side
            contact_email: '',
            contact_telegram: '',
            bio: myProfile.bio || '',
            portfolio: myProfile.portfolio || '',
        });
        setEditing(true);
    };

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync(form);
            setEditing(false);
        } catch {
            // error handled in onError toast
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadAvatar.mutate(file);
    };

    const copyAddress = () => {
        const addr = isOwnProfile ? address : targetAddress;
        if (!addr) return;
        navigator.clipboard.writeText(addr);
        setAddrCopied(true);
        setTimeout(() => setAddrCopied(false), 1800);
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
    const completedCount = myCollabs.filter((c: Collaboration) => c.status === 'SETTLED').length;
    const activeCount = myCollabs.filter((c: Collaboration) => !['SETTLED', 'CANCELLED'].includes(c.status)).length;

    const memberSince = (isOwnProfile ? myProfile?.created_at : (pubProfile as { created_at?: string } | null)?.created_at)
        ? new Date((isOwnProfile ? myProfile!.created_at : (pubProfile as { created_at?: string })!.created_at!)!)
            .toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        : null;

    return (
        <div className="max-w-[960px] mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-slate-400 mb-10">
                <Link href="/" className="hover:text-primary transition-colors duration-150">{t.common.home}</Link>
                <span className="mx-2 text-slate-200 dark:text-slate-700">/</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">{t.profile.title}</span>
            </nav>

            {/* ─── Main Layout: 2 columns on desktop ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-14 items-start">

                {/* ═══ LEFT: Identity column ═══ */}
                <aside className="lg:sticky lg:top-24 flex flex-col">

                    {/* Avatar */}
                    <div className="relative w-[72px] h-[72px] group mb-5">
                        <div
                            className="w-[72px] h-[72px] rounded-full overflow-hidden"
                            style={{ boxShadow: '0 0 0 1px rgba(19,127,236,0.25), 0 0 0 4px rgba(19,127,236,0.06)' }}
                        >
                            {profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-[32px] text-primary/30">person</span>
                                </div>
                            )}
                        </div>
                        {/* Online dot */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-bg-dark shadow-sm" />
                        {/* Upload overlay */}
                        {isOwnProfile && (
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadAvatar.isPending}
                                className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                            >
                                {uploadAvatar.isPending
                                    ? <span className="material-symbols-outlined !text-[16px] text-white animate-spin">progress_activity</span>
                                    : <span className="material-symbols-outlined !text-[16px] text-white">photo_camera</span>
                                }
                            </button>
                        )}
                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    {/* Name */}
                    <h1 className="text-[22px] font-black text-slate-900 dark:text-white tracking-[-0.02em] leading-tight">
                        {profile?.username || t.profile.anonymous}
                    </h1>

                    {/* Bio */}
                    {profile?.bio && (
                        <p className="mt-2.5 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {profile.bio}
                        </p>
                    )}

                    {/* Wallet address — copyable */}
                    {displayAddr && (
                        <button
                            onClick={copyAddress}
                            title={displayAddr}
                            className="mt-3 flex items-center gap-1.5 group/addr w-fit"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 group-hover/addr:text-primary transition-colors duration-150">
                                {displayAddr.slice(0, 6)}…{displayAddr.slice(-6)}
                            </span>
                            <span className="material-symbols-outlined !text-[11px] text-slate-300 dark:text-slate-600 opacity-0 group-hover/addr:opacity-100 transition-opacity duration-150">
                                {addrCopied ? 'check' : 'content_copy'}
                            </span>
                        </button>
                    )}

                    {/* Portfolio */}
                    {profile?.portfolio && (
                        <a
                            href={profile.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-primary hover:underline w-fit"
                        >
                            <span className="material-symbols-outlined !text-[13px]">open_in_new</span>
                            {t.profile.portfolio}
                        </a>
                    )}

                    {/* Thin divider */}
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/70 space-y-2.5">
                        {/* Member since */}
                        {memberSince && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <span className="material-symbols-outlined !text-[12px]">calendar_today</span>
                                <span className="font-medium uppercase tracking-wide">{memberSince}</span>
                            </div>
                        )}
                        {/* Chain badge */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                            <span className="material-symbols-outlined !text-[12px]">link</span>
                            <span className="font-medium uppercase tracking-wide">Arbitrum Sepolia</span>
                        </div>
                    </div>

                    {/* Edit profile link */}
                    {isOwnProfile && (
                        <button
                            onClick={startEdit}
                            className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-primary transition-colors duration-150 w-fit"
                        >
                            <span className="material-symbols-outlined !text-[13px]">edit</span>
                            {t.profile.editProfile}
                        </button>
                    )}
                </aside>

                {/* ═══ RIGHT: Content column ═══ */}
                <div className="min-w-0">

                    {/* ── Reputation strip ── */}
                    <div className="mb-10">
                        {/* Stats row */}
                        <div className="flex items-end gap-8 mb-4">
                            {/* VCP — primary metric */}
                            <div>
                                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
                                    {t.profile.vcpPoints}
                                </div>
                                <div className="text-[34px] font-black text-slate-900 dark:text-white tabular-nums leading-none">
                                    {Math.round(vcpNum)}
                                </div>
                            </div>

                            {isOwnProfile && (
                                <>
                                    {/* Vertical rule */}
                                    <div className="self-stretch w-px bg-slate-100 dark:bg-slate-800 mb-0.5" />

                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
                                            {t.common.completed}
                                        </div>
                                        <div className="text-xl font-black text-emerald-500 tabular-nums leading-none">
                                            {completedCount}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-1">
                                            {t.dashboard.activeQuests}
                                        </div>
                                        <div className="text-xl font-black text-slate-600 dark:text-slate-300 tabular-nums leading-none">
                                            {activeCount}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Progress track — precision ticks at 25% intervals */}
                        <div className="relative">
                            <div className="h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${vcpPercent}%` }}
                                />
                            </div>
                            {/* Tick marks */}
                            <div className="absolute inset-0 flex justify-between px-0 pointer-events-none">
                                {[25, 50, 75].map(tick => (
                                    <div
                                        key={tick}
                                        className="relative"
                                        style={{ left: `${tick}%`, width: 0 }}
                                    >
                                        <div className="absolute top-0 -translate-x-px w-px h-[2px] bg-slate-200 dark:bg-slate-700" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[10px] font-mono text-slate-300 dark:text-slate-700">0</span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {vcpNum.toFixed(1)} / 1000 · {vcpPercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* ── Recent Contributions ── */}
                    {isOwnProfile && (
                        <section className="mb-10">
                            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">
                                {t.profile.recentContributions}
                            </h2>

                            {myCollabs.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                    <span className="material-symbols-outlined !text-[28px] text-slate-200 dark:text-slate-700">assignment</span>
                                    <p className="text-sm text-slate-400">{t.common.noData}</p>
                                </div>
                            ) : (
                                <div>
                                    {myCollabs.slice(0, 5).map((c: Collaboration, i: number) => (
                                        <Link
                                            key={c.id}
                                            href={`/collaborations/${c.id}`}
                                            className={`flex items-center gap-4 py-3 group transition-all duration-100 hover:pl-1 ${
                                                i > 0 ? 'border-t border-slate-50 dark:border-slate-800/50' : ''
                                            }`}
                                        >
                                            {/* Status indicator */}
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                c.status === 'SETTLED' ? 'bg-emerald-400' :
                                                c.status === 'ACTIVE' ? 'bg-primary' :
                                                'bg-slate-300 dark:bg-slate-600'
                                            }`} />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors duration-150 truncate">
                                                    {c.title}
                                                </p>
                                                {c.description && (
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{c.description}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                    c.status === 'SETTLED'
                                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                                        : c.status === 'ACTIVE'
                                                        ? 'text-primary bg-primary/5'
                                                        : 'text-slate-400 bg-slate-50 dark:bg-slate-800/50'
                                                }`}>
                                                    {c.status}
                                                </span>
                                                <span className="text-[11px] font-mono text-slate-300 dark:text-slate-600 hidden sm:block">
                                                    {new Date(c.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {myCollabs.length > 5 && (
                                <button className="mt-4 text-xs font-semibold text-slate-400 hover:text-primary transition-colors duration-150">
                                    {t.profile.loadMore} →
                                </button>
                            )}
                        </section>
                    )}

                    {/* ── Privilege Badges ── */}
                    {isOwnProfile && (
                        <ErrorBoundary>
                            <BadgeWall />
                        </ErrorBoundary>
                    )}

                    {/* ── Pioneer ── */}
                    {isOwnProfile && (
                        <section className="mt-2">
                            <PioneerCard />
                        </section>
                    )}

                </div>
            </div>

            {/* ─── Edit Modal ─── */}
            {editing && isOwnProfile && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setEditing(false)} />
                    <div className="relative w-full sm:max-w-md mx-0 sm:mx-4 bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900 dark:text-white">
                                {t.profile.editProfile}
                            </h3>
                            <button
                                onClick={() => setEditing(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[16px]">close</span>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                                    {t.profile.username}
                                </label>
                                <input
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                                    {t.profile.bio}
                                </label>
                                <textarea
                                    value={form.bio}
                                    onChange={e => setForm({ ...form, bio: e.target.value })}
                                    rows={3}
                                    placeholder={t.profile.bioPlaceholder}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none resize-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                                    {t.profile.portfolio}
                                </label>
                                <input
                                    value={form.portfolio}
                                    onChange={e => setForm({ ...form, portfolio: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                                        {t.profile.email}
                                    </label>
                                    <input
                                        value={form.contact_email}
                                        onChange={e => setForm({ ...form, contact_email: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">
                                        {t.profile.telegram}
                                    </label>
                                    <input
                                        value={form.contact_telegram}
                                        onChange={e => setForm({ ...form, contact_telegram: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white text-sm focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 px-6 pb-6">
                            <button
                                onClick={() => setEditing(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={updateProfile.isPending}
                                className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm shadow-primary/20"
                            >
                                {updateProfile.isPending ? (
                                    <span className="flex items-center justify-center gap-1.5">
                                        <span className="material-symbols-outlined !text-[14px] animate-spin">progress_activity</span>
                                    </span>
                                ) : t.common.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
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
