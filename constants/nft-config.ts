/**
 * ═══ Super Guild NFT / Token 合约配置 ═══
 *
 * 所有链上合约地址和 Token ID 的唯一真相来源。
 * 请勿在其他文件中硬编码合约地址或 Token ID。
 */

// ── 特权 NFT (Manifold ERC-1155, Sepolia ETH) ──
export const PRIVILEGE_NFT = {
  address: (process.env.NEXT_PUBLIC_PRIVILEGE_NFT_CONTRACT ||
    '0x46486Aa0aCC327Ac55b6402AdF4A31598987C400') as `0x${string}`,
  chainId: 11155111, // Sepolia ETH

  tokens: {
    PIONEER_MEMORIAL: { id: BigInt(1), name: 'Pioneer Memorial', zh: '拓世者纪念章' },
    LANTERN_KEEPER: { id: BigInt(2), name: "Lantern Keeper's Withered Lamp", zh: '提灯人枯盏' },
    FIRST_FLAME: { id: BigInt(3), name: 'The First Flame', zh: '初火' },
    HAND_OF_JUSTICE: { id: BigInt(4), name: 'Hand of Justice', zh: '公义之手' },
    BEACON: { id: BigInt(5), name: 'Beacon of the Forerunner', zh: '先驱者灯塔' },
  },
} as const;

// ── VCP 信誉积分 (改良 ERC-20, Arbitrum Sepolia) ──
export const VCP_TOKEN = {
  address: '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C' as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
} as const;

// ── 勋章 NFT (ERC-721 + ERC-7496 Dynamic Traits, Arbitrum Sepolia) ──
export const MEDAL_NFT = {
  address: '0xef96bE9fFf59B5653085C11583beaC0D16450F1a' as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
} as const;

// ── SparkGovernor 治理合约 (Arbitrum Sepolia) ──
// TODO: 部署合约后填入地址
export const SPARK_GOVERNOR = {
  address: (process.env.NEXT_PUBLIC_SPARK_GOVERNOR || '') as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
} as const;

// ── MockUSDC 测试币 (Arbitrum Sepolia) ──
// TODO: 部署合约后填入地址
export const MOCK_USDC = {
  address: (process.env.NEXT_PUBLIC_MOCK_USDC || '') as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
  decimals: 6,
} as const;
