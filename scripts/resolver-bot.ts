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

// ── Grade → VCP lookup ──────────────────────────────────────────────────────

const GRADE_VCP: Record<string, number> = {
    S: 500, A: 300, B: 150, C: 80, D: 40, E: 10,
};

const MONTHLY_VCP_CAP = 1000;
const COOLDOWN_DAYS = 7;
const FAST_CONFIRM_THRESHOLD_SEC = 120; // 2 minutes
const FAST_CONFIRM_WINDOW = 10; // last N collabs to check
const FAST_CONFIRM_TRIGGER = 5;  // how many fast confirms to trigger freeze
const FREEZE_DAYS = 30;

// ── Anti-cheat helpers ──────────────────────────────────────────────────────

async function checkCooldown(publisher: string, worker: string): Promise<string | null> {
    const since = new Date(Date.now() - COOLDOWN_DAYS * 86400_000).toISOString();
    const { data } = await supabase
        .from('vcp_settlements')
        .select('id')
        .eq('publisher_address', publisher.toLowerCase())
        .eq('worker_address', worker.toLowerCase())
        .eq('anti_cheat_passed', true)
        .gte('evaluated_at', since)
        .limit(1);
    return data && data.length > 0 ? 'cooldown_7d' : null;
}

async function checkMonthlyCapReached(worker: string): Promise<string | null> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
        .from('vcp_settlements')
        .select('vcp_amount')
        .eq('worker_address', worker.toLowerCase())
        .eq('anti_cheat_passed', true)
        .gte('evaluated_at', monthStart.toISOString());
    const total = (data || []).reduce((sum, r) => sum + (r.vcp_amount || 0), 0);
    return total >= MONTHLY_VCP_CAP ? 'monthly_cap' : null;
}

async function checkFastConfirmFreeze(address: string): Promise<string | null> {
    // Check if address is frozen (has been flagged within last FREEZE_DAYS)
    const freezeSince = new Date(Date.now() - FREEZE_DAYS * 86400_000).toISOString();
    const { data: frozen } = await supabase
        .from('vcp_settlements')
        .select('id')
        .eq('skip_reason', 'fast_confirm_freeze')
        .or(`publisher_address.eq.${address.toLowerCase()},worker_address.eq.${address.toLowerCase()}`)
        .gte('evaluated_at', freezeSince)
        .limit(1);

    if (frozen && frozen.length > 0) {
        // Unfreeze only if there's a settlement AFTER the freeze record that passed anti-cheat
        const { data: freezeRecord } = await supabase
            .from('vcp_settlements')
            .select('evaluated_at')
            .eq('skip_reason', 'fast_confirm_freeze')
            .or(`publisher_address.eq.${address.toLowerCase()},worker_address.eq.${address.toLowerCase()}`)
            .order('evaluated_at', { ascending: false })
            .limit(1);

        if (freezeRecord && freezeRecord.length > 0) {
            const freezeTime = freezeRecord[0].evaluated_at;
            const { data: slowConfirm } = await supabase
                .from('vcp_settlements')
                .select('id')
                .or(`publisher_address.eq.${address.toLowerCase()},worker_address.eq.${address.toLowerCase()}`)
                .eq('anti_cheat_passed', true)
                .gt('evaluated_at', freezeTime)
                .limit(1);
            if (slowConfirm && slowConfirm.length > 0) return null; // unfrozen by a legitimate settlement after freeze
        }
        return 'fast_confirm_freeze';
    }

    // Check if we should newly freeze: look at last N settled collabs involving this address
    const { data: recent } = await supabase
        .from('vcp_settlements')
        .select('submitted_at, confirmed_at')
        .or(`publisher_address.eq.${address.toLowerCase()},worker_address.eq.${address.toLowerCase()}`)
        .not('submitted_at', 'is', null)
        .not('confirmed_at', 'is', null)
        .order('evaluated_at', { ascending: false })
        .limit(FAST_CONFIRM_WINDOW);

    if (!recent || recent.length < FAST_CONFIRM_TRIGGER) return null;

    let fastCount = 0;
    for (const r of recent) {
        if (!r.submitted_at || !r.confirmed_at) continue;
        const diff = (new Date(r.confirmed_at).getTime() - new Date(r.submitted_at).getTime()) / 1000;
        if (diff >= 0 && diff < FAST_CONFIRM_THRESHOLD_SEC) fastCount++;
    }

    return fastCount >= FAST_CONFIRM_TRIGGER ? 'fast_confirm_freeze' : null;
}

