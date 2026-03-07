/**
 * Grant MINTER_ROLE on VCPTokenV2 to the resolver/hot wallet.
 * Run once before starting the resolver bot.
 *
 * Environment variables:
 *   RESOLVER_PRIVATE_KEY — Admin wallet private key
 *   VCP_TOKEN_ADDRESS — (optional) Override VCPTokenV2 address
 *   CHAIN_ID — (optional) 421614 (default) or 42161 for mainnet
 *   RPC_URL — (optional) Custom RPC URL
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/grant-minter-role.ts
 */

import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia, arbitrum } from 'viem/chains';

const CHAIN_ID = Number(process.env.CHAIN_ID || '421614');
const chain = CHAIN_ID === 42161 ? arbitrum : arbitrumSepolia;

const VCP_TOKEN_ADDRESS = (process.env.VCP_TOKEN_ADDRESS ||
    '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C') as `0x${string}`;

const DEFAULT_RPC: Record<number, string> = {
    421614: 'https://sepolia-rollup.arbitrum.io/rpc',
    42161: 'https://arb1.arbitrum.io/rpc',
};
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC[CHAIN_ID] || DEFAULT_RPC[421614];

const vcpAbi = parseAbi([
    'function MINTER_ROLE() external view returns (bytes32)',
    'function DEFAULT_ADMIN_ROLE() external view returns (bytes32)',
    'function hasRole(bytes32 role, address account) external view returns (bool)',
    'function grantRole(bytes32 role, address account) external',
]);

function getEnv(...keys: string[]): string {
    for (const key of keys) {
        const val = process.env[key];
        if (val) return val;
    }
    console.error(`Missing env var (tried: ${keys.join(', ')})`);
    process.exit(1);
}

const PRIVATE_KEY = getEnv('RESOLVER_PRIVATE_KEY', 'HOT_WALLET_PRIVATE_KEY') as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

async function main() {
    console.log(`Chain: ${chain.name} (${chain.id})`);
    console.log(`Wallet: ${account.address}`);
    console.log(`VCPTokenV2: ${VCP_TOKEN_ADDRESS}`);

    const [minterRole, adminRole] = await Promise.all([
        publicClient.readContract({ address: VCP_TOKEN_ADDRESS, abi: vcpAbi, functionName: 'MINTER_ROLE' }),
        publicClient.readContract({ address: VCP_TOKEN_ADDRESS, abi: vcpAbi, functionName: 'DEFAULT_ADMIN_ROLE' }),
    ]);

    const [alreadyMinter, isAdmin] = await Promise.all([
        publicClient.readContract({ address: VCP_TOKEN_ADDRESS, abi: vcpAbi, functionName: 'hasRole', args: [minterRole, account.address] }),
        publicClient.readContract({ address: VCP_TOKEN_ADDRESS, abi: vcpAbi, functionName: 'hasRole', args: [adminRole, account.address] }),
    ]);

    if (alreadyMinter) {
        console.log('✓ Wallet already has MINTER_ROLE — nothing to do.');
        return;
    }

    if (!isAdmin) {
        console.error('✗ Wallet does not have DEFAULT_ADMIN_ROLE. Cannot grant MINTER_ROLE from this wallet.');
        console.error('  Use the original deployer wallet to run this script.');
        process.exit(1);
    }

    console.log('Granting MINTER_ROLE to self...');
    const hash = await walletClient.writeContract({
        address: VCP_TOKEN_ADDRESS,
        abi: vcpAbi,
        functionName: 'grantRole',
        args: [minterRole, account.address],
    });
    console.log(`TX submitted: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✓ MINTER_ROLE granted! Block: ${receipt.blockNumber}`);
}

main().catch(err => {
    console.error(err.shortMessage || err.message);
    process.exit(1);
});
