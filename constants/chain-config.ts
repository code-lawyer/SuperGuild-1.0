/**
 * Central chain configuration — the ONLY place to define network selection.
 *
 * Testnet (default):
 *   PRIMARY  = Arbitrum Sepolia (421614)
 *   PRIVILEGE = Sepolia ETH (11155111)
 *
 * Mainnet (set via env):
 *   NEXT_PUBLIC_PRIMARY_CHAIN_ID=42161
 *   NEXT_PUBLIC_PRIVILEGE_CHAIN_ID=1
 */

import {
  arbitrumSepolia,
  arbitrum,
  sepolia,
  mainnet,
  baseSepolia,
  base,
  polygon,
} from 'wagmi/chains';

// ── Chain IDs (env-driven, testnet defaults) ────────────────────────────────

export const PRIMARY_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_PRIMARY_CHAIN_ID || '421614',
);

export const PRIVILEGE_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_PRIVILEGE_CHAIN_ID || '11155111',
);

export const IS_MAINNET = PRIMARY_CHAIN_ID === 42161;

// ── Chain objects ───────────────────────────────────────────────────────────

const chainById = {
  421614: arbitrumSepolia,
  42161: arbitrum,
  11155111: sepolia,
  1: mainnet,
  84532: baseSepolia,
  8453: base,
  137: polygon,
} as const;

type SupportedChainId = keyof typeof chainById;

export const PRIMARY_CHAIN = chainById[PRIMARY_CHAIN_ID as SupportedChainId]!;
export const PRIVILEGE_CHAIN = chainById[PRIVILEGE_CHAIN_ID as SupportedChainId]!;

// ── Alchemy RPC subdomain mapping ──────────────────────────────────────────

const alchemySubdomain: Record<number, string> = {
  421614: 'arb-sepolia',
  42161: 'arb-mainnet',
  11155111: 'eth-sepolia',
  1: 'eth-mainnet',
  84532: 'base-sepolia',
  8453: 'base-mainnet',
};

export function getAlchemyRpcUrl(chainId: number, apiKey: string): string {
  const sub = alchemySubdomain[chainId];
  if (!sub) throw new Error(`No Alchemy subdomain for chain ${chainId}`);
  return `https://${sub}.g.alchemy.com/v2/${apiKey}`;
}
