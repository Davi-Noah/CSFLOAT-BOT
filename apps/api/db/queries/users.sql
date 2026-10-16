-- name: CreateUser :one
INSERT INTO users (discord_user_id, display_name, avatar_url, timezone, currency)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByDiscordID :one
SELECT *
FROM users
WHERE discord_user_id = $1
LIMIT 1;

-- name: EnsurePreviewUser :one
INSERT INTO users (id, discord_user_id, display_name, timezone, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'local-preview', 'Davi Noah', 'America/Fortaleza', 'USD')
ON CONFLICT (discord_user_id) DO UPDATE SET display_name = EXCLUDED.display_name
RETURNING *;
