'use client';

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { useMyNotifications, useMarkAllRead, type Notification } from '@/hooks/useNotifications';

interface Props {
    open: boolean;
    onClose: () => void;
}

const tabKeys = ['all', 'financial', 'project', 'reputation'] as const;

export default function NotificationDrawer({ open, onClose }: Props) {
    const t = useT();
    const [activeTab, setActiveTab] = useState<string>('all');
    const overlayRef = useRef<HTMLDivElement>(null);
    const { data: notifications, isLoading } = useMyNotifications();
    const markAllRead = useMarkAllRead();

    // Group by date
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
            {/* Overlay */}
            <div ref={overlayRef} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-surface-dark border-l border-border-light dark:border-border-dark shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.notifications.title}</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => markAllRead.mutate()}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                {t.notifications.markAllRead}
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined !text-[20px]">close</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">{t.notifications.subtitle}</p>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        {tabKeys.map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeTab === key
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white'
                                    }`}
                            >
                                {key === 'all' ? t.common.all : (t.notifications as any)[key]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined !text-[48px] mb-4">notifications_off</span>
                            <p className="text-sm">{t.notifications.noNotifications}</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([label, notifs]) => (
                            <div key={label} className="mb-6">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</h3>
                                <div className="space-y-3">
                                    {notifs.map(n => (
                                        <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined !text-[20px] text-primary">
                                                    {n.type === 'PAYMENT_RECEIVED' ? 'payments' :
                                                        n.type === 'MILESTONE_REACHED' ? 'flag' :
                                                            n.type === 'ACCEPT_APPROVED' ? 'check_circle' :
                                                                'notifications'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!n.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <button className="w-full py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors border border-border-light dark:border-border-dark rounded-xl hover:border-primary/30">
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
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
