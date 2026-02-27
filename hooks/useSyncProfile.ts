'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/utils/supabase/client';

export function useSyncProfile() {
    const { address, isConnected } = useAccount();
    const hasSynced = useRef(false);

    useEffect(() => {
        // Only sync once per connection to prevent infinite loops or spam
        if (isConnected && address && !hasSynced.current) {
            const syncProfileToSupabase = async () => {
                try {
                    console.log(`[useSyncProfile] Syncing connected wallet: ${address}`);

                    // Upsert the wallet address into the profiles table
                    // According to our DB schema:
                    // wallet_address (PK), username, bio, vcp_cache, created_at
                    const { data, error } = await supabase
                        .from('profiles')
                        .upsert(
                            { wallet_address: address },
                            { onConflict: 'wallet_address' }
                        );

                    if (error) {
                        console.error('[useSyncProfile] Supabase Upsert Error:', error);
                    } else {
                        console.log('[useSyncProfile] Successfully synced profile:', address);
                        hasSynced.current = true;
                    }
                } catch (err) {
                    console.error('[useSyncProfile] Unknown Error:', err);
                }
            };

            syncProfileToSupabase();
        } else if (!isConnected) {
            // Reset the sync flag if they disconnect
            hasSynced.current = false;
        }
    }, [isConnected, address]);
} 
