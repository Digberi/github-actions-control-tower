-- Expand-only: the previous application version remains compatible.
CREATE TABLE IF NOT EXISTS demo_orders (
  id uuid PRIMARY KEY,
  idempotency_key text UNIQUE,
  request_hash text NOT NULL,
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now()
);
