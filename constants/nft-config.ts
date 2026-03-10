/**
 * Super Guild NFT / Token contract configuration — single source of truth.
 *
 * All addresses have process.env overrides for mainnet migration.
 * Chain IDs are driven by constants/chain-config.ts.
 */

import { PRIMARY_CHAIN_ID, PRIVILEGE_CHAIN_ID } from './chain-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrwyfcdnbfqkbsatwodc.supabase.co';
const MODEL_BASE = `${SUPABASE_URL}/storage/v1/object/public/models`;

// ── Privilege NFT (Manifold ERC-1155) ──
export const PRIVILEGE_NFT = {
  address: (process.env.NEXT_PUBLIC_PRIVILEGE_NFT_CONTRACT ||
    '0x46486Aa0aCC327Ac55b6402AdF4A31598987C400') as `0x${string}`,
  chainId: PRIVILEGE_CHAIN_ID,

  tokens: {
    PIONEER_MEMORIAL: {
      id: BigInt(1),
      name: 'Pioneer Memorial',
      zh: '拓世者纪念章',
      glbPath: `${MODEL_BASE}/pioneer.glb`,
      glowColor: '#3b82f6',
      privilege: 'VCP 获取速度 ×1.05',
      privilegeEn: 'VCP Accumulation Speed ×1.05',
    },
    LANTERN_KEEPER: {
      id: BigInt(2),
      name: "Lantern Keeper's Withered Lamp",
      zh: '提灯人枯盏',
      glbPath: `${MODEL_BASE}/lantern.glb`,
      glowColor: '#eab308',
      privilege: 'DAO 投票权重 ×1.1',
      privilegeEn: 'DAO Vote Weight ×1.1',
    },
    FIRST_FLAME: {
      id: BigInt(3),
      name: 'The First Flame',
      zh: '初火',
      glbPath: `${MODEL_BASE}/flame.glb`,
      glowColor: '#ef4444',
      privilege: 'Admin 准入 + 无限制提案权',
      privilegeEn: 'Admin Access + Unlimited Proposal Rights',
    },
    HAND_OF_JUSTICE: {
      id: BigInt(4),
      name: 'Hand of Justice',
      zh: '公义之手',
      glbPath: `${MODEL_BASE}/justice.glb`,
      glowColor: '#8b5cf6',
      privilege: '仲裁庭准入',
      privilegeEn: 'Arbitration Court Access',
    },
    BEACON: {
      id: BigInt(5),
      name: 'Beacon of the Forerunner',
      zh: '先驱者灯塔',
      glbPath: `${MODEL_BASE}/beacon.glb`,
      glowColor: '#06b6d4',
      privilege: '公告板自由发帖权',
      privilegeEn: 'Bulletin Board Posting Rights',
    },
  },
} as const;

// ── VCP Reputation Token (UUPS ERC-20) ──
export const VCP_TOKEN = {
  address: (process.env.NEXT_PUBLIC_VCP_TOKEN_ADDRESS ||
    '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C') as `0x${string}`,
  chainId: PRIMARY_CHAIN_ID,
} as const;

// ── Medal NFT (ERC-721 + ERC-7496 Dynamic Traits) ──
export const MEDAL_NFT = {
  address: (process.env.NEXT_PUBLIC_MEDAL_NFT_ADDRESS ||
    '0xef96bE9fFf59B5653085C11583beaC0D16450F1a') as `0x${string}`,
  chainId: PRIMARY_CHAIN_ID,
} as const;

// ── SparkGovernor ──
export const SPARK_GOVERNOR = {
  address: (process.env.NEXT_PUBLIC_SPARK_GOVERNOR || '') as `0x${string}`,
  chainId: PRIMARY_CHAIN_ID,
} as const;

// ── USDC (MockUSDC on testnet, Circle USDC on mainnet) ──
export const MOCK_USDC = {
  address: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    '0xdd0a2bf984d690c9cdd613603094d7455fc63e06') as `0x${string}`,
  chainId: PRIMARY_CHAIN_ID,
  decimals: 6,
} as const;

// ── GuildEscrow ──
export const GUILD_ESCROW = {
  address: (process.env.NEXT_PUBLIC_GUILD_ESCROW ||
    '0x8828c3fe2f579a70057714e4034d8c8f91232a60') as `0x${string}`,
  chainId: PRIMARY_CHAIN_ID,
} as const;

// ── Service Treasury — receives USDC for service purchases ──
export const SERVICE_TREASURY = {
  address: (process.env.NEXT_PUBLIC_SERVICE_TREASURY ||
    '0xE358B67C35810312E7AFDce9ADbE5c14e66BAEc6') as `0x${string}`,
} as const;
