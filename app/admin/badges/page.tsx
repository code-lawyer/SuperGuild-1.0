'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useBadgeLore, useUpdateBadgeLore, BadgeLore } from '@/hooks/useBadgeLore';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

const TOKEN_LIST = Object.entries(PRIVILEGE_NFT.tokens)
    .sort(([, a], [, b]) => Number(a.id) - Number(b.id))
    .map(([, token]) => token);

type LoreField = 'origin_zh' | 'origin_en';

export default function AdminBadgesPage() {
    const t = useT();
    const { data: loreList, isLoading } = useBadgeLore();
    const update = useUpdateBadgeLore();

    // Local editable state: { [token_id]: Partial<BadgeLore> }
    const [drafts, setDrafts] = useState<Record<number, Partial<BadgeLore>>>({});
    const [savedId, setSavedId] = useState<number | null>(null);

    // Sync drafts from DB once loaded
    useEffect(() => {
        if (!loreList) return;
        const init: Record<number, Partial<BadgeLore>> = {};
        loreList.forEach(l => { init[l.token_id] = { ...l }; });
        setDrafts(init);
    }, [loreList]);

    const setField = (tokenId: number, field: LoreField, value: string) => {
        setDrafts(prev => ({
            ...prev,
            [tokenId]: { ...prev[tokenId], [field]: value },
        }));
    };

    const handleSave = async (tokenId: number) => {
        const draft = drafts[tokenId];
        if (!draft) return;
        await update.mutateAsync({ token_id: tokenId, ...draft });
        setSavedId(tokenId);
        setTimeout(() => setSavedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400">
                <span className="material-symbols-outlined animate-spin !text-[32px]">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t.admin.badgeLoreTitle}
                </h1>
                <p className="text-sm text-slate-500 mt-1">{t.admin.badgeLoreSubtitle}</p>
            </div>

            {TOKEN_LIST.map((token) => {
                const tokenId = Number(token.id);
                const draft = drafts[tokenId] ?? {};
                const isSaving = update.isPending;
                const isSaved = savedId === tokenId;

                return (
                    <div
                        key={tokenId}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Card header */}
                        <div
                            className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800"
                            style={{ borderLeftWidth: 4, borderLeftColor: token.glowColor }}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900 dark:text-white text-sm">#{tokenId}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{token.zh}</span>
                                    <span className="text-slate-400 text-sm">/ {token.name}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                    {t.admin.badgeLorePrivilege}: {token.privilege} · {token.privilegeEn}
                                </p>
                            </div>

                            <button
                                onClick={() => handleSave(tokenId)}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-60 min-w-[90px] justify-center"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>
                                        {t.admin.badgeLoreSaving}
                                    </>
                                ) : isSaved ? (
                                    <>
                                        <span className="material-symbols-outlined !text-[16px]">check</span>
                                        {t.admin.badgeLoreSaved}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined !text-[16px]">save</span>
                                        {t.admin.badgeLoreSave}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <p className="lg:col-span-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                                {t.admin.badgeLoreDescription}
                            </p>
                            {/* Chinese */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">
                                    {t.admin.badgeLoreZh}
                                </label>
                                <textarea
                                    rows={4}
                                    value={draft.origin_zh ?? ''}
                                    onChange={e => setField(tokenId, 'origin_zh', e.target.value)}
                                    placeholder="NFT 简介（中文）"
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                                />
                            </div>
                            {/* English */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">
                                    {t.admin.badgeLoreEn}
                                </label>
                                <textarea
                                    rows={4}
                                    value={draft.origin_en ?? ''}
                                    onChange={e => setField(tokenId, 'origin_en', e.target.value)}
                                    placeholder="NFT description (English)"
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
