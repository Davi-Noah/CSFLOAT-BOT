CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'BRL', 'EUR', 'CNY')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, discord_user_id, display_name, timezone, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'local-preview', 'Davi Noah', 'America/Fortaleza', 'USD')
ON CONFLICT (discord_user_id) DO NOTHING;
