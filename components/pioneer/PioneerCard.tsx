'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

export default function PioneerCard() {
    const t = useT();
    const [code, setCode] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!code.trim()) return;
        setSubmitted(true);
        // TODO: hook into actual pioneer claim logic
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <div className="relative group">
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />

            <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                {/* 标题行 */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined !text-[28px] text-primary">explore</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.pioneer.title}</h3>
                </div>

                <p className="text-sm text-slate-500 mb-5 pl-16">
                    Join as a pioneer to earn VCP rewards and help shape the protocol.
                </p>

                {/* 输入行 — 满幅 */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined !text-[18px] text-slate-400">vpn_key</span>
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder={t.pioneer.enterCode}
                            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-colors transition-transform"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitted || !code.trim()}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-blue-600 transition-colors transition-transform disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {submitted ? (
                            <span className="material-symbols-outlined animate-spin !text-[18px]">progress_activity</span>
                        ) : (
                            <>
                                {t.pioneer.claimVCP}
                                <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
