# Database Performance Optimization

## Indexing Strategy

- **B-Tree (Default):** Use for unique values, range queries (`<`, `>`), and equality (`=`). Target Foreign Keys and `WHERE` clause columns.
- **GIN (JSONB/Text):** Use for:
  - Full usage of JSONB querying (`data @> '{"status": "ok"}'`).
  - Full-text search (`to_tsvector`).
- **BRIN (Time-Series):** Use for large tables sorted by date (e.g., logs). Much smaller index size.

### ⚠️ Performance Traps

- **Over-Indexing:** Every index slows down `INSERT` and `UPDATE`. Only index fields you actually query.
- **Function Calls in WHERE:** `WHERE lower(email) = '...'` does NOT use an index on `email`. You need a functional index or store it lowercase.

## Query Tuning

### EXPLAIN ANALYZE

Always run `EXPLAIN ANALYZE` on slow queries to see the execution plan.

- **Sequential Scan:** Bad on large tables. Means it reads every row. Needs an index.
- **Index Scan:** Good. Finds specific rows using the B-Tree.
- **Loop Join:** Can be slow on large datasets.

### Optimization Tips

1.  **Select Specific Columns:** `supabase.from('users').select('id, name')` is significantly faster than `select('*')` if the table has large JSON/Text fields (TOASTed values).
2.  **Pagination:** Use cursor-based pagination (using `created_at` or `id`) for infinite scrolls. Offset pagination (`LIMIT 10 OFFSET 10000`) gets slower as offset increases.
3.  **Count Estimates:** Precise `count(*)` is slow on Postgres. For scaling, use estimated counts for totals if exactness isn't critical.

## Connection Management in Supabase

- **Supabase-js Client:** Uses REST API (PostgREST), which handles connection pooling automatically. Safe for serverless.
- **Direct Connection:** If using a direct Postgres connection strings (e.g. Prisma), use the **Transaction Pooler** (port 6543) in Serverless environments to avoid "Too many connections" errors.
- **Session Pooler:** Use (port 5432) only for long-lived servers (VPS, EC2).
