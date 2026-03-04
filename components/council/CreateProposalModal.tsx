'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateProposal } from '@/hooks/useProposals';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateProposalModal({ isOpen, onClose }: CreateProposalModalProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

    const { mutateAsync: create, isPending } = useCreateProposal();

    const addLink = () => {
        const trimmed = linkInput.trim();
        if (trimmed && !attachmentUrls.includes(trimmed)) {
            setAttachmentUrls([...attachmentUrls, trimmed]);
            setLinkInput('');
        }
    };

    const removeLink = (index: number) => {
        setAttachmentUrls(attachmentUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !body.trim()) return;
        await create({ title: title.trim(), body: body.trim(), attachmentUrls });
        setTitle('');
        setBody('');
        setAttachmentUrls([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">发起提案</h2>
                                <p className="text-sm text-slate-500 mt-1">需支付 1 USDC（含 Gas 费）</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-8 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    提案标题 *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="简洁描述提案目标..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-colors transition-transform"
                                    maxLength={120}
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/120</p>
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    提案正文 *
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="详细说明提案内容、背景、预期影响..."
                                    rows={8}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-colors transition-transform resize-none"
                                />
                            </div>

                            {/* Attachments */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    附件 / 补充链接（可选）
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                        placeholder="https://..."
                                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-colors transition-transform"
                                    />
                                    <button
                                        onClick={addLink}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        添加
                                    </button>
                                </div>
                                {attachmentUrls.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        {attachmentUrls.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm"
                                            >
                                                <span className="material-symbols-outlined !text-[16px] text-slate-400">link</span>
                                                <span className="flex-1 text-slate-600 dark:text-slate-300 truncate">{url}</span>
                                                <button
                                                    onClick={() => removeLink(idx)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="material-symbols-outlined !text-[16px]">info</span>
                                <span>提案将在链上创建，需要两步签名</span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isPending || !title.trim() || !body.trim()}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-colors transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-orange-500/20 flex items-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>
                                            处理中...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined !text-[16px]">bolt</span>
                                            提交提案 (1 USDC)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
