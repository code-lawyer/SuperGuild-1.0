import { createClient } from '@supabase/supabase-js';

// Ensure this is only imported on the server side
if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin cannot be imported on the client side.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vercel build phase workaround
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseServiceRoleKey || 'placeholder-key';

export const supabaseAdmin = createClient(finalUrl, finalKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
