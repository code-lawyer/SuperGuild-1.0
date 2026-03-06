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
    PIONEER_MEMORIAL: {
      id: BigInt(1),
      name: 'Pioneer Memorial',
      zh: '拓世者纪念章',
      glbPath: '/models/pioneer.glb',
      glowColor: '#3b82f6',
      privilege: 'VCP 获取速度 ×1.05',
      privilegeEn: 'VCP Accumulation Speed ×1.05',
    },
    LANTERN_KEEPER: {
      id: BigInt(2),
      name: "Lantern Keeper's Withered Lamp",
      zh: '提灯人枯盏',
      glbPath: '/models/lantern.glb',
      glowColor: '#eab308',
      privilege: 'DAO 投票权重 ×1.1',
      privilegeEn: 'DAO Vote Weight ×1.1',
    },
    FIRST_FLAME: {
      id: BigInt(3),
      name: 'The First Flame',
      zh: '初火',
      glbPath: '/models/flame.glb',
      glowColor: '#ef4444',
      privilege: 'Admin 准入 + 无限制提案权',
      privilegeEn: 'Admin Access + Unlimited Proposal Rights',
    },
    HAND_OF_JUSTICE: {
      id: BigInt(4),
      name: 'Hand of Justice',
      zh: '公义之手',
      glbPath: '/models/justice.glb',
      glowColor: '#8b5cf6',
      privilege: '仲裁庭准入',
      privilegeEn: 'Arbitration Court Access',
    },
    BEACON: {
      id: BigInt(5),
      name: 'Beacon of the Forerunner',
      zh: '先驱者灯塔',
      glbPath: '/models/beacon.glb',
      glowColor: '#06b6d4',
      privilege: '公告板自由发帖权',
      privilegeEn: 'Bulletin Board Posting Rights',
    },
    // 未来新增 NFT 只需在此追加，BadgeWall 自动渲染
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
export const MOCK_USDC = {
  address: (process.env.NEXT_PUBLIC_MOCK_USDC ||
    '0xdd0a2bf984d690c9cdd613603094d7455fc63e06') as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
  decimals: 6,
} as const;

// ── GuildEscrow 协作托管合约 (Arbitrum Sepolia) ──
export const GUILD_ESCROW = {
  address: (process.env.NEXT_PUBLIC_GUILD_ESCROW ||
    '0x8828c3fe2f579a70057714e4034d8c8f91232a60') as `0x${string}`,
  chainId: 421614, // Arbitrum Sepolia
} as const;
