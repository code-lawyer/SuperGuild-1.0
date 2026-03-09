// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// ── Constants ──
const TOPIC_MILESTONE_SETTLED = '0x42e4855b2a4f1cd668a51e37d6eef09e0ae21bc8205493610376233478f26aa8';
const TOPIC_PAID = '0x37db9851b6c9a32f8ddcf4734e6526de7c85268ef735f7883ea70dc8a39c9c85';
const SELF_MANAGED_VCP_MULTIPLIER = 0.5;
const MONTHLY_VCP_CAP = 1000;
const COOLDOWN_DAYS = 7;

// ── Helpers ──

async function verifyAlchemySignature(body: string, signature: string, signingKey: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

/** Increment VCP for a worker in the profiles table. */
async function upsertVcp(supabase: any, workerAddress: string, vcpToAdd: number) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('vcp_cache')
    .eq('wallet_address', workerAddress)
    .single();

  const currentVcp = profile?.vcp_cache || 0;
  const newVcp = currentVcp + vcpToAdd;

  const { error } = await supabase
    .from('profiles')
    .upsert({
      wallet_address: workerAddress,
      vcp_cache: newVcp,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to upsert VCP:", error);
  } else {
    console.log(`VCP updated: ${workerAddress} → ${newVcp} (+${vcpToAdd})`);
  }
}

/** Check if this event was already processed (idempotency). */
async function isDuplicate(supabase: any, settlementKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('vcp_settlements')
    .select('id')
    .eq('settlement_key', settlementKey)
    .maybeSingle();
  return !!data;
}

/**
 * Anti-cheat: cooldown — same (publisher, worker) pair can only mint once per 7 days.
 * Returns skip_reason or null if passed.
 */
async function checkCooldown(supabase: any, publisherAddress: string, workerAddress: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('vcp_settlements')
    .select('id')
    .eq('publisher_address', publisherAddress)
    .eq('worker_address', workerAddress)
    .eq('anti_cheat_passed', true)
    .gte('evaluated_at', cutoff)
    .limit(1);

  if (data && data.length > 0) {
    return `cooldown: same (publisher, worker) pair minted within ${COOLDOWN_DAYS} days`;
  }
  return null;
}

/**
 * Anti-cheat: monthly cap — single worker address max 1000 VCP per calendar month.
 * Returns skip_reason or null if passed.
 */
async function checkMonthlyCap(supabase: any, workerAddress: string, vcpToAdd: number): Promise<string | null> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = await supabase
    .from('vcp_settlements')
    .select('vcp_amount')
    .eq('worker_address', workerAddress)
    .eq('anti_cheat_passed', true)
    .gte('evaluated_at', monthStart);

  const totalThisMonth = (data || []).reduce((sum: number, r: any) => sum + (r.vcp_amount || 0), 0);
  if (totalThisMonth + vcpToAdd > MONTHLY_VCP_CAP) {
    return `monthly_cap: worker already minted ${totalThisMonth} VCP this month (cap: ${MONTHLY_VCP_CAP})`;
  }
  return null;
}

