'use client';

import { useState } from 'react';
import { useSubmitProofMutation } from '@/hooks/useCollaborations';
import { useGuildEscrow } from '@/hooks/useGuildEscrow';
import { useT } from '@/lib/i18n';
import { X, Upload, Loader2, Link2, Hash } from 'lucide-react';

interface UploadProofDialogProps {
    milestoneId: string;
    collabId: string;
    milestoneSortOrder: number;
    isOpen: boolean;
    onClose: () => void;
    /** When true, submit proof hash on-chain via GuildEscrow (guild_managed only) */
    isGuildManaged?: boolean;
}

export default function UploadProofDialog({ milestoneId, collabId, milestoneSortOrder, isOpen, onClose, isGuildManaged = false }: UploadProofDialogProps) {
    const t = useT();
    const [contentUrl, setContentUrl] = useState('');
    const [contentHash, setContentHash] = useState('');
    const submitProof = useSubmitProofMutation();
    const escrow = useGuildEscrow();

    if (!isOpen) return null;

    const generateHash = async () => {
        if (!contentUrl) return;
        const encoder = new TextEncoder();
        const data = encoder.encode(contentUrl + Date.now().toString());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setContentHash(hashHex);
    };

    const handleSubmit = async () => {
        if (!contentUrl || !contentHash) return;
        try {
            // 1. On-chain: submit proof hash (guild_managed only — triggers 7-day window)
            if (isGuildManaged) {
                const contentHashBytes = `0x${contentHash}` as `0x${string}`;
                await escrow.submitProofOnChain(collabId, milestoneSortOrder - 1, contentHashBytes);
            }

            // 2. Supabase: insert proof record + update milestone status
            await submitProof.mutateAsync({
                milestoneId,
                contentUrl,
                contentHash,
            });

            escrow.reset();
            onClose();
            setContentUrl('');
            setContentHash('');
        } catch (e) {
            console.error('[UploadProofDialog] submit failed:', e);
        }
    };

    const isPending = submitProof.isPending || escrow.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ag-card w-full max-w-md mx-4 p-6 space-y-5 relative">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{t.quests.submitDeliverable}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{t.quests.proofOnChainNote}</p>
                </div>

                {/* Content URL */}
                <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
                        <Link2 className="w-3 h-3 inline mr-1" />
                        {t.quests.pasteLinkPlaceholder}
                    </label>
                    <input
                        type="text"
                        value={contentUrl}
                        onChange={(e) => setContentUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors transition-transform font-mono"
                    />
                </div>

                {/* Hash generation */}
                <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
                        <Hash className="w-3 h-3 inline mr-1" />
                        SHA-256
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={contentHash}
                            onChange={(e) => setContentHash(e.target.value)}
                            placeholder="Auto-generate or paste manually"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 font-mono text-[11px]"
                        />
                        <button
                            onClick={generateHash}
                            disabled={!contentUrl}
                            className="ag-btn-secondary px-3 py-2 text-xs shrink-0 disabled:opacity-30"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!contentUrl || !contentHash || isPending}
                    className="ag-btn-primary w-full py-3 text-sm disabled:opacity-50"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {escrow.step === 'submitting' ? t.quests.escrowSubmitting : t.common.loading}
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            {t.quests.submitForReview}
                        </>
                    )}
                </button>

                {escrow.error && (
                    <p className="text-xs text-red-400 text-center">{escrow.error}</p>
                )}
            </div>
        </div>
    );
}
