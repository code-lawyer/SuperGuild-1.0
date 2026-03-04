'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
export default function AdminDashboard() {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch total profiles (users)
                const { count, error } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                if (!error && count !== null) {
                    setTotalUsers(count);
                }
            } catch (e) {
                console.error('Failed to fetch stats:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [supabase]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card: Total Users */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[80px] text-primary">group</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Users</h3>
                    <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                        {loading ? (
                            <span className="w-16 h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        ) : (
                            <span>{totalUsers || 0}</span>
                        )}
                    </div>
                </div>

                {/* You can add more stat cards here later (e.g., active bounties, total services) */}

            </div>
        </div>
    );
}
