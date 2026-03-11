'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useCallback } from 'react';

/**
 * Hook providing a signed admin action caller.
 * Signs the action message with the connected wallet, then calls the API.
 */
export function useAdminAction() {
    const { address } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const callAdmin = useCallback(async (
        endpoint: string,
        method: 'POST' | 'DELETE',
        action: string,
        payload: Record<string, unknown> = {},
    ) => {
        if (!address) throw new Error('Wallet not connected');

        const message = `SuperGuild Admin Action\nAction: ${action}\nAddress: ${address}`;
        const signature = await signMessageAsync({ message });

        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, address, signature }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Admin action failed');
        return data;
    }, [address, signMessageAsync]);

    return { callAdmin, address };
}
