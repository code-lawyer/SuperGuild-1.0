/**
 * SuperGuild Resolver Bot
 *
 * Unified backend bot that handles three duties:
 * 1. autoRelease — Poll on-chain milestones past 7-day deadline, call autoRelease()
 * 2. resolveDispute — Watch dispute_votes tally, call resolveDispute() when threshold met
 * 3. VCP mint — Watch MilestoneSettled events and call VCP mint(to, amount, reason)
 *
 * Environment variables required:
 *   RESOLVER_PRIVATE_KEY — Private key of the resolver/minter hot wallet
 *   SUPABASE_URL — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (bypasses RLS)
 *   CHAIN_ID — (optional) 421614 for testnet (default), 42161 for mainnet
 *   RPC_URL — (optional) Custom RPC URL
 *   GUILD_ESCROW_ADDRESS — (optional) Override GuildEscrow contract address
 *   VCP_TOKEN_ADDRESS — (optional) Override VCPTokenV2 contract address
 *
 * Usage:
 *   npx tsx scripts/resolver-bot.ts
 */

import { createPublicClient, createWalletClient, http, keccak256, toHex, parseAbi, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia, arbitrum } from 'viem/chains';
import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────────────────────────

const CHAIN_ID = Number(process.env.CHAIN_ID || '421614');
const chain = CHAIN_ID === 42161 ? arbitrum : arbitrumSepolia;

const GUILD_ESCROW_ADDRESS = (process.env.GUILD_ESCROW_ADDRESS ||
    '0x8828c3fe2f579a70057714e4034d8c8f91232a60') as `0x${string}`;

const VCP_TOKEN_ADDRESS = (process.env.VCP_TOKEN_ADDRESS ||
    '0xcDD2b15fEFC2071339234Ee2D72104F8E702f63C') as `0x${string}`;

const DEFAULT_RPC: Record<number, string> = {
    421614: 'https://sepolia-rollup.arbitrum.io/rpc',
    42161: 'https://arb1.arbitrum.io/rpc',
};

// On-chain milestone status enum: 0=Funded, 1=Submitted, 2=Settled, 3=Disputed
const MS_STATUS = { Funded: 0, Submitted: 1, Settled: 2, Disputed: 3 } as const;

// Minimum votes required to resolve a dispute
const DISPUTE_VOTE_THRESHOLD = 3;

// Poll interval in milliseconds
const POLL_INTERVAL = 60_000; // 1 minute

// ── ABIs (minimal) ──────────────────────────────────────────────────────────

const escrowAbi = parseAbi([
    'function autoRelease(bytes32 collabId, uint256 milestoneIdx) external',
    'function resolveDispute(bytes32 collabId, uint256 milestoneIdx, bool workerWon, bool penalizeLoser) external',
    'function getMilestone(bytes32 collabId, uint256 milestoneIdx) external view returns (uint256 amount, bytes32 contentHash, uint256 submittedAt, uint8 status, uint256 deadline)',
    'function getCollab(bytes32 collabId) external view returns (address publisher, address worker, uint256 milestoneCount, bool cancelled)',
    'function isAllSettled(bytes32 collabId) external view returns (bool)',
    'event MilestoneSettled(bytes32 indexed collabId, uint256 milestoneIdx, address indexed worker, uint256 amount)',
]);

const vcpAbi = parseAbi([
    'function mint(address to, uint256 amount, string reason) external',
    'function MINTER_ROLE() external view returns (bytes32)',
    'function hasRole(bytes32 role, address account) external view returns (bool)',
]);

// ── Env validation ──────────────────────────────────────────────────────────

function getEnv(...keys: string[]): string {
    for (const key of keys) {
        const val = process.env[key];
        if (val) return val;
    }
    console.error(`Missing env var (tried: ${keys.join(', ')})`);
    process.exit(1);
}

const RESOLVER_PRIVATE_KEY = getEnv('RESOLVER_PRIVATE_KEY', 'HOT_WALLET_PRIVATE_KEY') as `0x${string}`;
const SUPABASE_URL = getEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC[CHAIN_ID] || DEFAULT_RPC[421614];

