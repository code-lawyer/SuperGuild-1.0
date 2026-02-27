'use client';

import { useState } from 'react';
import { useSubmitProofMutation } from '@/hooks/useCollaborations';
import { X, Upload, Loader2, Link2, Hash } from 'lucide-react';

interface UploadProofDialogProps {
    milestoneId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadProofDialog({ milestoneId, isOpen, onClose }: UploadProofDialogProps) {
    const [contentUrl, setContentUrl] = useState('');
    const [contentHash, setContentHash] = useState('');
    const submitProof = useSubmitProofMutation();

    if (!isOpen) return null;

    const generateHash = async () => {
        if (!contentUrl) return;
        // Generate SHA-256 hash from the URL content (simplified for MVP)
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
            await submitProof.mutateAsync({
                milestoneId,
                contentUrl,
                contentHash,
            });
            onClose();
            setContentUrl('');
            setContentHash('');
        } catch (e) {
            console.error('提交凭证失败:', e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="ag-card w-full max-w-md mx-4 p-6 space-y-5 relative">
                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div>
                    <h3 className="text-lg font-bold text-white mb-1">提交工作凭证</h3>
                    <p className="text-xs text-zinc-500 font-mono">Upload proof of work for this milestone</p>
                </div>

                {/* Content URL */}
                <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
                        <Link2 className="w-3 h-3 inline mr-1" />
                        凭证链接 / GitHub PR / 文件 URL
                    </label>
                    <input
                        type="text"
                        value={contentUrl}
                        onChange={(e) => setContentUrl(e.target.value)}
                        placeholder="https://github.com/... 或 文件链接"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                    />
                </div>

                {/* Hash generation */}
                <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">
                        <Hash className="w-3 h-3 inline mr-1" />
                        SHA-256 哈希
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={contentHash}
                            onChange={(e) => setContentHash(e.target.value)}
                            placeholder="自动生成或手动输入"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 font-mono text-[11px]"
                        />
                        <button
                            onClick={generateHash}
                            disabled={!contentUrl}
                            className="ag-btn-secondary px-3 py-2 text-xs shrink-0 disabled:opacity-30"
                        >
                            生成
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!contentUrl || !contentHash || submitProof.isPending}
                    className="ag-btn-primary w-full py-3 text-sm disabled:opacity-50"
                >
                    {submitProof.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            提交中...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            提交凭证
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
