'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

// We get the string of admin wallets from the environment variable. It should be a comma-separated list of addresses.
const adminWalletsEnv = process.env.NEXT_PUBLIC_ADMIN_WALLETS || '';
const ADMIN_WALLETS = adminWalletsEnv.split(',').map(addr => addr.trim().toLowerCase());

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isConnected, address } = useAccount();
    const router = useRouter();
    const { openConnectModal } = useConnectModal();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!isConnected && openConnectModal) {
            openConnectModal();
            return;
        }

        if (isConnected && address) {
            const isAuthorized = ADMIN_WALLETS.includes(address.toLowerCase());
            if (!isAuthorized) {
                // Redirect to home if not an admin
                router.push('/');
            }
        }
    }, [mounted, isConnected, address, router, openConnectModal]);

    // Prevent flash of unauthorized content
    if (!mounted) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!isConnected) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">Please connect wallet to access Admin Panel</div>;

    const isAuthorized = address && ADMIN_WALLETS.includes(address.toLowerCase());
    if (!isAuthorized) return <div className="min-h-screen flex flex-col items-center justify-center text-red-500">Access Denied. You are not an administrator.</div>;

    return <>{children}</>;
}
