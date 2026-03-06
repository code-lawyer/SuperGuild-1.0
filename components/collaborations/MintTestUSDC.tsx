'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { MOCK_USDC } from '@/constants/nft-config';
import { useUSDCBalance } from '@/hooks/useGuildEscrow';
import { useT } from '@/lib/i18n';
import { formatUnits } from 'viem';

const mintAbi = [
    {
        name: 'mint',
        type: 'function' as const,
        inputs: [
            { name: 'to', type: 'address' as const },
            { name: 'amount', type: 'uint256' as const },
        ],
        outputs: [],
        stateMutability: 'nonpayable' as const,
    },
] as const;

export default function MintTestUSDC() {
    const t = useT();
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const { data: balance, refetch } = useUSDCBalance();
    const [minting, setMinting] = useState(false);

    if (!address) return null;

    const formattedBalance = balance ? formatUnits(balance as bigint, 6) : '0';

    const handleMint = async () => {
        try {
            setMinting(true);
            const hash = await writeContractAsync({
                address: MOCK_USDC.address,
                abi: mintAbi,
                functionName: 'mint',
                args: [address, parseUnits('10000', 6)],
                chainId: MOCK_USDC.chainId,
            });
            await publicClient!.waitForTransactionReceipt({ hash });
            refetch();
        } catch (e) {
            console.error('Mint failed:', e);
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-[#6A6A71] font-mono">
                {t.quests.budget}: {Number(formattedBalance).toLocaleString()} USDC
            </span>
            <button
                onClick={handleMint}
                disabled={minting}
                className="text-[11px] font-bold text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
                {minting ? (
                    <span className="material-symbols-outlined !text-[14px] animate-spin">progress_activity</span>
                ) : (
                    <span className="material-symbols-outlined !text-[14px]">add_circle</span>
                )}
                Mint 10,000 USDC (Testnet)
            </button>
        </div>
    );
}
