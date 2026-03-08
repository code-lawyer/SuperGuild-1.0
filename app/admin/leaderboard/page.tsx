'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { supabase } from '@/utils/supabase/client';

interface LeaderboardEntry {
    wallet_address: string;
    username: string | null;
    vcp_cache: number;
}

export default function AdminLeaderboardPage() {
    const t = useT();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('wallet_address, username, vcp_cache')
                    .gt('vcp_cache', 0)
                    .order('vcp_cache', { ascending: false })
                    .limit(100);

                if (!error && data) {
                    setEntries(data);
                }
            } catch (e) {
                console.error('Failed to fetch leaderboard:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    const truncateAddr = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const explorerBase = 'https://sepolia.arbiscan.io';

    const threshold = entries.length > 0 ? entries[entries.length - 1].vcp_cache : 0;
    const totalVcp = entries.reduce((sum, e) => sum + e.vcp_cache, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t.admin.leaderboardTitle}
                </h1>
                <p className="text-slate-500 mt-1">{t.admin.leaderboardSubtitle}</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[56px] text-amber-500">leaderboard</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.admin.leaderboardHolders}</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '—' : entries.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[56px] text-violet-500">token</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.admin.leaderboardTotalVcp}</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '—' : totalVcp.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-[56px] text-cyan-500">vertical_align_bottom</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.admin.leaderboardThreshold}</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '—' : threshold}</div>
                </div>
            </div>

            {/* Leaderboard table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">{t.admin.leaderboardEmpty}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-5 py-3 w-16">{t.admin.leaderboardRank}</th>
                                    <th className="px-5 py-3">{t.admin.leaderboardAddress}</th>
                                    <th className="px-5 py-3">{t.admin.leaderboardUsername}</th>
                                    <th className="px-5 py-3 text-right">{t.admin.leaderboardVcp}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {entries.map((entry, idx) => {
                                    const rank = idx + 1;
                                    const isTop3 = rank <= 3;
                                    const medalColor =
                                        rank === 1 ? 'text-amber-500' :
                                        rank === 2 ? 'text-slate-400' :
                                        rank === 3 ? 'text-amber-700' : '';

                                    return (
                                        <tr
                                            key={entry.wallet_address}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-5 py-3">
                                                {isTop3 ? (
                                                    <span className={`material-symbols-outlined text-[20px] ${medalColor}`}>
                                                        emoji_events
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-mono text-xs">{rank}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs">
                                                <a
                                                    href={`${explorerBase}/address/${entry.wallet_address}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                                                >
                                                    {truncateAddr(entry.wallet_address)}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                                {entry.username || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {entry.vcp_cache.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
