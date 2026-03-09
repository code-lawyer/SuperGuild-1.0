'use client';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Returns the authenticated Supabase client from AuthProvider.
 * If the user hasn't signed in yet, falls back to the anon client.
 *
 * Usage:
 *   const supabase = useSupabase();
 *   // then use supabase.from('table')...
 *
 * All existing hooks should migrate from:
 *   import { supabase } from '@/utils/supabase/client';
 * to:
 *   const supabase = useSupabase();
 */
export function useSupabase() {
    const { supabase } = useAuth();
    return supabase;
}
