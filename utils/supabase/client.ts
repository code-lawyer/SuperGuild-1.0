import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** The default anonymous Supabase client (read-only after RLS is enabled) */
export const anonClient = createClient(supabaseUrl, supabaseKey);

/**
 * Mutable active client reference.
 * AuthProvider swaps this to an authenticated client after wallet signature.
 * All code using `supabase.from(...)` automatically picks up the switch.
 */
let _activeClient: SupabaseClient = anonClient;

/**
 * Proxy-based Supabase client that delegates all calls to the active client.
 *
 * This allows all existing `import { supabase } from '@/utils/supabase/client'`
 * references to seamlessly switch from anon → authenticated without any code changes.
 */
export const supabase = new Proxy(anonClient as SupabaseClient, {
    get(_target, prop, _receiver) {
        const value = (_activeClient as any)[prop];
        if (typeof value === 'function') {
            return value.bind(_activeClient);
        }
        return value;
    },
});

/** Called by AuthProvider when user signs in with wallet */
export function setActiveSupabaseClient(client: SupabaseClient) {
    _activeClient = client;
}

/** Called by AuthProvider on sign-out or disconnect */
export function resetSupabaseClient() {
    _activeClient = anonClient;
}
