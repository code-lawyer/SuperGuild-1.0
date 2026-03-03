import { useAccount, useReadContracts } from 'wagmi';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

const { address: CONTRACT, chainId, tokens } = PRIVILEGE_NFT;

// ERC-1155 balanceOfBatch ABI
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

/**
 * 批量查询所有 5 个特权 NFT 的持有状态。
 * Token 顺序: [Pioneer Memorial, Lantern Keeper, First Flame, Hand of Justice, Beacon]
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
                    [address, address, address, address, address],
                    [
                        tokens.PIONEER_MEMORIAL.id,
                        tokens.LANTERN_KEEPER.id,
                        tokens.FIRST_FLAME.id,
                        tokens.HAND_OF_JUSTICE.id,
                        tokens.BEACON.id,
                    ],
                ],
            }
        ] : [],
    });

    if (process.env.NODE_ENV === 'development') {
        console.debug('[BadgeNFT] balances:', data?.[0]?.result);
    }

    // 解析返回结果
    const balances = data?.[0]?.result as readonly bigint[] | undefined;

    const hasPioneer = balances ? balances[0] > BigInt(0) : false;
    const hasLantern = balances ? balances[1] > BigInt(0) : false;
    const hasFlame = balances ? balances[2] > BigInt(0) : false;
    const hasJustice = balances ? balances[3] > BigInt(0) : false;
    const hasBeacon = balances ? balances[4] > BigInt(0) : false;

    return {
        hasPioneer,
        hasLantern,
        hasFlame,
        hasJustice,
        hasBeacon,
        balances: balances ? balances.map(b => Number(b)) : [0, 0, 0, 0, 0],
        isLoading,
        isError,
        refetch
    };
}
