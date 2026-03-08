'use client';

import { useEffect, useState } from 'react';
import { useT, useI18n } from '@/lib/i18n';
import { supabase } from '@/utils/supabase/client';

interface PioneerCode {
    code: string;
    claimed_by: string | null;
    claimed_at: string | null;
    tx_hash: string | null;
}

type FilterTab = 'all' | 'used' | 'available';

export default function AdminPioneerPage() {
    const t = useT();
    const { locale } = useI18n();
    const [codes, setCodes] = useState<PioneerCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>('all');

    useEffect(() => {
        async function fetchCodes() {
            try {
                const { data, error } = await supabase
                    .from('pioneer_codes')
                    .select('code, claimed_by, claimed_at, tx_hash')
                    .order('claimed_at', { ascending: false, nullsFirst: false });

                if (!error && data) {
                    setCodes(data);
                }
            } catch (e) {
                console.error('Failed to fetch pioneer codes:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchCodes();
    }, []);

    const totalCodes = codes.length;
    const claimedCodes = codes.filter((c) => c.claimed_by);
    const availableCodes = codes.filter((c) => !c.claimed_by);
    const vcpDistributed = claimedCodes.length * 100;

    const filteredCodes =
        filter === 'used'
            ? claimedCodes
            : filter === 'available'
              ? availableCodes
              : codes;

    const explorerBase = 'https://sepolia.arbiscan.io';

    const truncateAddr = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filterTabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: t.admin.pioneerFilterAll, count: totalCodes },
        { key: 'used', label: t.admin.pioneerFilterUsed, count: claimedCodes.length },
        { key: 'available', label: t.admin.pioneerFilterAvailable, count: availableCodes.length },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t.admin.pioneerTitle}
                </h1>
                <p className="text-slate-500 mt-1">{t.admin.pioneerSubtitle}</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: t.admin.pioneerTotal, value: totalCodes, icon: 'confirmation_number', color: 'text-blue-500' },
                    { label: t.admin.pioneerClaimed, value: claimedCodes.length, icon: 'check_circle', color: 'text-emerald-500' },
                    { label: t.admin.pioneerAvailable, value: availableCodes.length, icon: 'pending', color: 'text-amber-500' },
                    { label: t.admin.pioneerVcpDistributed, value: vcpDistributed, icon: 'token', color: 'text-violet-500' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className={`material-symbols-outlined text-[56px] ${stat.color}`}>{stat.icon}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</h3>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{loading ? '—' : stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs + table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                                filter === tab.key
                                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-5 py-3">{t.admin.pioneerCodeCol}</th>
                                    <th className="px-5 py-3">{t.admin.pioneerStatusCol}</th>
                                    <th className="px-5 py-3">{t.admin.pioneerClaimedBy}</th>
                                    <th className="px-5 py-3">{t.admin.pioneerClaimedAt}</th>
                                    <th className="px-5 py-3">{t.admin.pioneerTxHash}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCodes.map((code) => (
                                    <tr key={code.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                            {code.code}
                                        </td>
                                        <td className="px-5 py-3">
                                            {code.claimed_by ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    {t.admin.pioneerStatusUsed}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                    <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
                                                    {t.admin.pioneerStatusAvailable}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-400 text-xs">
                                            {code.claimed_by ? (
                                                <a
                                                    href={`${explorerBase}/address/${code.claimed_by}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    {truncateAddr(code.claimed_by)}
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 text-xs">
                                            {code.claimed_at ? formatDate(code.claimed_at) : '—'}
                                        </td>
                                        <td className="px-5 py-3 font-mono text-xs">
                                            {code.tx_hash ? (
                                                <a
                                                    href={`${explorerBase}/tx/${code.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {truncateAddr(code.tx_hash)}
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredCodes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                                            {t.common.noData}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
