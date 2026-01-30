# Schema Design & Normalization

## Normalization Standards

### Third Normal Form (3NF) - Default Target

- **1NF:** Atomic columns (no arrays of complex objects usually, use relations).
- **2NF:** Non-key attributes depend on the _whole_ primary key.
- **3NF:** No transitive dependencies (non-keys don't depend on other non-keys).
  - _Example:_ Don't store `user_email` in an `orders` table if you have `user_id`. Join `users` table instead.

### Pragmatic Denormalization

- **Read-Heavy Data:** It is acceptable to duplicate data if:
  - The data is read 100x more often than written.
  - Historic accuracy is needed (e.g., storing `product_price` on an `order_item` at time of purchase).
- **Materialized Views:** Use `create materialized view` for complex aggregations needed for dashboards. Refresh via triggers or cron.

## Hybrid JSONB Pattern (The "Conecta Standard")

For entities that have both "hot" searchable metadata and "cold" flexible details (replies, logs, analysis), use a hybrid approach:

1.  **Hot Columns (Indexed):** Extract fields used for filtering (`status`, `score`, `category`, `created_at`) into standard, strongly-typed columns.
2.  **Cold Data (JSONB):** Store variable, deep, or rarely-filtered structure in a `data` or `details` JSONB column.

**Example:**

```sql
create table interview_reports (
  id uuid primary key,
  -- Hot Data (Fast Querying)
  candidate_id uuid references profiles(id),
  score decimal(3,1), -- Indexed
  decision text,      -- Indexed

  -- Cold Data (Flexible Storage)
  analysis jsonb      -- Contains { strengths: [], history: [], ... }
);
```

## Primary Keys & IDs

- **UUIDv4:** Recommended default for distributed systems and public-facing IDs. Use `gen_random_uuid()`.
- **BigInt Identity:** Use `bigint generated always as identity` only for internal, high-volume logs or timeseries where insertion speed is critical and IDs are not exposed.

## Constraints & Integrity

- **Foreign Keys:** Always use `references` with `on delete cascade` (or restrict) to maintain referential integrity.
- **Check Constraints:** Use `check (score >= 0 and score <= 10)` to validate data at the source of truth.
- **Enums:** Use Postgres Enums or check constraints for fixed sets of values (e.g., 'pending', 'active', 'archived').
