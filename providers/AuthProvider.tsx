'use client';

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    anonClient,
    setActiveSupabaseClient,
    resetSupabaseClient,
} from '@/utils/supabase/client';

// ── Types ──

interface AuthState {
    /** Authenticated Supabase client (falls back to anon client if not signed in) */
    supabase: SupabaseClient;
    /** Whether the user has completed wallet signature auth */
    isAuthenticated: boolean;
    /** Auth is in progress (signing or verifying) */
    isAuthenticating: boolean;
    /** Trigger sign-in manually */
    signIn: () => Promise<void>;
    /** Clear auth session */
    signOut: () => void;
    /** The wallet address of the authenticated user */
    walletAddress: string | undefined;
}

const AuthContext = createContext<AuthState>({
    supabase: anonClient,
    isAuthenticated: false,
    isAuthenticating: false,
    signIn: async () => {},
    signOut: () => {},
    walletAddress: undefined,
});

export const useAuth = () => useContext(AuthContext);

// ── Helpers ──

const STORAGE_KEY = 'superguild_auth_token';
const STORAGE_EXPIRY_KEY = 'superguild_auth_expiry';

function getStoredToken(): { token: string; expiresAt: number } | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(STORAGE_KEY);
    const expiresAt = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (!token || !expiresAt) return null;

    const exp = parseInt(expiresAt, 10);
    // Token must have at least 5 minutes remaining
    if (Date.now() / 1000 > exp - 300) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
        return null;
    }
    return { token, expiresAt: exp };
}

function storeToken(token: string, expiresAt: number) {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiresAt));
}

function clearStoredToken() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
}

function createAuthenticatedClient(token: string): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    return createClient(url, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ── Provider ──

export function AuthProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authClient, setAuthClient] = useState<SupabaseClient>(anonClient);
    const signInAttempted = useRef(false);
    const currentAddress = useRef<string | undefined>(undefined);

    // Restore session from localStorage on mount or wallet change
    useEffect(() => {
        if (!isConnected || !address) {
            // Wallet disconnected — reset auth
            setIsAuthenticated(false);
            setAuthClient(anonClient);
            resetSupabaseClient();
            clearStoredToken();
            signInAttempted.current = false;
            currentAddress.current = undefined;
            return;
        }

        // If address changed, clear old session
        if (currentAddress.current && currentAddress.current !== address.toLowerCase()) {
            clearStoredToken();
            setIsAuthenticated(false);
            setAuthClient(anonClient);
            resetSupabaseClient();
            signInAttempted.current = false;
        }
        currentAddress.current = address.toLowerCase();

        // Try to restore existing session
        const stored = getStoredToken();
        if (stored) {
            const client = createAuthenticatedClient(stored.token);
            setAuthClient(client);
            setActiveSupabaseClient(client);
            setIsAuthenticated(true);
            signInAttempted.current = true;
        }
    }, [isConnected, address]);

    const signIn = useCallback(async () => {
        if (!isConnected || !address || isAuthenticating) return;

        setIsAuthenticating(true);
        try {
            // 1. Get nonce from server
            const nonceRes = await fetch(`/api/auth/wallet?address=${address}`);
            if (!nonceRes.ok) throw new Error('Failed to get nonce');
            const { nonce } = await nonceRes.json();

            // 2. Ask user to sign the nonce
            const message = `Sign in to SuperGuild\n\nNonce: ${nonce}`;
            const signature = await signMessageAsync({ message });

            // 3. Exchange signature for JWT
            const authRes = await fetch('/api/auth/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, signature, nonce }),
            });

            if (!authRes.ok) {
                const err = await authRes.json();
                throw new Error(err.error || 'Auth failed');
            }

            const { token, expiresAt } = await authRes.json();

            // 4. Create authenticated Supabase client & swap global proxy
            const client = createAuthenticatedClient(token);
            setAuthClient(client);
            setActiveSupabaseClient(client);
            setIsAuthenticated(true);
            storeToken(token, expiresAt);
            signInAttempted.current = true;
        } catch (err) {
            console.error('[AuthProvider] Sign-in failed:', err);
            // Don't block the user — fall back to anon client
        } finally {
            setIsAuthenticating(false);
        }
    }, [isConnected, address, isAuthenticating, signMessageAsync]);

    const signOut = useCallback(() => {
        clearStoredToken();
        setIsAuthenticated(false);
        setAuthClient(anonClient);
        resetSupabaseClient();
        signInAttempted.current = false;
    }, []);

    // Auto sign-in when wallet connects (only once per address)
    useEffect(() => {
        if (isConnected && address && !signInAttempted.current && !isAuthenticated) {
            signInAttempted.current = true;
            signIn();
        }
    }, [isConnected, address, isAuthenticated, signIn]);

    return (
        <AuthContext.Provider
            value={{
                supabase: authClient,
                isAuthenticated,
                isAuthenticating,
                signIn,
                signOut,
                walletAddress: isAuthenticated ? address?.toLowerCase() : undefined,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
