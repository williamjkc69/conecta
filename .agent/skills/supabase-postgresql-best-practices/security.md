# Security & Row Level Security (RLS)

## RLS Fundamentals

- **Enable Everywhere:** Run `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` on **every** table.
- **Default Deny:** Without a policy, RLS denies everything. You must explicity allow access.

### Writing Optimimal Policies

- **Avoid Joins in Policies:** Policies run on **every row**. recursive joins in policies kill performance.
  - _Bad:_ `auth.uid() in (select user_id from team_members where ...)`
  - _Better:_ Store `organization_id` on the user's JWT (app_metadata) or session claim to check directly.
- **USING vs WITH CHECK:**
  - `USING`: Who can see the rows (SELECT, UPDATE, DELETE).
  - `WITH CHECK`: Who can create new rows (INSERT) or update to new values.

## Secure Database Functions

### `SECURITY DEFINER` vs `INVOKER`

- **DEFAULT (INVOKER):** Function runs with permissions of the user calling it. If they can't access a table via RLS, the function fails.
- **`SECURITY DEFINER`:** Function runs with permissions of the **creator** (usually postgres/superuser).
  - **Use Case:** Bypassing RLS for specific, controlled actions (e.g., "Delete User" button that cleans up protected logs).
  - **Risk:** Extremely dangerous if not carefully written. Always set `SET search_path = public` to prevent search_path hijacking.

## Role Management

- **Service Role Key:** Has admin access. NEVER expose on client side. Use only in secure server environments (Edge Functions, API Routes).
- **Anon Key:** Client-side key. Restricted by RLS. Safe to expose.

## Data Encryption

- **At Rest:** Supabase encrypts data at rest.
- **Sensitive Fields:** for PII (Social Security, Secrets), consider PGP encryption (pgcrypto) extension or application-level encryption before storing.
