-- name: ListMonitors :many
SELECT *
FROM monitors
WHERE user_id = $1
ORDER BY created_at ASC;

-- name: CreateMonitor :one
INSERT INTO monitors (
    user_id, name, skin, min_price_cents, max_price_cents, max_float,
    min_discount, item_type, listing_type, scan_interval_seconds, destinations, is_active
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: UpdateMonitor :one
UPDATE monitors
SET name = $3,
    skin = $4,
    min_price_cents = $5,
    max_price_cents = $6,
    max_float = $7,
    min_discount = $8,
    item_type = $9,
    listing_type = $10,
    scan_interval_seconds = $11,
    destinations = $12,
    is_active = $13,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: SetMonitorActive :one
UPDATE monitors
SET is_active = $3, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteMonitor :execrows
DELETE FROM monitors
WHERE id = $1 AND user_id = $2;