// ── 3. VCP Mint on MilestoneSettled events ──────────────────────────────────

let lastProcessedBlock = BigInt(0);

async function runVCPMintWatcher() {
    console.log('[vcpMint] Checking for new MilestoneSettled events...');

    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = lastProcessedBlock > BigInt(0) ? lastProcessedBlock + BigInt(1) : currentBlock - BigInt(1000);

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

            // Idempotency check
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

            // Find the collaboration in Supabase to get grade + publisher
            // We must hash each UUID client-side (keccak256 not available in Supabase),
            // so paginate through all collaborations
            let collabUUID = '';
            let collabGrade = 'E';
            let publisher = '';
            let page = 0;
            const PAGE_SIZE = 500;
            while (!collabUUID) {
                const { data: collabs } = await supabase
                    .from('collaborations')
                    .select('id, grade, initiator_id')
                    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

                if (!collabs || collabs.length === 0) break;

                for (const c of collabs) {
                    if (toCollabId(c.id) === collabId) {
                        collabUUID = c.id;
                        collabGrade = c.grade || 'E';
                        publisher = c.initiator_id || '';
                        break;
                    }
                }
                if (collabs.length < PAGE_SIZE) break;
                page++;
            }

            if (!collabUUID) {
                console.warn(`[vcpMint] Could not find collaboration for on-chain collabId ${collabId}, defaulting to grade E`);
            }

            const vcpForGrade = GRADE_VCP[collabGrade] || GRADE_VCP.E;

            // ── Anti-cheat checks ──
            let skipReason: string | null = null;

            if (!skipReason && publisher) {
                skipReason = await checkCooldown(publisher, worker);
                if (skipReason) console.log(`[vcpMint] SKIP (${skipReason}): publisher=${publisher.slice(0, 8)}... worker=${worker.slice(0, 8)}...`);
            }

            if (!skipReason) {
                skipReason = await checkFastConfirmFreeze(worker);
                if (skipReason) console.log(`[vcpMint] SKIP (${skipReason}): worker=${worker.slice(0, 8)}... is frozen`);
            }
            if (!skipReason && publisher) {
                skipReason = await checkFastConfirmFreeze(publisher);
                if (skipReason) console.log(`[vcpMint] SKIP (${skipReason}): publisher=${publisher.slice(0, 8)}... is frozen`);
            }

            if (!skipReason) {
                skipReason = await checkMonthlyCapReached(worker);
                if (skipReason) console.log(`[vcpMint] SKIP (${skipReason}): worker=${worker.slice(0, 8)}... hit monthly cap`);
            }

            // Record settlement (with or without mint)
            const settlementRecord: Record<string, any> = {
                settlement_key: settlementKey,
                worker_address: worker.toLowerCase(),
                publisher_address: publisher ? publisher.toLowerCase() : null,
                grade: collabGrade,
                vcp_amount: skipReason ? 0 : vcpForGrade,
                anti_cheat_passed: !skipReason,
                skip_reason: skipReason || null,
            };

            if (skipReason) {
                // Record but don't mint
                await supabase.from('vcp_settlements').insert(settlementRecord);
                continue;
            }

            // Mint VCP
            const vcpAmount = BigInt(vcpForGrade) * BigInt(10) ** BigInt(18);
            const reason = `Grade ${collabGrade} settled: ${(collabId as string).slice(0, 10)}...[${milestoneIdx}]`;

            try {
                const hash = await walletClient.writeContract({
                    address: VCP_TOKEN_ADDRESS,
                    abi: vcpAbi,
                    functionName: 'mint',
                    args: [worker, vcpAmount, reason],
                });
                const receipt = await publicClient.waitForTransactionReceipt({ hash });
                console.log(`[vcpMint] Minted ${vcpForGrade} VCP (grade ${collabGrade}) to ${worker}: ${receipt.transactionHash}`);

                await supabase.from('vcp_settlements').insert({
                    ...settlementRecord,
                    tx_hash: receipt.transactionHash,
                });
            } catch (mintErr: any) {
                console.error(`[vcpMint] Mint failed for ${worker}:`, mintErr.shortMessage || mintErr.message);
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