// ── Clients ─────────────────────────────────────────────────────────────────

const account = privateKeyToAccount(RESOLVER_PRIVATE_KEY);
console.log(`[resolver-bot] Wallet: ${account.address}`);

const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
});

const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Utilities ───────────────────────────────────────────────────────────────

function toCollabId(uuid: string): `0x${string}` {
    return keccak256(toHex(uuid));
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── 1. Auto Release ─────────────────────────────────────────────────────────

async function runAutoRelease() {
    console.log('[autoRelease] Scanning for milestones past deadline...');

    // Query Supabase for collaborations in ACTIVE status
    const { data: collabs, error } = await supabase
        .from('collaborations')
        .select('id')
        .in('status', ['ACTIVE', 'LOCKED']);

    if (error) {
        console.error('[autoRelease] Supabase error:', error.message);
        return;
    }
    if (!collabs || collabs.length === 0) return;

    const now = Math.floor(Date.now() / 1000);

    for (const collab of collabs) {
        const collabId = toCollabId(collab.id);

        try {
            const [, , milestoneCount, cancelled] = await publicClient.readContract({
                address: GUILD_ESCROW_ADDRESS,
                abi: escrowAbi,
                functionName: 'getCollab',
                args: [collabId],
            });

            if (cancelled) continue;

            for (let i = 0; i < Number(milestoneCount); i++) {
                const [amount, , , status, deadline] = await publicClient.readContract({
                    address: GUILD_ESCROW_ADDRESS,
                    abi: escrowAbi,
                    functionName: 'getMilestone',
                    args: [collabId, BigInt(i)],
                });

                // Status 1 = Submitted, deadline > 0, deadline passed
                if (Number(status) === MS_STATUS.Submitted && Number(deadline) > 0 && now > Number(deadline)) {
                    console.log(`[autoRelease] Releasing collab=${collab.id.slice(0, 8)}... milestone=${i} amount=${formatUnits(amount, 6)} USDC`);

                    try {
                        const hash = await walletClient.writeContract({
                            address: GUILD_ESCROW_ADDRESS,
                            abi: escrowAbi,
                            functionName: 'autoRelease',
                            args: [collabId, BigInt(i)],
                        });
                        const receipt = await publicClient.waitForTransactionReceipt({ hash });
                        console.log(`[autoRelease] TX confirmed: ${receipt.transactionHash}`);

                        // Update milestone status in Supabase
                        const { data: milestones } = await supabase
                            .from('milestones')
                            .select('id')
                            .eq('collab_id', collab.id)
                            .eq('sort_order', i + 1) // 1-based in Supabase
                            .single();

                        if (milestones) {
                            await supabase
                                .from('milestones')
                                .update({ status: 'SETTLED' })
                                .eq('id', milestones.id);
                        }

                        // Check if all milestones settled → update collab status
                        await checkAndSettleCollab(collab.id, collabId);
                    } catch (txErr: any) {
                        console.error(`[autoRelease] TX failed for collab=${collab.id.slice(0, 8)}... ms=${i}:`, txErr.shortMessage || txErr.message);
                    }
                }
            }
        } catch (err: any) {
            // CollabNotFound (0xc98d3122) = not deposited on-chain yet, skip silently
            if (err.message?.includes('0xc98d3122') || err.message?.includes('CollabNotFound')) continue;
            console.error(`[autoRelease] Read failed for collab=${collab.id.slice(0, 8)}...:`, err.shortMessage || err.message);
        }
    }
}

// ── 2. Resolve Dispute ──────────────────────────────────────────────────────

async function runResolveDispute() {
    console.log('[resolveDispute] Checking disputed collabs for vote resolution...');

    // Query Supabase for DISPUTED collaborations
    const { data: collabs, error } = await supabase
        .from('collaborations')
        .select('id')
        .eq('status', 'DISPUTED');

    if (error) {
        console.error('[resolveDispute] Supabase error:', error.message);
        return;
    }
    if (!collabs || collabs.length === 0) return;

    for (const collab of collabs) {
        // Find the disputed milestone
        const { data: milestones } = await supabase
            .from('milestones')
            .select('id, sort_order')
            .eq('collab_id', collab.id)
            .eq('status', 'SUBMITTED');

        if (!milestones || milestones.length === 0) continue;

        for (const ms of milestones) {
            // Count votes for this milestone
            const { data: votes, error: votesErr } = await supabase
                .from('dispute_votes')
                .select('worker_won')
                .eq('milestone_id', ms.id);

            if (votesErr || !votes) continue;
            if (votes.length < DISPUTE_VOTE_THRESHOLD) continue;

            const forWorker = votes.filter(v => v.worker_won).length;
            const forPublisher = votes.filter(v => !v.worker_won).length;
            const workerWon = forWorker > forPublisher;

            console.log(`[resolveDispute] collab=${collab.id.slice(0, 8)}... ms=${ms.sort_order - 1} votes: worker=${forWorker} publisher=${forPublisher} → ${workerWon ? 'WORKER wins' : 'PUBLISHER wins'}`);

            const collabId = toCollabId(collab.id);
            const milestoneIdx = BigInt(ms.sort_order - 1); // 0-based on-chain

            try {
                // Verify on-chain status is Disputed (3) before calling
                const [, , , status] = await publicClient.readContract({
                    address: GUILD_ESCROW_ADDRESS,
                    abi: escrowAbi,
                    functionName: 'getMilestone',
                    args: [collabId, milestoneIdx],
                });

                if (Number(status) !== MS_STATUS.Disputed) {
                    console.log(`[resolveDispute] Milestone not in Disputed status on-chain (status=${status}), skipping`);
                    continue;
                }

                const hash = await walletClient.writeContract({
                    address: GUILD_ESCROW_ADDRESS,
                    abi: escrowAbi,
                    functionName: 'resolveDispute',
                    args: [collabId, milestoneIdx, workerWon, true], // penalizeLoser = true
                });
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                console.log(`[resolveDispute] TX confirmed: ${receipt.transactionHash}`);

                // Update milestone and collab status in Supabase
                await supabase
                    .from('milestones')
                    .update({ status: 'SETTLED' })
                    .eq('id', ms.id);

                // Check if all milestones settled
                await checkAndSettleCollab(collab.id, collabId);
            } catch (txErr: any) {
                console.error(`[resolveDispute] TX failed:`, txErr.shortMessage || txErr.message);
            }
        }
    }
}

// ── 3. VCP Mint on MilestoneSettled events ──────────────────────────────────

let lastProcessedBlock = 0n;

async function runVCPMintWatcher() {
    console.log('[vcpMint] Checking for new MilestoneSettled events...');

    const currentBlock = await publicClient.getBlockNumber();
    // On first run, look back 1000 blocks (~15 min on Arbitrum Sepolia)
    const fromBlock = lastProcessedBlock > 0n ? lastProcessedBlock + 1n : currentBlock - 1000n;

    if (fromBlock > currentBlock) return;

    try {
        const logs = await publicClient.getContractEvents({
            address: GUILD_ESCROW_ADDRESS,
            abi: escrowAbi,
            eventName: 'MilestoneSettled',
            fromBlock,
            toBlock: currentBlock,
        });

        for (const log of logs) {
            const { collabId, milestoneIdx, worker, amount } = log.args;
            if (!collabId || !worker || amount === undefined) continue;

            const amountFormatted = formatUnits(amount, 6);
            console.log(`[vcpMint] MilestoneSettled: worker=${worker} amount=${amountFormatted} USDC`);

            // Check vcp_settlements for idempotency
            const settlementKey = `${collabId}-${milestoneIdx}`;
            const { data: existing } = await supabase
                .from('vcp_settlements')
                .select('id')
                .eq('settlement_key', settlementKey)
                .maybeSingle();

            if (existing) {
                console.log(`[vcpMint] Already processed ${settlementKey}, skipping`);
                continue;
            }

            // Calculate VCP amount: base 100 per milestone (simple formula for now)
            // In production, the AI Oracle will compute a more nuanced score
            const vcpAmount = 100n * 10n ** 18n; // 100 VCP (18 decimals)
            const reason = `Milestone settled: ${collabId.slice(0, 10)}...[${milestoneIdx}]`;

            try {
                const hash = await walletClient.writeContract({
                    address: VCP_TOKEN_ADDRESS,
                    abi: vcpAbi,
                    functionName: 'mint',
                    args: [worker, vcpAmount, reason],
                });
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                console.log(`[vcpMint] Minted 100 VCP to ${worker}: ${receipt.transactionHash}`);

                // Record in vcp_settlements for idempotency
                await supabase
                    .from('vcp_settlements')
                    .insert({
                        settlement_key: settlementKey,
                        worker_address: worker,
                        vcp_amount: 100,
                        tx_hash: receipt.transactionHash,
                    });
            } catch (mintErr: any) {
                console.error(`[vcpMint] Mint failed for ${worker}:`, mintErr.shortMessage || mintErr.message);
                // If MINTER_ROLE not granted, log clear message
                if (mintErr.message?.includes('AccessControl')) {
                    console.error('[vcpMint] CRITICAL: Resolver wallet does not have MINTER_ROLE on VCPTokenV2. Grant it first.');
                }
            }
        }

        lastProcessedBlock = currentBlock;
    } catch (err: any) {
        console.error('[vcpMint] Event fetch error:', err.message);
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function checkAndSettleCollab(collabUUID: string, collabId: `0x${string}`) {
    try {
        const allSettled = await publicClient.readContract({
            address: GUILD_ESCROW_ADDRESS,
            abi: escrowAbi,
            functionName: 'isAllSettled',
            args: [collabId],
        });

        if (allSettled) {
            console.log(`[checkSettle] All milestones settled for collab=${collabUUID.slice(0, 8)}..., updating to SETTLED`);
            await supabase
                .from('collaborations')
                .update({ status: 'SETTLED' })
                .eq('id', collabUUID);
        }
    } catch (err: any) {
        console.error(`[checkSettle] Error:`, err.message);
    }
}

// ── Startup check ───────────────────────────────────────────────────────────

async function verifyMinterRole() {
    try {
        const minterRole = await publicClient.readContract({
            address: VCP_TOKEN_ADDRESS,
            abi: vcpAbi,
            functionName: 'MINTER_ROLE',
        });

        const hasRole = await publicClient.readContract({
            address: VCP_TOKEN_ADDRESS,
            abi: vcpAbi,
            functionName: 'hasRole',
            args: [minterRole, account.address],
        });

        if (!hasRole) {
            console.warn('========================================');
            console.warn('[WARN] Resolver wallet does NOT have MINTER_ROLE on VCPTokenV2');
            console.warn(`       Wallet: ${account.address}`);
            console.warn('       VCP minting will fail until role is granted.');
            console.warn('       Run: grantRole(MINTER_ROLE, resolverAddress) from admin');
            console.warn('========================================');
        } else {
            console.log('[startup] MINTER_ROLE verified on VCPTokenV2');
        }
    } catch (err: any) {
        console.warn('[startup] Could not verify MINTER_ROLE:', err.message);
    }
}

// ── Main loop ───────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║   SuperGuild Resolver Bot v1.1       ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`Chain: ${chain.name} (${chain.id})`);
    console.log(`Escrow: ${GUILD_ESCROW_ADDRESS}`);
    console.log(`VCP: ${VCP_TOKEN_ADDRESS}`);
    console.log(`RPC: ${RPC_URL}`);
    console.log(`Poll interval: ${POLL_INTERVAL / 1000}s`);
    console.log(`Dispute vote threshold: ${DISPUTE_VOTE_THRESHOLD}`);
    console.log('');

    await verifyMinterRole();

    // Main polling loop
    while (true) {
        try {
            await runAutoRelease();
            await runResolveDispute();
            await runVCPMintWatcher();
        } catch (err: any) {
            console.error('[main] Unhandled error in poll cycle:', err.message);
        }

        console.log(`[main] Cycle complete. Next poll in ${POLL_INTERVAL / 1000}s...`);
        await sleep(POLL_INTERVAL);
    }
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
