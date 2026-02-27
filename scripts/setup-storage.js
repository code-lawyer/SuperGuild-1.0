const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres:Lan%40tsinghua911926@db.zrwyfcdnbfqkbsatwodc.supabase.co:5432/postgres",
    });

    try {
        await client.connect();
        console.log("Setting up 'proofs' storage bucket and associated RLS policies...");

        const setupSql = `
      -- 1. Create the 'proofs' bucket if it doesn't exist
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('proofs', 'proofs', true) 
      ON CONFLICT (id) DO UPDATE SET public = true;

      -- 2. Drop existing policies to avoid conflict
      DROP POLICY IF EXISTS "Public Object Insert" ON storage.objects;
      DROP POLICY IF EXISTS "Public Object Select" ON storage.objects;

      -- 3. Create RLS policies for storage.objects
      -- Allow anonymous users (public) to upload files to 'proofs' for MVP
      CREATE POLICY "Public Object Insert" ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'proofs');

      -- Allow public reads from 'proofs'
      CREATE POLICY "Public Object Select" ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'proofs');

      -- Also fix collaborations table RLS for MVP state transitions (if missing)
      DROP POLICY IF EXISTS "Public collaborations are insertable by everyone." ON public.collaborations;
      CREATE POLICY "Public collaborations are insertable by everyone." 
        ON public.collaborations FOR INSERT WITH CHECK (true);
        
      DROP POLICY IF EXISTS "Public collaborations are updatable by everyone." ON public.collaborations;
      CREATE POLICY "Public collaborations are updatable by everyone." 
        ON public.collaborations FOR UPDATE USING (true);
        
      -- Fix Proofs table RLS
      DROP POLICY IF EXISTS "Public proofs are insertable by everyone." ON public.proofs;
      CREATE POLICY "Public proofs are insertable by everyone." 
        ON public.proofs FOR INSERT WITH CHECK (true);
    `;

        await client.query(setupSql);
        console.log("Successfully created bucket 'proofs' and granted public RLS for MVP uploading!");

    } catch (e) {
        console.error("Failed to setup storage:", e);
    } finally {
        await client.end();
    }
}

main();
