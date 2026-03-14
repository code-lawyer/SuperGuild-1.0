-- badge_lore: narrative content for each Privilege NFT
-- Stores origin stories, design symbolism, and world-building lore
-- Separated from on-chain mechanic attributes (privilege field in nft-config.ts)

CREATE TABLE IF NOT EXISTS badge_lore (
    token_id    INTEGER PRIMARY KEY,          -- maps to PRIVILEGE_NFT.tokens[*].id
    name_zh     TEXT NOT NULL DEFAULT '',
    name_en     TEXT NOT NULL DEFAULT '',
    origin_zh   TEXT NOT NULL DEFAULT '',     -- 起源故事（中文）
    origin_en   TEXT NOT NULL DEFAULT '',     -- origin story (English)
    symbolism_zh TEXT NOT NULL DEFAULT '',    -- 设计寓意（中文）
    symbolism_en TEXT NOT NULL DEFAULT '',    -- design symbolism (English)
    lore_zh     TEXT NOT NULL DEFAULT '',     -- 世界观叙述（中文）
    lore_en     TEXT NOT NULL DEFAULT '',     -- world-building lore (English)
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed rows for all 5 Privilege NFTs (content editable via admin panel)
INSERT INTO badge_lore (token_id, name_zh, name_en) VALUES
    (1, '拓世者纪念章', 'Pioneer Memorial'),
    (2, '提灯人枯盏', 'Lantern Keeper''s Withered Lamp'),
    (3, '初火',        'The First Flame'),
    (4, '公义之手',    'Hand of Justice'),
    (5, '先驱者灯塔',  'Beacon of the Forerunner')
ON CONFLICT (token_id) DO NOTHING;

-- RLS: anyone can read, only service_role can write
ALTER TABLE badge_lore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badge_lore_public_read"
    ON badge_lore FOR SELECT
    USING (true);
