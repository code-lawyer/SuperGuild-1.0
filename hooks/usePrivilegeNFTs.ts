import { useAccount, useReadContracts } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// Super Guild 特权 NFT (ERC-1155) 的合约地址
const PRIVILEGE_NFT_CONTRACT = process.env.NEXT_PUBLIC_PRIVILEGE_NFT_CONTRACT as `0x${string}`;

// 当前 Token ID 映射：1=拓世者纪念章, 2=提灯人枯盏, 3=初火
const PIONEER_ID = BigInt(1);
const LANTERN_ID = BigInt(2);
const FLAME_ID = BigInt(3);

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

export function usePrivilegeNFTs() {
    const { address } = useAccount();

    const { data, isLoading, isError, refetch } = useReadContracts({
        contracts: address && PRIVILEGE_NFT_CONTRACT ? [
            {
                address: PRIVILEGE_NFT_CONTRACT,
                abi: erc1155Abi,
                functionName: 'balanceOfBatch',
                chainId: sepolia.id, // NFT 部署在 Ethereum Sepolia 上
                args: [
                    [address, address, address],
                    [PIONEER_ID, FLAME_ID, LANTERN_ID],
                ],
            }
        ] : [],
    });

    // ── DEBUG: 浏览器 F12 控制台可查看 ──
    console.log('[BadgeNFT] address:', address);
    console.log('[BadgeNFT] contract:', PRIVILEGE_NFT_CONTRACT);
    console.log('[BadgeNFT] chainId:', sepolia.id);
    console.log('[BadgeNFT] raw data:', JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));
    console.log('[BadgeNFT] data[0] full:', data?.[0]);
    console.log('[BadgeNFT] data[0].status:', data?.[0]?.status);
    console.log('[BadgeNFT] data[0].error:', data?.[0]?.error);
    console.log('[BadgeNFT] isLoading:', isLoading, 'isError:', isError);

    // 解析返回结果
    const balances = data?.[0]?.result as readonly bigint[] | undefined;

    console.log('[BadgeNFT] balances:', balances);

    const hasPioneer = balances ? balances[0] > BigInt(0) : false;
    const hasFlame = balances ? balances[1] > BigInt(0) : false;
    const hasLantern = balances ? balances[2] > BigInt(0) : false;

    console.log('[BadgeNFT] hasPioneer:', hasPioneer, 'hasFlame:', hasFlame, 'hasLantern:', hasLantern);

    return {
        hasPioneer,
        hasFlame,
        hasLantern,
        balances: balances ? balances.map(b => Number(b)) : [0, 0, 0],
        isLoading,
        isError,
        refetch
    };
}
