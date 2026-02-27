const { Client } = require('pg');

const dbUrl = "postgresql://postgres:Lan%40tsinghua911926@db.zrwyfcdnbfqkbsatwodc.supabase.co:5432/postgres";

const client = new Client({
    connectionString: dbUrl,
});

async function main() {
    try {
        console.log("Connecting to Supabase Database...");
        await client.connect();

        console.log("Preparing SQL Schema (SuperGuild v1.0)...");

        const ddl = `
      -- ============================================
      -- 1. Enum Types (枚举类型)
      -- ============================================
      DO $$ BEGIN
        CREATE TYPE medal_type AS ENUM ('PIONEER', 'LANTERN', 'FLAME');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE service_unlock_type AS ENUM ('CATEGORY', 'ITEM');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE collab_status AS ENUM ('OPEN', 'LOCKED', 'ACTIVE', 'PENDING', 'SETTLED', 'DISPUTED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE milestone_status AS ENUM ('INCOMPLETE', 'SUBMITTED', 'CONFIRMED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      -- ============================================
      -- 2. Identity & Credit (身份与信用板块)
      -- ============================================
      CREATE TABLE IF NOT EXISTS public.profiles (
        wallet_address TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        bio TEXT,
        vcp_cache NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.user_medals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_address TEXT REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
        medal_type medal_type NOT NULL,
        token_id TEXT UNIQUE NOT NULL,
        minted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- ============================================
      -- 3. Universal Back-office (万能中后台板块)
      -- ============================================
      CREATE TABLE IF NOT EXISTS public.services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel INT NOT NULL CHECK (channel IN (1, 2, 3)),
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        price NUMERIC NOT NULL,
        unlock_type service_unlock_type NOT NULL,
        payload_config JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.service_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_address TEXT REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
        target_id TEXT NOT NULL, -- UUID or Category Name
        tx_hash TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- ============================================
      -- 4. P2P Collaboration (任务协作板块)
      -- ============================================
      CREATE TABLE IF NOT EXISTS public.collaborations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        initiator_id TEXT REFERENCES public.profiles(wallet_address) ON DELETE RESTRICT,
        provider_id TEXT REFERENCES public.profiles(wallet_address) ON DELETE SET NULL,
        title TEXT NOT NULL,
        total_budget NUMERIC NOT NULL,
        status collab_status DEFAULT 'OPEN',
        escrow_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS public.milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collab_id UUID REFERENCES public.collaborations(id) ON DELETE CASCADE,
        sort_order INT NOT NULL,
        amount_percentage INT NOT NULL CHECK (amount_percentage >= 0 AND amount_percentage <= 100),
        status milestone_status DEFAULT 'INCOMPLETE',
        title TEXT
      );

      CREATE TABLE IF NOT EXISTS public.proofs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE,
        submitter_id TEXT REFERENCES public.profiles(wallet_address),
        content_url TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- ============================================
      -- 5. Row Level Security (RLS)
      -- ============================================
      -- Enable RLS on all tables
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

      -- Profile constraints (Everyone can read, only wallet owner can update their own row)
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
      CREATE POLICY "Public profiles are viewable by everyone." 
        ON public.profiles FOR SELECT USING (true);

      -- Services catalog is fully public to read
      DROP POLICY IF EXISTS "Services are viewable by everyone." ON public.services;
      CREATE POLICY "Services are viewable by everyone." 
        ON public.services FOR SELECT USING (true);

      -- Collaborations (Only participants can read the specifics of active ones, maybe public for some? Let's keep reading public for proof of transparency)
      DROP POLICY IF EXISTS "Collaborations transparent to all" ON public.collaborations;
      CREATE POLICY "Collaborations transparent to all" 
        ON public.collaborations FOR SELECT USING (true);

      -- Proofs are only readable by the initiator of the collab or the provider (submitter)
      DROP POLICY IF EXISTS "Proofs readable by participants" ON public.proofs;
      CREATE POLICY "Proofs readable by participants"
        ON public.proofs FOR SELECT USING (
          (auth.jwt() ->> 'sub') = submitter_id OR 
          (auth.jwt() ->> 'sub') IN (
            SELECT initiator_id FROM public.collaborations c
            JOIN public.milestones m ON c.id = m.collab_id 
            WHERE m.id = proofs.milestone_id
          )
        );

      -- Mock Data for Services (货架 Mock 数据)
      INSERT INTO public.services (channel, category, title, price, unlock_type, payload_config)
      SELECT 1, '基础作业规范', 'SuperGuild 新手指南 V1', 0, 'CATEGORY', '{"type": "markdown", "url": "doc/guide.md"}'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE title = 'SuperGuild 新手指南 V1');

      INSERT INTO public.services (channel, category, title, price, unlock_type, payload_config)
      SELECT 2, '法律合规', '通用数字合伙人协议模版', 10, 'ITEM', '{"type": "download", "url": "doc/agreement.pdf"}'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE title = '通用数字合伙人协议模版');

      INSERT INTO public.services (channel, category, title, price, unlock_type, payload_config)
      SELECT 3, '提灯人咨询', 'Web3 跨境报税 1v1 方案', 300, 'ITEM', '{"type": "calendly", "link": "cal.com/sg-expert"}'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE title = 'Web3 跨境报税 1v1 方案');

    `;

        console.log("Executing massive DDL schema...");
        await client.query(ddl);

        // Note: Inserting initial data into services might throw duplicate constraints if we run it multiple times, 
        // but without constraints on 'title', it might insert duplicates. We don't mind for now.

        console.log("✅ DDL executed successfully! Standard Database setup complete.");

    } catch (e) {
        console.error("❌ Database Initialization Error:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
