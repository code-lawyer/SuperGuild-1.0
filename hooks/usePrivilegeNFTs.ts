import { useAccount, useReadContracts } from 'wagmi';
import { PRIVILEGE_NFT } from '@/constants/nft-config';
import { IS_MAINNET } from '@/constants/chain-config';

const { address: CONTRACT, chainId, tokens } = PRIVILEGE_NFT;

/**
 * Dev/testnet fallback: when RPC is unreliable, set NEXT_PUBLIC_DEV_MOCK_NFTS=true
 * in .env.local to force all badges as owned. NEVER enable on mainnet.
 */
const DEV_MOCK_NFTS = !IS_MAINNET && process.env.NEXT_PUBLIC_DEV_MOCK_NFTS === 'true';

const erc1155Abi = [
    {
        type: 'function',
        name: 'balanceOfBatch',
        inputs: [
            { name: 'accounts', type: 'address[]' },
            { name: 'ids', type: 'uint256[]' },
        ],
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
    },
] as const;

// Token 列表按 ID 排序，顺序与 balanceOfBatch 返回值对应
const TOKEN_LIST = Object.values(tokens).sort((a, b) =>
    Number(a.id) - Number(b.id)
);

/**
 * 批量查询所有特权 NFT 的持有状态。
 * 顺序与 nft-config.ts 中 tokens 的 ID 顺序一致（#1 → #5）。
 * 新增 NFT 只需在 nft-config.ts 中添加配置，此 hook 自动扩展。
 */
export function usePrivilegeNFTs() {
    const { address } = useAccount();

    const { data, isLoading, isError, refetch } = useReadContracts({
        contracts: address && CONTRACT ? [
            {
                address: CONTRACT,
                abi: erc1155Abi,
                functionName: 'balanceOfBatch',
                chainId,
                args: [
                    TOKEN_LIST.map(() => address),
                    TOKEN_LIST.map(t => t.id),
                ],
            }
        ] : [],
    });

    const balances = data?.[0]?.result as readonly bigint[] | undefined;
    const balanceNums = DEV_MOCK_NFTS
        ? TOKEN_LIST.map(() => 1)  // Dev fallback: pretend all badges are owned
        : balances
            ? TOKEN_LIST.map((_, i) => Number(balances[i] ?? BigInt(0)))
            : TOKEN_LIST.map(() => 0);

    // 按 Token ID 顺序解构（#1 #2 #3 #4 #5）
    const [hasPioneer, hasLantern, hasFlame, hasJustice, hasBeacon] =
        balanceNums.map(b => b > 0);

    return {
        // 具名布尔值（向后兼容现有门控 hook）
        hasPioneer,
        hasLantern,
        hasFlame,
        hasJustice,
        hasBeacon,
        // 原始数值数组，顺序与 TOKEN_LIST 一致
        balances: balanceNums,
        isLoading: DEV_MOCK_NFTS ? false : isLoading,
        isError: DEV_MOCK_NFTS ? false : isError,
        refetch,
    };
}
