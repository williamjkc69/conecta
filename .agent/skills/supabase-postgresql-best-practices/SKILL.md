---
name: Supabase & PostgreSQL Senior Best Practices
description: Comprehensive guide for high-performance database design, normalization, security, and query optimization in Supabase.
---

# Supabase & PostgreSQL Senior Best Practices

This skill provides strict guidelines for designing scalable, secure, and performant databases using Supabase and PostgreSQL.

## 📚 Core Documentation

Refer to these specific guides for detailed instructions:

1.  **[Schema Design & Normalization](./schema-design.md)**
    - 3NF vs. Pragmatic Denormalization.
    - JSONB hybrid patterns (Best of both worlds).
    - Primary Key strategies (UUID vs Identity).
    - Foreign Key constraints and cascading.

2.  **[Performance Optimization](./performance.md)**
    - Indexing strategies (B-Tree, GIN, BRIN).
    - Query analysis with `EXPLAIN ANALYZE`.
    - Connection pooling and effectively using Supabase clients.
    - Materialized Views for analytics.

3.  **[Security & RLS](./security.md)**
    - Row Level Security (RLS) policies best practices.
    - Secure Database Functions (`SECURITY DEFINER`).
    - Role management and schemas.

## 🚀 Quick Checklist for Database Changes

Before applying any migration or schema change, verify:

- **Normalization:** Is the data in 3NF? If not, is there a documented performance reason for denormalization?
- **Indexing:** Are foreign keys indexed? Are columns used in `WHERE`, `ORDER BY`, and `JOIN` indexed?
- **RLS:** Is RLS enabled on **every** table? Are policies optimized to avoid recursive checks?
- **Types:** Are specific types used? (e.g., `text` over `varchar`, `timestamptz` over `timestamp`).
- **Constraints:** Are `NOT NULL`, `UNIQUE`, and `CHECK` constraints used to enforce data integrity at the DB level?

## 🛑 Anti-Patterns to Avoid

- **Logic in Application:** Don't do joins in JavaScript. Use Postgres joins or Views.
- **Wide Tables:** Avoid tables with 50+ columns. Split them (1:1 relationship) if some columns are rarely accessed.
- **N+1 Queries:** Never loop over IDs to fetch related data. Use `in()` queries or Supabase joins.
- **Over-Indexing:** Don't index everything. Indexes slow down writes.
- **Select \*:** Always select specific columns `select('id, name')`, especially with big JSONB fields.

---

**Usage:**
Consult this skill when designing schemas, writing complex SQL queries, or debugging slow database performance.
