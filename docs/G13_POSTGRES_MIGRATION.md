# G13 — PostgreSQL migration compatibility, not just a SQL regex

The PR pipeline runs two complementary checks:

1. **Fast static guard:** `node scripts/heavy-gates.mjs G13 green` accepts the
   checked-in additive migration. The `red` fixture contains a destructive
   change and exits non-zero; it is useful for fast lecture demonstration.
2. **Actual PostgreSQL v1/v2 compatibility experiment:**
   `npm run test:postgres` runs both the transactional Orders API check and
   `G13 PostgreSQL: expand keeps v1 alive; early contract breaks it` on a
   real PostgreSQL 16 service container in the PR workflow.

The PostgreSQL test uses a temporary table inside a transaction, so it does
not modify the real `demo_orders` schema or leave test data behind.

| Transition | Query used by still-running v1 | Actual outcome |
|---|---|---|
| v1 schema | `SELECT legacy_code FROM g13_orders WHERE id=1` | success |
| **Expand**: add nullable JSONB metadata | Same v1 query | success |
| **Bad contract**: drop legacy column | Same v1 query | PostgreSQL `42703` (`undefined_column`) |
| Roll back bad DDL to savepoint | Same v1 query | success |

What this proves: removing a column during a rolling deploy can break an old
reader even if an additive change had previously been safe. PostgreSQL itself
rejects the old query; we are not faking an error message in application code.

What this **does not** prove: compatibility of every future migration,
multi-version traffic on Kubernetes, reversibility of migrations after they
commit, or automatic database rollback when an application image rolls back.
The fixture is an isolated schema drill, not a tested online migration of a
live production table. Use an expand → deploy compatible versions → backfill
→ contract rollout for actual databases, with separate DB migration plans.

## For the lecturer

- Show **RED static gate:** `node scripts/heavy-gates.mjs G13 red` (exit 1).
- Show **GREEN static gate:** `node scripts/heavy-gates.mjs G13 green` (exit 0).
- Open the `G08 · Real PostgreSQL transactions and idempotency` job in the PR
  workflow and find both tests in the TAP output. The G13 test *expects*
  PostgreSQL to reject the destructive change, so the encompassing test is
  green; the deliberately negative SQL execution is the teaching evidence.
- Explain why `kubectl rollout undo` restores an image but cannot undo a
  committed database schema change.
