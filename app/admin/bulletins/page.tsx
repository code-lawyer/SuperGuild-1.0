'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { useT, useI18n } from '@/lib/i18n';
import { useAdminAction } from '@/hooks/useAdminAction';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    created_at: string;
}

export default function AdminBulletinsPage() {
    const t = useT();
    const { locale } = useI18n();
    const dateLocale = locale === 'zh' ? zhCN : enUS;
    const { callAdmin } = useAdminAction();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('公告');
    const [isPinned, setIsPinned] = useState(false);

    // Fetch announcements
    const fetchAnnouncements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bulletins')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAnnouncements(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleEdit = (announcement: Announcement) => {
        setCurrentEditId(announcement.id);
        setTitle(announcement.title);
        setContent(announcement.content);
        setCategory(announcement.category || '公告');
        setIsPinned(announcement.is_pinned || false);
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setCurrentEditId(null);
        setTitle('');
        setContent('');
        setCategory('公告');
        setIsPinned(false);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentEditId(null);
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;

        try {
            const action = currentEditId ? `update-bulletin:${currentEditId}` : 'create-bulletin';
            await callAdmin('/api/admin/bulletins', 'POST', action, {
                id: currentEditId,
                title,
                content,
                category,
                is_pinned: isPinned,
            });
        } catch (err: any) {
            console.error('Admin bulletin save error:', err);
            alert(err.message || 'Failed to save bulletin');
            return;
        }

        setIsEditing(false);
        fetchAnnouncements();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t.admin.bulletinDeleteConfirm)) return;

        try {
            await callAdmin('/api/admin/bulletins', 'DELETE', `delete-bulletin:${id}`, { id });
        } catch (err: any) {
            console.error('Admin bulletin delete error:', err);
            alert(err.message || 'Failed to delete bulletin');
            return;
        }
        fetchAnnouncements();
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currentEditId ? t.admin.bulletinEdit : t.admin.bulletinCreate}
                    </h1>
                    <Button variant="outline" onClick={handleCancel}>{t.common.cancel}</Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.bulletinFormTitle}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder={t.admin.bulletinFormTitlePlaceholder}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.bulletinFormCategory}</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="公告">{t.admin.bulletinFormCategoryAnnouncement}</option>
                                <option value="更新">{t.admin.bulletinFormCategoryUpdate}</option>
                                <option value="活动">{t.admin.bulletinFormCategoryEvent}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 pt-8">
                            <input
                                type="checkbox"
                                id="isPinned"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="w-5 h-5 rounded text-primary focus:ring-primary"
                            />
                            <label htmlFor="isPinned" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                {t.admin.bulletinFormPinTop}
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.bulletinFormContent}</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                            placeholder={t.admin.bulletinFormContentPlaceholder}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white px-8">
                            {t.admin.bulletinSave}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.admin.bulletinTitle}</h1>
                <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t.admin.bulletinCreate}
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t.admin.bulletinLoading}</div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl opacity-50">inbox</span>
                        {t.admin.bulletinEmpty}
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {announcements.map((announcement) => (
                            <li key={announcement.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    {announcement.is_pinned ? (
                                        <span className="material-symbols-outlined text-primary" title={t.admin.bulletinPinned}>push_pin</span>
                                    ) : (
                                        <span className="w-6" />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                                                {announcement.category}
                                            </span>
                                            {announcement.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {format(new Date(announcement.created_at), 'PPP', { locale: dateLocale })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                                        {t.common.edit}
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(announcement.id)}>
                                        {t.common.delete}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
