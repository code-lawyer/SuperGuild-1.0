// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 1. Initialize Supabase Client with Service Role (Bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase Configuration Missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse Alchemy Webhook Payload
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload));

    // Alchemy Custom Webhook format contains events in 'activity' array
    if (payload.event && payload.event.activity && payload.event.activity.length > 0) {
      for (const activity of payload.event.activity) {

        // Ensure this is a log activity
        if (!activity.log || !activity.log.data) continue;

        const dataBytes = activity.log.data;

        // In GuildEscrow, MilestoneSettled is emitted:
        // event MilestoneSettled(bytes32 indexed escrowId, uint256 indexed boardId, uint256 indexed taskId, address worker, uint256 vcpMinted)
        // Since escrowId, boardId, taskId are INDEXED, they are in 'topics'
        // 'worker' and 'vcpMinted' are unindexed, meaning they are packed in 'data'
        // 'worker' is 32 bytes (address padded)
        // 'vcpMinted' is 32 bytes (uint256)

        // Strip "0x"
        const cleanData = dataBytes.startsWith('0x') ? dataBytes.slice(2) : dataBytes;

        if (cleanData.length >= 128) { // 2 * 64 chars
          // Addresses are padded to 32 bytes (64 hex chars), last 40 chars is address
          const workerHex = cleanData.substring(0, 64);
          const vcpMintedHex = cleanData.substring(64, 128);

          // Format Address to standard Checksum/Lowercase
          const workerAddress = "0x" + workerHex.substring(24).toLowerCase();
          const vcpMinted = parseInt(vcpMintedHex, 16);

          console.log(`Parsed MilestoneSettled: Worker=${workerAddress}, VCP_Minted=${vcpMinted}`);

          if (workerAddress && vcpMinted > 0) {
            // 3. Upsert into Supabase `profiles` vcp_cache
            // Using RPC to increment atomically if possible, or selecting and adding
            // We will do a generic read and write for MVP

            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('vcp_cache')
              .eq('wallet_address', workerAddress)
              .single();

            let currentVcp = 0;
            if (!profileErr && profile) {
              currentVcp = profile.vcp_cache || 0;
            }

            const newVcp = currentVcp + vcpMinted;

            const { error: updateErr } = await supabase
              .from('profiles')
              .upsert({
                wallet_address: workerAddress,
                vcp_cache: newVcp,
                updated_at: new Date().toISOString()
              });

            if (updateErr) {
              console.error("Failed to upsert VCP:", updateErr);
            } else {
              console.log(`Successfully updated ${workerAddress} VCP to ${newVcp}`);
            }
          }
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
