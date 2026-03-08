'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/utils/supabase/client';

export function useSyncProfile() {
    const { address, isConnected } = useAccount();
    const hasSynced = useRef(false);
    const retryCount = useRef(0);

    useEffect(() => {
        if (isConnected && address && !hasSynced.current) {
            let cancelled = false;

            const syncProfileToSupabase = async () => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .upsert(
                            { wallet_address: address },
                            { onConflict: 'wallet_address' }
                        );

                    if (cancelled) return;

                    if (error) {
                        console.error('[useSyncProfile] Upsert Error:', error);
                        // Retry once after 3s on failure
                        if (retryCount.current < 1) {
                            retryCount.current++;
                            setTimeout(() => { if (!cancelled) syncProfileToSupabase(); }, 3000);
                        }
                    } else {
                        hasSynced.current = true;
                        retryCount.current = 0;
                    }
                } catch (err) {
                    console.error('[useSyncProfile] Unknown Error:', err);
                }
            };

            syncProfileToSupabase();
            return () => { cancelled = true; };
        } else if (!isConnected) {
            hasSynced.current = false;
            retryCount.current = 0;
        }
    }, [isConnected, address]);
} 
