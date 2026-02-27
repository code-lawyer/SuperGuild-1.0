'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile';

export default function ProfileGateModal() {
    const { isConnected } = useAccount();
    const { data: profile, isLoading } = useMyProfile();
    const updateProfile = useUpdateMyProfile();

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
        if (!username.trim()) { setError('请填写代号'); return; }
        if (!hasContact) { setError('请至少填写一种联系方式'); return; }

        try {
            await updateProfile.mutateAsync({
                username: username.trim(),
                bio: bio.trim(),
                contact_email: email.trim(),
                contact_telegram: telegram.trim(),
                portfolio: portfolio.trim(),
            });
        } catch (e: any) {
            setError(e.message || '保存失败');
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
                    <h2 className="text-[22px] font-bold text-[#121317] tracking-tight">完善个人档案</h2>
                    <p className="text-[14px] text-[#6A6A71] mt-1.5">请先填写以下信息，以便其他成员了解你</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Username (required) */}
                    <div>
                        <label className="block text-[12px] font-bold text-[#6A6A71] mb-1.5 uppercase tracking-wider">
                            代号 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="你的公开昵称"
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-4 py-3 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all"
                        />
                    </div>

                    {/* Contact: Email */}
                    <div>
                        <label className="block text-[12px] font-bold text-[#6A6A71] mb-1.5 uppercase tracking-wider">
                            Email <span className="text-[#B8BACA]">(至少填一个联系方式)</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-4 py-3 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all"
                        />
                    </div>

                    {/* Contact: Telegram */}
                    <div>
                        <label className="block text-[12px] font-bold text-[#6A6A71] mb-1.5 uppercase tracking-wider">
                            Telegram
                        </label>
                        <input
                            type="text"
                            value={telegram}
                            onChange={(e) => setTelegram(e.target.value)}
                            placeholder="@username"
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-4 py-3 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all"
                        />
                    </div>

                    {/* Bio (optional) */}
                    <div>
                        <label className="block text-[12px] font-bold text-[#6A6A71] mb-1.5 uppercase tracking-wider">
                            个人简介 <span className="text-[#B8BACA]">(选填)</span>
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="简单介绍下你自己…"
                            rows={2}
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-4 py-3 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all resize-none"
                        />
                    </div>

                    {/* Portfolio (optional) */}
                    <div>
                        <label className="block text-[12px] font-bold text-[#6A6A71] mb-1.5 uppercase tracking-wider">
                            作品集链接 <span className="text-[#B8BACA]">(选填)</span>
                        </label>
                        <input
                            type="url"
                            value={portfolio}
                            onChange={(e) => setPortfolio(e.target.value)}
                            placeholder="https://your-portfolio.com"
                            className="w-full bg-white border border-[#E8EAF0] rounded-2xl px-4 py-3 text-[14px] text-[#121317] placeholder:text-[#B8BACA] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/8 transition-all"
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
                            保存中…
                        </>
                    ) : (
                        '保存并继续'
                    )}
                </button>

                <p className="text-[11px] text-[#B8BACA] text-center">
                    联系方式仅在协作建立后对协作对象可见
                </p>
            </div>
        </div>
    );
}
