'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    created_at: string;
}

export default function AdminBulletinsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('公告');
    const [isPinned, setIsPinned] = useState(false);

    const supabase = createClient();

    // Fetch announcements
    const fetchAnnouncements = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAnnouncements(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [supabase]);

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

        if (currentEditId) {
            // Update
            await supabase
                .from('announcements')
                .update({ title, content, category, is_pinned: isPinned })
                .eq('id', currentEditId);
        } else {
            // Insert
            await supabase
                .from('announcements')
                .insert([{ title, content, category, is_pinned: isPinned }]);
        }

        setIsEditing(false);
        fetchAnnouncements();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        await supabase.from('announcements').delete().eq('id', id);
        fetchAnnouncements();
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currentEditId ? 'Edit Announcement' : 'Create Announcement'}
                    </h1>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Announcement Title"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="公告">公告 (Announcement)</option>
                                <option value="更新">更新 (Update)</option>
                                <option value="活动">活动 (Event)</option>
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
                                Pin to top
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Content (Markdown supported)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                            placeholder="Write your announcement content here..."
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white px-8">
                            Save Announcement
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bulletin Board</h1>
                <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Create New
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl opacity-50">inbox</span>
                        No announcements found. Create one above!
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {announcements.map((announcement) => (
                            <li key={announcement.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    {announcement.is_pinned ? (
                                        <span className="material-symbols-outlined text-primary" title="Pinned">push_pin</span>
                                    ) : (
                                        <span className="w-6" /> // spacer
                                    )}
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                                                {announcement.category}
                                            </span>
                                            {announcement.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {format(new Date(announcement.created_at), 'PPP', { locale: zhCN })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(announcement.id)}>
                                        Delete
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
