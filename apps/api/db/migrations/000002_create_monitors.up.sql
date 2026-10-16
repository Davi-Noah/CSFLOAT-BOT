CREATE TABLE monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    skin TEXT NOT NULL,
    min_price_cents BIGINT NOT NULL CHECK (min_price_cents >= 0),
    max_price_cents BIGINT NOT NULL CHECK (max_price_cents >= min_price_cents),
    max_float DOUBLE PRECISION NOT NULL CHECK (max_float >= 0 AND max_float <= 1),
    min_discount DOUBLE PRECISION NOT NULL CHECK (min_discount >= 0 AND min_discount <= 100),
    item_type TEXT NOT NULL CHECK (item_type IN ('Any', 'Normal', 'StatTrak', 'Souvenir')),
    listing_type TEXT NOT NULL CHECK (listing_type IN ('Any', 'Buy now', 'Auction')),
    scan_interval_seconds INTEGER NOT NULL CHECK (scan_interval_seconds >= 30),
    destinations TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX monitors_user_id_idx ON monitors(user_id);

INSERT INTO monitors (
    user_id, name, skin, min_price_cents, max_price_cents, max_float,
    min_discount, item_type, listing_type, scan_interval_seconds, destinations, is_active
)
SELECT id, 'AK-47 low float', 'AK-47', 2000, 12000, 0.18, 15, 'Normal', 'Buy now', 30, ARRAY['Deals HQ', 'Personal alerts'], TRUE
FROM users WHERE discord_user_id = 'local-preview'
UNION ALL
SELECT id, 'High discount finds', 'Any skin', 1000, 8000, 1, 25, 'Any', 'Buy now', 60, ARRAY['Personal alerts'], TRUE
FROM users WHERE discord_user_id = 'local-preview'
UNION ALL
SELECT id, 'AWP collection', 'AWP', 3000, 30000, 0.35, 10, 'Any', 'Any', 3600, ARRAY['Deals HQ'], FALSE
FROM users WHERE discord_user_id = 'local-preview';

