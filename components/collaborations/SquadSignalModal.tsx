'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useCreateSquadSignal, type SquadRole } from '@/hooks/useBulletins';
import { toast } from '@/components/ui/use-toast';

interface Props {
    collabId: string;
    collabTitle: string;
    onClose: () => void;
}

export function SquadSignalModal({ collabId, collabTitle, onClose }: Props) {
    const t = useT();
    const createSignal = useCreateSquadSignal();

    const [description, setDescription] = useState('');
    const [roles, setRoles] = useState<SquadRole[]>([
        { title: '', tags: [], budget: 0, slots: 1 }
    ]);
    const [tagInputs, setTagInputs] = useState<string[]>(['']);

    const addRole = () => {
        setRoles([...roles, { title: '', tags: [], budget: 0, slots: 1 }]);
        setTagInputs([...tagInputs, '']);
    };

    const removeRole = (i: number) => {
        if (roles.length <= 1) return;
        setRoles(roles.filter((_, idx) => idx !== i));
        setTagInputs(tagInputs.filter((_, idx) => idx !== i));
    };

    const updateRole = (i: number, field: keyof SquadRole, val: unknown) => {
        const updated = [...roles];
        (updated[i] as unknown as Record<string, unknown>)[field] = val;
        setRoles(updated);
    };

    const addRoleTag = (i: number, raw: string) => {
        const tag = raw.trim().toLowerCase().slice(0, 20);
        if (tag && !roles[i].tags.includes(tag) && roles[i].tags.length < 5) {
            updateRole(i, 'tags', [...roles[i].tags, tag]);
        }
        const newInputs = [...tagInputs];
        newInputs[i] = '';
        setTagInputs(newInputs);
    };

    const removeRoleTag = (roleIdx: number, tag: string) => {
        updateRole(roleIdx, 'tags', roles[roleIdx].tags.filter(t => t !== tag));
    };

    const isValid = description.trim().length > 0 && roles.every(r => r.title.trim() && r.budget > 0);

    const handleSubmit = async () => {
        if (!isValid) return;
        try {
            await createSignal.mutateAsync({
                parentCollabId: collabId,
                parentCollabTitle: collabTitle,
                description: description.trim(),
                roles,
            });
            toast({ title: t.quests.squadSignalSuccess });
            onClose();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : undefined;
            toast({ title: t.quests.squadSignalError, description: msg, variant: 'destructive' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">{t.quests.squadSignal}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Source task */}
                    <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                        <p className="text-[11px] font-bold text-primary/60 uppercase tracking-wider">{t.quests.squadSourceTask}</p>
                        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{collabTitle}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            {t.quests.squadDescription} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={t.quests.squadDescPlaceholder}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Roles */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.quests.squadRoles}</label>
                            <button onClick={addRole} className="text-[12px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined !text-[14px]">add</span>
                                {t.quests.addRole}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {roles.map((role, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
                                        {roles.length > 1 && (
                                            <button onClick={() => removeRole(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined !text-[16px]">remove_circle</span>
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={role.title}
                                        onChange={e => updateRole(i, 'title', e.target.value)}
                                        placeholder={t.quests.roleTitle}
                                        className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-primary"
                                    />
                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1.5 items-center min-h-[36px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
                                        {role.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                                {tag}
                                                <button type="button" onClick={() => removeRoleTag(i, tag)} className="hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined !text-[11px]">close</span>
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInputs[i] || ''}
                                            onChange={e => { const ni = [...tagInputs]; ni[i] = e.target.value; setTagInputs(ni); }}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addRoleTag(i, tagInputs[i] || ''); } }}
                                            placeholder={t.quests.roleTags}
                                            className="flex-1 min-w-[80px] bg-transparent text-[12px] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
                                        />
                                    </div>
                                    {/* Budget + Slots */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                value={role.budget || ''}
                                                onChange={e => updateRole(i, 'budget', Number(e.target.value))}
                                                placeholder="300"
                                                min="0"
                                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 pr-14 text-[13px] text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-primary tabular-nums"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">USDC</span>
                                        </div>
                                        <div className="w-20">
                                            <input
                                                type="number"
                                                value={role.slots}
                                                onChange={e => updateRole(i, 'slots', Math.max(1, parseInt(e.target.value) || 1))}
                                                min="1"
                                                max="10"
                                                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-[13px] text-center text-slate-900 dark:text-white focus:outline-none focus:border-primary tabular-nums"
                                            />
                                            <p className="text-[10px] text-slate-400 text-center mt-1">{t.quests.roleSlots}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || createSignal.isPending}
                        className="w-full py-3.5 bg-primary text-white font-bold text-[14px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
                    >
                        {createSignal.isPending
                            ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>{t.quests.creating}</>
                            : <><span className="material-symbols-outlined !text-[16px]">group_add</span>{t.quests.publishSquadSignal}</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
