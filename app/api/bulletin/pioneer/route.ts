import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPublicClient, http, verifyMessage } from 'viem';
import { createRateLimiter } from '@/utils/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
import { sepolia } from 'viem/chains';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC)
});

const ERC1155_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" },
            { "internalType": "uint256", "name": "id", "type": "uint256" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export async function POST(req: Request) {
    const limited = limiter.check(req);
    if (limited) return limited;
    try {
        const body = await req.json();
        const { title, content, authorAddress, attachment, signature } = body;

        if (!authorAddress || !title || !content || !signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 0. Verify EIP-191 signature (prevent address spoofing)
        const message = `I am posting a Pioneer Bulletin to SuperGuild\nAddress: ${authorAddress}`;
        const valid = await verifyMessage({
            address: authorAddress as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
        });
        if (!valid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        // 1. Verify NFT Holding
        let balance: bigint;
        try {
            balance = await publicClient.readContract({
                address: PRIVILEGE_NFT.address,
                abi: ERC1155_ABI,
                functionName: 'balanceOf',
                args: [authorAddress as `0x${string}`, PRIVILEGE_NFT.tokens.BEACON.id]
            });
        } catch (rpcError) {
            console.error('RPC error verifying Pioneer NFT:', rpcError);
            return NextResponse.json({ error: 'NFT verification service temporarily unavailable', code: 'RPC_ERROR' }, { status: 503 });
        }

        if (balance === 0n) {
            return NextResponse.json({ error: 'Forbidden: You do not own the Pioneer Beacon NFT.' }, { status: 403 });
        }

        // 2. Check 7-day rate limit
        const { data: lastPost, error: fetchError } = await supabaseAdmin
            .from('bulletins')
            .select('created_at')
            .eq('author', authorAddress)
            .eq('category', 'pioneer')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found' meaning no posts yet
            throw fetchError;
        }

        if (lastPost) {
            const lastPostDate = new Date(lastPost.created_at);
            const now = new Date();
            const daysSinceLastPost = (now.getTime() - lastPostDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastPost < 7) {
                const daysRemaining = Math.ceil(7 - daysSinceLastPost);
                return NextResponse.json({
                    error: `Rate limit exceeded. You can post again in ${daysRemaining} day(s).`
                }, { status: 429 });
            }
        }

        // 3. Insert Bulletin
        const { data: bulletin, error: insertError } = await supabaseAdmin
            .from('bulletins')
            .insert({
                title: title.trim(),
                content: content.trim(),
                category: 'pioneer',
                author: authorAddress,
                is_pinned: false
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 4. Handle Attachment
        if (attachment && bulletin) {
            const { error: aError } = await supabaseAdmin
                .from('bulletin_attachments')
                .insert({
                    bulletin_id: bulletin.id,
                    file_name: attachment.fileName,
                    file_url: attachment.fileUrl,
                    file_size: attachment.fileSize,
                    mime_type: attachment.mimeType
                });

            if (aError) {
                console.error("Failed to insert attachment meta", aError);
                // Non-fatal error, main post is created
            }
        }

        return NextResponse.json({ success: true, bulletin });
    } catch (error: any) {
        console.error('Pioneer post error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
