import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { supabase } from '@/utils/supabase/client'
import { VCP_TOKEN } from '@/constants/nft-config'
import vcpAbi from '@/constants/VCPTokenV2.json'

const VCP_ADDRESS = VCP_TOKEN.address

/**
 * useVCP — Hybrid VCP hook (Chain-first, Supabase-fallback)
 *
 * 强制跨链读取 Arbitrum Sepolia 上的 VCP 余额，
 * 无论用户当前连接的是什么链。
 */
export function useVCP() {
    const { address, chain } = useAccount()
    const [vcpFallback, setVcpFallback] = useState<number>(0)

    // ─── On-chain read: VCP balance (强制 Arbitrum Sepolia) ───
    const { data: onChainBalance, refetch: refetchBalance } = useReadContract({
        address: VCP_ADDRESS,
        abi: vcpAbi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: VCP_TOKEN.chainId, // 强制跨链查询
        query: { enabled: !!address },
    })

    // ─── On-chain read: Voting power ───
    const { data: votingPower } = useReadContract({
        address: VCP_ADDRESS,
        abi: vcpAbi,
        functionName: 'getVotes',
        args: address ? [address] : undefined,
        chainId: VCP_TOKEN.chainId,
        query: { enabled: !!address },
    })

    // ─── On-chain read: Is locked (ERC-8129) ───
    const { data: isLocked } = useReadContract({
        address: VCP_ADDRESS,
        abi: vcpAbi,
        functionName: 'locked',
        chainId: VCP_TOKEN.chainId,
        query: { enabled: true },
    })

    // ─── Supabase fallback (仅当链上查询不到时) ───
    useEffect(() => {
        if (!address) {
            setVcpFallback(0)
            return
        }

        const fetchVcp = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('vcp_cache')
                .eq('wallet_address', address)
                .single()

            if (data && !error) {
                setVcpFallback(data.vcp_cache || 0)
            }
        }

        fetchVcp()

        // Subscribe to real-time changes
        const channel = supabase.channel(`vcp_updates_${address}`)
        channel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `wallet_address=eq.${address}`,
                },
                (payload) => {
                    if (payload.new && payload.new.vcp_cache !== undefined) {
                        setVcpFallback(payload.new.vcp_cache)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [address])

    // 优先链上数据，fallback 到 Supabase
    const vcp = onChainBalance !== undefined
        ? Number(onChainBalance)
        : vcpFallback

    return {
        vcp,
        votes: votingPower ? Number(votingPower) : 0,
        isLocked: isLocked as boolean | undefined,
        isOnChain: onChainBalance !== undefined,
        refetchBalance,
        contractAddress: VCP_ADDRESS,
    }
}