/** Write a settlement record for audit trail. */
async function writeSettlement(supabase: any, record: {
  settlement_key: string;
  worker_address: string;
  publisher_address: string | null;
  vcp_amount: number;
  anti_cheat_passed: boolean;
  skip_reason: string | null;
  tx_hash: string | null;
}) {
  const { error } = await supabase.from('vcp_settlements').insert(record);
  if (error) {
    console.error("Failed to write settlement:", error);
  }
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 0. Verify Alchemy Webhook signature
    const alchemySigningKey = Deno.env.get('ALCHEMY_WEBHOOK_SIGNING_KEY') || '';
    const alchemySignature = req.headers.get('x-alchemy-signature') || '';
    const rawBody = await req.text();

    if (!alchemySigningKey) {
      console.error('ALCHEMY_WEBHOOK_SIGNING_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    }

    if (!alchemySignature || !(await verifyAlchemySignature(rawBody, alchemySignature, alchemySigningKey))) {
      console.warn('Invalid or missing webhook signature — rejecting request');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    // 1. Initialize Supabase Client with Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase Configuration Missing');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse Alchemy Webhook Payload
    const payload = JSON.parse(rawBody);
    console.log("Received Webhook Payload:", JSON.stringify(payload));

    if (payload.event && payload.event.activity && payload.event.activity.length > 0) {
      for (const activity of payload.event.activity) {
        if (!activity.log || !activity.log.topics || activity.log.topics.length === 0) continue;

        const topic0 = activity.log.topics[0]?.toLowerCase();
        const dataBytes = activity.log.data || '0x';
        const txHash = activity.hash || null;

        // ── GuildEscrow: MilestoneSettled ──
        // topics: [topic0, escrowId, boardId, taskId]
        // data:   [worker (32 bytes), vcpMinted (32 bytes)]
        if (topic0 === TOPIC_MILESTONE_SETTLED) {
          const cleanData = dataBytes.startsWith('0x') ? dataBytes.slice(2) : dataBytes;
          if (cleanData.length < 128) continue;

          const workerAddress = "0x" + cleanData.substring(24, 64).toLowerCase();
          const vcpMinted = parseInt(cleanData.substring(64, 128), 16);
          if (!workerAddress || vcpMinted <= 0) continue;

          const settlementKey = `ms-${txHash}-${workerAddress}`;
          console.log(`MilestoneSettled: worker=${workerAddress}, vcp=${vcpMinted}`);

          // Idempotency
          if (await isDuplicate(supabase, settlementKey)) {
            console.log(`Skipping duplicate: ${settlementKey}`);
            continue;
          }

          // Anti-cheat: monthly cap (publisher not available in MilestoneSettled event)
          const monthlySkip = await checkMonthlyCap(supabase, workerAddress, vcpMinted);
          if (monthlySkip) {
            console.warn(`Anti-cheat blocked: ${monthlySkip}`);
            await writeSettlement(supabase, {
              settlement_key: settlementKey,
              worker_address: workerAddress,
              publisher_address: null,
              vcp_amount: vcpMinted,
              anti_cheat_passed: false,
              skip_reason: monthlySkip,
              tx_hash: txHash,
            });
            continue;
          }

          // Passed — mint VCP + record
          await upsertVcp(supabase, workerAddress, vcpMinted);
          await writeSettlement(supabase, {
            settlement_key: settlementKey,
            worker_address: workerAddress,
            publisher_address: null,
            vcp_amount: vcpMinted,
            anti_cheat_passed: true,
            skip_reason: null,
            tx_hash: txHash,
          });
          continue;
        }

        // ── DirectPay: Paid ──
        // topics: [topic0, collabId, publisher, worker]
        // data:   [amount (32 bytes)]
        if (topic0 === TOPIC_PAID) {
          const topics = activity.log.topics;
          if (topics.length < 4) continue;

          const publisherAddress = "0x" + topics[2].slice(-40).toLowerCase();
          const workerAddress = "0x" + topics[3].slice(-40).toLowerCase();
          const cleanData = dataBytes.startsWith('0x') ? dataBytes.slice(2) : dataBytes;
          const amountRaw = parseInt(cleanData.substring(0, 64), 16);
          const usdcAmount = amountRaw / 1e6;
          const vcpAwarded = Math.floor(usdcAmount * SELF_MANAGED_VCP_MULTIPLIER);
          if (vcpAwarded <= 0) continue;

          const settlementKey = `dp-${txHash}-${workerAddress}`;
          console.log(`DirectPay Paid: publisher=${publisherAddress}, worker=${workerAddress}, usdc=${usdcAmount}, vcp=${vcpAwarded}`);

          // Idempotency
          if (await isDuplicate(supabase, settlementKey)) {
            console.log(`Skipping duplicate: ${settlementKey}`);
            continue;
          }

          // Anti-cheat #1: cooldown (same publisher+worker pair, 7 days)
          const cooldownSkip = await checkCooldown(supabase, publisherAddress, workerAddress);
          if (cooldownSkip) {
            console.warn(`Anti-cheat blocked: ${cooldownSkip}`);
            await writeSettlement(supabase, {
              settlement_key: settlementKey,
              worker_address: workerAddress,
              publisher_address: publisherAddress,
              vcp_amount: vcpAwarded,
              anti_cheat_passed: false,
              skip_reason: cooldownSkip,
              tx_hash: txHash,
            });
            continue;
          }

          // Anti-cheat #2: monthly cap
          const monthlySkip = await checkMonthlyCap(supabase, workerAddress, vcpAwarded);
          if (monthlySkip) {
            console.warn(`Anti-cheat blocked: ${monthlySkip}`);
            await writeSettlement(supabase, {
              settlement_key: settlementKey,
              worker_address: workerAddress,
              publisher_address: publisherAddress,
              vcp_amount: vcpAwarded,
              anti_cheat_passed: false,
              skip_reason: monthlySkip,
              tx_hash: txHash,
            });
            continue;
          }

          // Passed — mint VCP + record
          await upsertVcp(supabase, workerAddress, vcpAwarded);
          await writeSettlement(supabase, {
            settlement_key: settlementKey,
            worker_address: workerAddress,
            publisher_address: publisherAddress,
            vcp_amount: vcpAwarded,
            anti_cheat_passed: true,
            skip_reason: null,
            tx_hash: txHash,
          });
          continue;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
  }
})
