'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile';
import { useT } from '@/lib/i18n';

export default function ProfileGateModal() {
    const { isConnected } = useAccount();
    const { data: profile, isLoading } = useMyProfile();
    const updateProfile = useUpdateMyProfile();
    const t = useT();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [telegram, setTelegram] = useState('');
    const [bio, setBio] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isOpen = mounted && isConnected && !isLoading && profile && !profile.profile_completed;

    // Pre-fill from existing profile
    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setEmail(profile.contact_email || '');
            setTelegram(profile.contact_telegram || '');
            setBio(profile.bio || '');
            setPortfolio(profile.portfolio || '');
        }
    }, [profile]);

    if (!isOpen) return null;

    const hasContact = email.trim() || telegram.trim();
    const canSubmit = username.trim() && hasContact && !updateProfile.isPending;

    const handleSubmit = async () => {
        setError('');
        if (!username.trim()) { setError(t.profileGate.errorNoUsername); return; }
        if (!hasContact) { setError(t.profileGate.errorNoContact); return; }

        try {
            await updateProfile.mutateAsync({
                username: username.trim(),
                bio: bio.trim(),
                contact_email: email.trim(),
                contact_telegram: telegram.trim(),
                portfolio: portfolio.trim(),
            });
        } catch (e: any) {
            setError(e.message || t.profileGate.errorSaveFailed);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#121317]/40 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 ag-card p-8 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined !text-[32px] text-primary">person_add</span>
                    </div>
                    <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">{t.profileGate.title}</h2>
                    <p className="text-[14px] text-slate-400 dark:text-slate-500 mt-1.5">{t.profileGate.subtitle}</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Username (required) */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                            {t.profileGate.usernameLabel} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t.profileGate.usernamePlaceholder}
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform"
                        />
                    </div>

                    {/* Contact: Email */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                            Email <span className="text-[#B8BACA]">({t.profileGate.contactHint})</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform"
                        />
                    </div>

                    {/* Contact: Telegram */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                            Telegram
                        </label>
                        <input
                            type="text"
                            value={telegram}
                            onChange={(e) => setTelegram(e.target.value)}
                            placeholder="@username"
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform"
                        />
                    </div>

                    {/* Bio (optional) */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                            {t.profileGate.bioLabel} <span className="text-[#B8BACA]">({t.profileGate.optional})</span>
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder={t.profileGate.bioPlaceholder}
                            rows={2}
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform resize-none"
                        />
                    </div>

                    {/* Portfolio (optional) */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                            {t.profileGate.portfolioLabel} <span className="text-[#B8BACA]">({t.profileGate.optional})</span>
                        </label>
                        <input
                            type="url"
                            value={portfolio}
                            onChange={(e) => setPortfolio(e.target.value)}
                            placeholder="https://your-portfolio.com"
                            className="w-full bg-white border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-colors transition-transform"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-[13px] text-red-500 font-medium text-center">{error}</p>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="ag-btn-primary w-full py-3.5 text-[14px] font-bold disabled:opacity-40"
                >
                    {updateProfile.isPending ? (
                        <>
                            <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
                            {t.profileGate.saving}
                        </>
                    ) : (
                        t.profileGate.saveAndContinue
                    )}
                </button>

                <p className="text-[11px] text-[#B8BACA] text-center">
                    {t.profileGate.contactNote}
                </p>
            </div>
        </div>
    );
}
