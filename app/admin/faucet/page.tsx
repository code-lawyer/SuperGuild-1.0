'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { useT } from '@/lib/i18n';
import { MOCK_USDC } from '@/constants/nft-config';
import { useUSDCBalance } from '@/hooks/useGuildEscrow';

const mockUsdcMintAbi = [
    {
        name: 'mint',
        type: 'function' as const,
        stateMutability: 'nonpayable' as const,
        inputs: [
            { name: 'to', type: 'address' as const },
            { name: 'amount', type: 'uint256' as const },
        ],
        outputs: [],
    },
] as const;

export default function AdminFaucetPage() {
    const t = useT();
    const { address } = useAccount();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('1000');
    const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

    const { writeContractAsync, isPending } = useWriteContract();
    const { data: balance } = useUSDCBalance();

    const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } =
        useWaitForTransactionReceipt({ hash: lastTxHash ?? undefined });

    const handleMint = async () => {
        if (!recipient || !amount) return;
        if (!isAddress(recipient)) return;

        try {
            const amountWei = parseUnits(amount, MOCK_USDC.decimals);
            const hash = await writeContractAsync({
                address: MOCK_USDC.address,
                abi: mockUsdcMintAbi,
                functionName: 'mint',
                args: [recipient as `0x${string}`, amountWei],
                chainId: MOCK_USDC.chainId,
            });
            setLastTxHash(hash);
        } catch (err) {
            console.error('Mint failed:', err);
        }
    };

    const fillSelf = () => {
        if (address) setRecipient(address);
    };

    const explorerBase = 'https://sepolia.arbiscan.io';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t.admin.faucetTitle}
                </h1>
                <p className="text-slate-500 mt-1">{t.admin.faucetSubtitle}</p>
            </div>

            {/* Current balance card */}
            {balance !== undefined && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {t.admin.faucetCurrentBalance}
                    </h3>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                        {formatUnits(balance as bigint, MOCK_USDC.decimals)} <span className="text-lg text-slate-400">USDC</span>
                    </div>
                </div>
            )}

            {/* Mint form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                {/* Recipient */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.faucetRecipient}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder={t.admin.faucetRecipientPlaceholder}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                        />
                        <button
                            onClick={fillSelf}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                            {t.admin.faucetFillSelf}
                        </button>
                    </div>
                    {recipient && !isAddress(recipient) && (
                        <p className="text-red-500 text-xs mt-1">{t.admin.faucetInvalidAddress}</p>
                    )}
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.admin.faucetAmount}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={t.admin.faucetAmountPlaceholder}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            min="1"
                        />
                        {/* Quick fill buttons */}
                        {[100, 500, 1000, 5000].map((v) => (
                            <button
                                key={v}
                                onClick={() => setAmount(String(v))}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mint button */}
                <button
                    onClick={handleMint}
                    disabled={isPending || isTxConfirming || !recipient || !amount || !isAddress(recipient)}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isPending || isTxConfirming ? t.admin.faucetMinting : t.admin.faucetMint}
                </button>

                {/* Success */}
                {isTxConfirmed && lastTxHash && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {t.admin.faucetSuccess.replace('{amount}', amount)}
                        </p>
                        <a
                            href={`${explorerBase}/tx/${lastTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-1 inline-block"
                        >
                            {t.admin.faucetViewTx} &rarr;
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
