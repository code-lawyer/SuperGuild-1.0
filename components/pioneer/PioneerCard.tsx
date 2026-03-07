'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { useAccount, useSignMessage } from 'wagmi';

interface PioneerStatus {
    isPioneer: boolean;
    code?: string;
    claimedAt?: string;
    txHash?: string;
    remainingSlots?: number;
}

export default function PioneerCard() {
    const t = useT();
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const [code, setCode] = useState('');
    const [status, setStatus] = useState<PioneerStatus | null>(null);
    const [phase, setPhase] = useState<'idle' | 'signing' | 'claiming' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Check pioneer status on mount / address change
    useEffect(() => {
        if (!address) { setStatus(null); return; }
        fetch(`/api/pioneer/status?address=${address}`)
            .then(res => res.json())
            .then(data => setStatus(data))
            .catch(() => setStatus(null));
    }, [address]);

    const handleClaim = async () => {
        if (!address || !code.trim()) return;

        setPhase('signing');
        setErrorMsg('');

        try {
            const message = `I am claiming Pioneer code ${code.trim().toUpperCase()} for address ${address}`;
            let signature: string;
            try {
                signature = await signMessageAsync({ message });
            } catch {
                setPhase('error');
                setErrorMsg(t.pioneer.signFailed);
                return;
            }

            setPhase('claiming');

            const res = await fetch('/api/pioneer/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim().toUpperCase(), address, signature }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPhase('error');
                const errorMap: Record<string, string> = {
                    already_claimed: t.pioneer.alreadyClaimed,
                    invalid_code: t.pioneer.invalidCode,
                    code_used: t.pioneer.codeUsed,
                };
                setErrorMsg(errorMap[data.error] || t.pioneer.claimFailed);
                return;
            }

            setPhase('success');
            setCode('');
            // Refresh status
            setStatus({ isPioneer: true, code: code.trim().toUpperCase(), claimedAt: new Date().toISOString(), txHash: data.txHash });
        } catch {
            setPhase('error');
            setErrorMsg(t.pioneer.claimFailed);
        }
    };

    // Already claimed — show status
    if (status?.isPioneer) {
        return (
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
                <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined !text-[28px] text-emerald-500">verified</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.pioneer.title}</h3>
                            <p className="text-sm text-emerald-500 font-medium">
                                {t.pioneer.yourCode.replace('{code}', status.code || '—')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono pl-16">
                        {status.claimedAt && (
                            <span>{t.pioneer.claimedAt.replace('{date}', new Date(status.claimedAt).toLocaleDateString())}</span>
                        )}
                        {status.txHash && (
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${status.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                TX ↗
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const isSubmitting = phase === 'signing' || phase === 'claiming';

    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            <div className="relative bg-white dark:bg-surface-dark rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined !text-[28px] text-primary">explore</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.pioneer.title}</h3>
                </div>

                <p className="text-sm text-slate-500 mb-5 pl-16">
                    {t.pioneer.subtitle}
                </p>

                {/* Remaining slots */}
                {status && !status.isPioneer && (
                    <p className="text-xs text-slate-400 mb-4 pl-16 font-mono">
                        {status.remainingSlots && status.remainingSlots > 0
                            ? t.pioneer.remainingSlots.replace('{count}', String(status.remainingSlots))
                            : t.pioneer.noSlots
                        }
                    </p>
                )}

                {/* Input row */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined !text-[18px] text-slate-400">vpn_key</span>
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder={t.pioneer.enterCode}
                            disabled={!isConnected || isSubmitting}
                            className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-colors disabled:opacity-50"
                        />
                    </div>
                    <button
                        onClick={handleClaim}
                        disabled={!isConnected || isSubmitting || !code.trim()}
                        title={!isConnected ? t.pioneer.connectFirst : undefined}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin !text-[18px]">progress_activity</span>
                                {phase === 'signing' ? t.pioneer.signing : t.pioneer.claiming}
                            </>
                        ) : (
                            <>
                                {t.pioneer.claimVCP}
                                <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Success */}
                {phase === 'success' && (
                    <p className="mt-3 text-sm text-emerald-500 font-medium pl-16 flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[16px]">check_circle</span>
                        {t.pioneer.claimSuccess}
                    </p>
                )}

                {/* Error */}
                {phase === 'error' && errorMsg && (
                    <p className="mt-3 text-sm text-red-500 font-medium pl-16 flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[16px]">error</span>
                        {errorMsg}
                    </p>
                )}
            </div>
        </div>
    );
}
