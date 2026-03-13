'use client';

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { useMyNotifications, useMarkAllRead, type Notification } from '@/hooks/useNotifications';

interface Props {
    open: boolean;
    onClose: () => void;
}

const tabKeys = ['all', 'financial', 'project', 'reputation'] as const;

function getNotifIcon(type: string) {
    switch (type) {
        case 'PAYMENT_RECEIVED': return { icon: 'account_balance_wallet', bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400' };
        case 'MILESTONE_REACHED': return { icon: 'rocket_launch', bg: 'bg-purple-50 dark:bg-purple-950/40', color: 'text-purple-600 dark:text-purple-400' };
        case 'ACCEPT_APPROVED': return { icon: 'check_circle', bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400' };
        case 'BADGE_EARNED': return { icon: 'military_tech', bg: 'bg-amber-50 dark:bg-amber-950/40', color: 'text-amber-600 dark:text-amber-400' };
        case 'PROPOSAL_PASSED': return { icon: 'how_to_vote', bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400' };
        case 'DISPUTE_OPENED': return { icon: 'gavel', bg: 'bg-red-50 dark:bg-red-950/40', color: 'text-red-500 dark:text-red-400' };
        default: return { icon: 'notifications', bg: 'bg-slate-50 dark:bg-slate-800', color: 'text-slate-500 dark:text-slate-400' };
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationDrawer({ open, onClose }: Props) {
    const t = useT();
    const [activeTab, setActiveTab] = useState<string>('all');
    const overlayRef = useRef<HTMLDivElement>(null);
    const { data: notifications, isLoading } = useMyNotifications();
    const markAllRead = useMarkAllRead();

    const items = notifications ?? [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const grouped = items.reduce<Record<string, Notification[]>>((acc, n) => {
        const day = new Date(n.created_at).toDateString();
        const label = day === today ? t.notifications.today : day === yesterday ? t.notifications.yesterday : t.notifications.earlier;
        (acc[label] = acc[label] || []).push(n);
        return acc;
    }, {});

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div ref={overlayRef} className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" onClick={onClose} />

            {/* Glass Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white/90 dark:bg-[#101922]/90 backdrop-blur-xl border-l border-white/50 dark:border-slate-700/40 shadow-2xl flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/60 dark:border-slate-800/60">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.notifications.title}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{t.notifications.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => markAllRead.mutate()}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                            {t.notifications.markAllRead}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-400 transition-colors"
                        >
                            <span className="material-symbols-outlined !text-[20px]">close</span>
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100/60 dark:border-slate-800/60">
                    {tabKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                activeTab === key
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary/40 hover:text-primary'
                            }`}
                        >
                            {key === 'all' ? t.common.all : (t.notifications as Record<string, string>)[key]}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <span className="material-symbols-outlined animate-spin !text-[32px] text-primary">progress_activity</span>
                            <span className="text-xs font-mono uppercase tracking-widest">{t.common.loading}</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined !text-[28px]">notifications_off</span>
                            </div>
                            <p className="text-sm font-semibold">{t.notifications.noNotifications}</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([label, notifs]) => (
                            <div key={label}>
                                {/* Time Group Header */}
                                <div className="px-2 pt-3 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                </div>
                                <div className="space-y-2">
                                    {notifs.map(n => {
                                        const { icon, bg, color } = getNotifIcon(n.type);
                                        return (
                                            <div
                                                key={n.id}
                                                className="group relative bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/60 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                                            >
                                                {/* Unread dot */}
                                                {!n.is_read && (
                                                    <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                                                )}

                                                <div className="flex gap-3.5">
                                                    {/* Icon */}
                                                    <div className={`shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                                                        <span className={`material-symbols-outlined !text-[20px] ${color}`}>{icon}</span>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <h4 className={`text-sm font-bold leading-snug ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                                            {n.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                                                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{timeAgo(n.created_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/20">
                    <button className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-primary transition-colors">
                        {t.notifications.viewSettings}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.28s cubic-bezier(0.23, 1, 0.32, 1);
                }
            `}</style>
        </div>
    );
}
