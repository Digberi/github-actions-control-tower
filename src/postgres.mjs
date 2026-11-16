import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { calculateTotal } from "./domain.mjs";

/**
 * PostgreSQL-backed repository. Real transactions, real uniqueness/locking,
 * real cross-request idempotency; no fake DB and no cloud resources.
 */
export function makePostgresOrderStore(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL required");
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 3000 });
  const store = {
    async migrate() {
      await pool.query(`CREATE TABLE IF NOT EXISTS demo_orders (
        id uuid PRIMARY KEY,
        idempotency_key text UNIQUE,
        request_hash text NOT NULL,
        total_cents bigint NOT NULL CHECK (total_cents >= 0),
        status text NOT NULL DEFAULT 'created',
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    },
    async ready() {
      try {
        await pool.query("SELECT 1");
        return true;
      } catch {
        return false;
      }
    },
    async create(items, key) {
      const totalCents = calculateTotal(items);
      const requestHash = createHash("sha256").update(JSON.stringify(items)).digest("hex");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const id = randomUUID();
        const inserted = await client.query(
          `INSERT INTO demo_orders (id, idempotency_key, request_hash, total_cents)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (idempotency_key) DO NOTHING
           RETURNING id, status, total_cents, request_hash`,
          [id, key ?? null, requestHash, totalCents]
        );
        let row = inserted.rows[0];
        if (!row && key !== undefined) {
          const found = await client.query(
            "SELECT id, status, total_cents, request_hash FROM demo_orders WHERE idempotency_key = $1",
            [key]
          );
          row = found.rows[0];
          if (row?.request_hash !== requestHash) {
            const error = new Error("idempotency_key_conflict");
            error.statusCode = 409;
            throw error;
          }
        }
        if (!row) throw new Error("database_insert_failed");
        await client.query("COMMIT");
        return {
          orderId: row.id,
          status: row.status,
          totalCents: Number(row.total_cents)
        };
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async get(id) {
      const found = await pool.query(
        "SELECT id, status, total_cents FROM demo_orders WHERE id = $1",
        [id]
      );
      const row = found.rows[0];
      return row ? { orderId: row.id, status: row.status, totalCents: Number(row.total_cents) } : null;
    },
    async close() {
      await pool.end();
    }
  };
  return store;
}
