'use client';

import { useState, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { supabase } from '@/utils/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface PioneerPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    authorAddress: string;
}

export default function PioneerPostModal({ isOpen, onClose, authorAddress }: PioneerPostModalProps) {
    const t = useT();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError(t.bulletin.errorTooLarge);
                setFile(null);
            } else {
                setError(null);
                setFile(selectedFile);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Insert Bulletin
            const { data: bulletin, error: bError } = await supabase
                .from('bulletins')
                .insert({
                    title: title.trim(),
                    content: content.trim(),
                    category: 'pioneer',
                    author: authorAddress,
                    is_pinned: false
                })
                .select()
                .single();

            if (bError) throw bError;

            // 2. Upload Attachment if exists
            if (file && bulletin) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${bulletin.id}/${Math.random()}.${fileExt}`;
                const filePath = `bulletin-attachments/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('attachments') // Assuming 'attachments' bucket
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('attachments')
                    .getPublicUrl(filePath);

                // 3. Insert Attachment Record
                const { error: aError } = await supabase
                    .from('bulletin_attachments')
                    .insert({
                        bulletin_id: bulletin.id,
                        file_name: file.name,
                        file_url: publicUrl,
                        file_size: file.size,
                        mime_type: file.type
                    });

                if (aError) throw aError;
            }

            // Success
            queryClient.invalidateQueries({ queryKey: ['bulletins'] });
            onClose();
            // Reset form
            setTitle('');
            setContent('');
            setFile(null);
        } catch (err: any) {
            console.error('Error posting bulletin:', err);
            setError(err.message || 'Failed to post announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-[#0a0f18] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined !text-[28px]">campaign</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.bulletin.modalTitle}</h2>
                                    <p className="text-sm text-slate-500">{t.bulletin.pioneerSubtitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined !text-[20px] text-slate-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    {t.bulletin.titleLabel}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Announcement Title"
                                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        {t.bulletin.contentLabel}
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter">MARKDOWN SUPPORTED</span>
                                </div>
                                <textarea
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t.bulletin.contentPlaceholder}
                                    rows={8}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all text-sm font-medium resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {t.bulletin.attachmentLabel}
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group cursor-pointer flex items-center gap-3 px-5 py-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-primary/50 transition-all"
                                >
                                    <span className="material-symbols-outlined !text-[22px] text-slate-400 group-hover:text-primary transition-colors">
                                        {file ? 'description' : 'upload_file'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {file ? file.name : 'Select a file'}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, Image, Doc up to 10MB'}
                                        </p>
                                    </div>
                                    {file && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="p-1 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">close</span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-red-500 text-center animate-shake">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !content.trim()}
                                    className="flex-[2] py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin !text-[20px]">progress_activity</span>
                                            {t.bulletin.uploading}
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined !text-[20px]">send</span>
                                            {t.bulletin.submit}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
