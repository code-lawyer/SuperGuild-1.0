const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres:Lan%40tsinghua911926@db.zrwyfcdnbfqkbsatwodc.supabase.co:5432/postgres",
    });

    try {
        await client.connect();
        console.log("Fixing RLS policies for service_access...");

        const sql = `
      -- Allow anonymous inserts for the MVP to create service access purchases
      DROP POLICY IF EXISTS "Public service_access are insertable by everyone." ON public.service_access;
      CREATE POLICY "Public service_access are insertable by everyone." 
        ON public.service_access FOR INSERT WITH CHECK (true);
    `;

        await client.query(sql);
        console.log("RLS Fixed! Users can now purchase services from the frontend.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
